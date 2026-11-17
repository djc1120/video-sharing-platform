import OpenAI from 'openai';
import {
  fileTools,
  fileToolFunctions,
} from './fileToolDefinitions.js';
import {
  videoTools,
  videoToolFunctions
} from './videoToolDefinitions.js';
import { createMessage, getMessages, createMemory, getMemories, updateMemory, getConversation, updateConversationSummary } from '../data/db.js';
import { createEmbedding } from './embeddings.js';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const toolFunctions = {
  ...fileToolFunctions,
  ...videoToolFunctions
};

const tools = [
  ...fileTools,
  ...videoTools
];





async function updateSummary(conversationId) {
  const conversation = getConversation(conversationId);

  const messages = getMessages(conversationId);

  const summarizedThroughMessageId =
    conversation.summarizedThroughMessageId ?? 0;

  const unsummarizedMessages = messages.filter((message) => {
    return message.id > summarizedThroughMessageId;
  });

  const messagesToSummarize = unsummarizedMessages.slice(0, -20);

  if (messagesToSummarize.length < 10) {
    return;
  }

  const summaryChunk = messagesToSummarize.slice(0, 10);

  const textToSummarize = summaryChunk
    .map((message) => {
      return `${message.role}: ${message.content}`;
    })
    .join('\n');

    const existingSummary = conversation.summary ?? '';

    const response = await openai.responses.create({
      model: 'gpt-5.6-luna',
      input: `
        Existing conversation summary:
        ${existingSummary}

        New older messages to incorporate:
        ${textToSummarize}

        Update the conversation summary to incorporate the new messages.
        Preserve important context that may be needed later.
      `
    });

    const newSummary = response.output_text;

    const lastMessage = summaryChunk[summaryChunk.length - 1];
    const newSummarizedThroughMessageId = lastMessage.id;

    updateConversationSummary(
      conversationId,
      newSummary,
      newSummarizedThroughMessageId
    );

}



function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, number, index) => {
    return sum + number * b[index];
  }, 0);

  const squaredSumA = a.reduce((sum, number) => {
    return sum + number * number;
  }, 0);

  const magnitudeA = Math.sqrt(squaredSumA);

  const squaredSumB = b.reduce((sum, number) => {
    return sum + number * number;
  }, 0);

  const magnitudeB = Math.sqrt(squaredSumB);

  const similarity = dotProduct / (magnitudeA * magnitudeB);

  return similarity;
}



async function searchMemories(message) {
  const queryEmbedding = await createEmbedding(message);
  const memories = getMemories();

  const scoredMemories = memories.map((memory) => {
    const memoryEmbedding = JSON.parse(memory.embedding);

    const similarity = cosineSimilarity(
      queryEmbedding,
      memoryEmbedding
    );

    return {
      ...memory,
      similarity
    };
  });

  scoredMemories.sort((a, b) => {
    return b.similarity - a.similarity;
  });
  
  const minimumSimilarity = 0.5;

  const relevantMemories = scoredMemories.filter((memory) => {
    return memory.similarity >= minimumSimilarity;
  });

  return relevantMemories.slice(0, 3);
}


const testMemories = await searchMemories(
  'What is the capital of France?'
);






async function evaluateMemory(message) {

  const memories = getMemories();
  const memoryText = memories
  .map((memory) => {
    return `${memory.id}: ${memory.content}`;
  })
  .join('\n');

  const response = await openai.responses.create({
    model: 'gpt-5.4-mini',

    input: `
      Compare the user's new message with the existing long-term memories.

      Choose one action:

      CREATE - The message contains useful durable information that is not
      already represented in the existing memories.

      UPDATE - The message changes, corrects, or replaces an existing memory.
      Return the ID of the memory that should be updated.

      IGNORE - The message does not contain useful durable information, or the
      information is already represented in the existing memories.

      Existing memories:
      ${memoryText}

      New user message:
      ${message}
    `,

    text: {
      format: {
        type: 'json_schema',
        name: 'memory_evaluation',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['CREATE', 'UPDATE', 'IGNORE']
            },
            memoryId: {
              type: ['integer', 'null']
            },
            memory: {
              type: ['string', 'null']
            }
        },
          required: ['action', 'memoryId', 'memory'],
          additionalProperties: false
        }
      }
    }
  });

    

  const result = JSON.parse(response.output_text);
  console.log('Memory decision:', result);

  if (result.action === 'CREATE' && result.memory) {
    const embedding = await createEmbedding(result.memory);

    createMemory(result.memory, embedding);
  }

  if (result.action === 'UPDATE' && result.memoryId && result.memory) {
    const embedding = await createEmbedding(result.memory);

    updateMemory(result.memoryId, result.memory, embedding);
  }

  
}





async function askLLM(conversationId, message) {

    createMessage(conversationId, 'user', message);
    const messages = getMessages(conversationId);
    const conversation = getConversation(conversationId);

    const memories = await searchMemories(message);

    const summarizedThroughMessageId =
    conversation.summarizedThroughMessageId ?? 0;

    const unsummarizedMessages = messages.filter((message) => {
      return message.id > summarizedThroughMessageId;
    });



    let history = unsummarizedMessages.map((message) => {
    return {
        role: message.role,
        content: message.content
    };
    });

    const memoryContents = memories.map((memory) => {
        return memory.content;
    });

    const memoryText = memoryContents.join('\n');

    if (memories.length > 0) {
        history = [
          {
              role: 'system',
              content: `Long-term memories about the user:\n${memoryText}`
          },
          ...history
        ];
    }

    if (conversation.summary) {
      history = [
        {
          role: 'system',
          content: `Summary of earlier parts of this conversation:\n${conversation.summary}`
        },
        ...history
      ];
    }
    
  const response = await openai.responses.create({
    model: 'gpt-5.4-mini',
    input: history,
    tools: tools,
  });

  let currentResponse = response;

  while (true) {
    const toolCalls = currentResponse.output.filter(
  (item) => item.type === 'function_call'
);

if (toolCalls.length === 0) {
    createMessage(conversationId, 'assistant', currentResponse.output_text);

    await updateSummary(conversationId);

    await evaluateMemory(message);

    return currentResponse.output_text;
}

const toolOutputs = toolCalls.map((toolCall) => {
    const toolFunction = toolFunctions[toolCall.name];
    const args = JSON.parse(toolCall.arguments);
    
    try {
      const result = toolFunction(args);

      return {
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify(result),
      };

    } catch (error) {

      return {
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify({
          error: error.message
        }),
      };
}
});

  const nextResponse = await openai.responses.create({
    model: 'gpt-5.6-luna',
    previous_response_id: currentResponse.id,
    input: toolOutputs,
    tools,
  });

  currentResponse = nextResponse;
  }

}


export {
  askLLM
};

