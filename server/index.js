import 'dotenv/config';
import OpenAI from 'openai';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVideos, createVideo, updateVideo, deleteVideo } from './data/db.js';


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const toolFunctions = {
  getVideos: () => getVideos(),
  createVideo: (args) => createVideo(args),
  updateVideo: (args) => {
    const { id, ...video } = args;
    return updateVideo(id, video);
  },
  deleteVideo: (args) => deleteVideo(args.id),
};

const tools = [
      {
        type: 'function',
        name: 'getVideos',
        description: 'Get all videos from the video database.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        type: 'function',
        name: 'createVideo',
        description: 'Create a new video in the video database.',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title of the video.',
            },
            author: {
              type: 'string',
              description: 'The author of the video.',
            },
            thumbnail: {
              type: 'string',
              description: 'The thumbnail image URL.',
            },
            src: {
              type: 'string',
              description: 'The video URL.',
            },
            description: {
              type: 'string',
              description: 'A description of the video.',
            },
          },
          required: ['title', 'src'],
          description:
                      'Create a new video in the video database. Only title and src are required. Author, thumbnail, and description are optional. If optional fields are not provided, call this tool anyway and the application will provide default values.',
        },
      },
      {
        type: 'function',
        name: 'updateVideo',
        description: 'Update an existing video in the video database.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The ID of the video to update.',
            },
            title: {
              type: 'string',
              description: 'The new title of the video.',
            },
            author: {
              type: 'string',
              description: 'The new author of the video.',
            },
            thumbnail: {
              type: 'string',
              description: 'The new thumbnail image URL.',
            },
            src: {
              type: 'string',
              description: 'The new video URL.',
            },
            description: {
              type: 'string',
              description: 'The new description of the video.',
            },
          },
          required: ['id'],
        },
      },
      {
        type: 'function',
        name: 'deleteVideo',
        description: 'Delete an existing video from the video database.',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The ID of the video to delete.',
            },
          },
          required: ['id'],
        },
      }
];

async function askLLM(message) {
  const response = await openai.responses.create({
    model: 'gpt-5.4-mini',
    input: message,
    tools: tools,
  });

  let currentResponse = response;

  console.log(response.output);


  while (true) {
    const toolCall = currentResponse.output.find(
    (item) => item.type === 'function_call'
  );

  if (!toolCall) {
    return currentResponse.output_text;
  }

  const toolFunction = toolFunctions[toolCall.name];
  const args = JSON.parse(toolCall.arguments);
  const result = toolFunction(args);

  const nextResponse = await openai.responses.create({
    model: 'gpt-5.6-luna',
    previous_response_id: currentResponse.id,
    input: [
      {
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify(result),
      },
    ],
    tools,
  });

  currentResponse = nextResponse;

  }
  
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/videos', (req, res) => {
  try {
    const videos = getVideos();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load videos from storage.' });
  }
});

app.post('/api/agent', async (req, res) => {
  try {
    const { message } = req.body;

    const answer = await askLLM(message);

    res.json({
      answer: answer
    });
  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({
      error: 'Unable to get a response from the agent.'
    });
  }
});

app.post('/api/videos', (req, res) => {
  try {
    const createdVideo = createVideo(req.body);

    res.status(201).json(createdVideo);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save the video.' });
  }
});



app.put('/api/videos/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating video', id, ':', req.body);
    
    const updatedVideo = updateVideo(parseInt(id), req.body);

    if (!updatedVideo) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    console.log('Updated:', updatedVideo);
    res.json(updatedVideo);
  } catch (error) {
    console.error('Update video error:', error.message);
    res.status(500).json({ error: 'Unable to update the video.' });
  }
});

app.delete('/api/videos/:id', (req, res) => {
  try {
    const { id } = req.params;

    const deletedVideo = deleteVideo(parseInt(id));

    if (!deletedVideo) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    res.json({
      message: 'Video deleted.',
      video: deletedVideo,
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete the video.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Video service running on http://localhost:${port}`);
});
