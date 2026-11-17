import {
  readFile,
  writeFile,
  listFiles,
  deleteFile
} from '../tools/fileTools.js';




const fileToolFunctions = {
  readFile: (args) => readFile(args.filename),
  writeFile: (args) => writeFile(args.filename, args.content),
  listFiles: () => listFiles(),
  deleteFile: (args) => deleteFile(args.filename),
};

const fileTools = [
      {
        type: 'function',
        name: 'readFile',
        description: 'Read the contents of a file from the agent workspace.',
        parameters: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'The name of the file to read.',
            },
          },
          required: ['filename'],
        },
      },
      {
        type: 'function',
        name: 'writeFile',
        description: 'Write text content to a file in the agent workspace.',
        parameters: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'The name of the file to write.',
            },
            content: {
              type: 'string',
              description: 'The text content to write into the file.',
            },
          },
          required: ['filename', 'content'],
        },
      },
      {
        type: 'function',
        name: 'listFiles',
        description: 'List all files in the agent workspace.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        type: 'function',
        name: 'deleteFile',
        description: 'Delete a file from the agent workspace.',
        parameters: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'The name of the file to delete.',
            },
          },
          required: ['filename'],
        },
      },
];


export {
  fileTools,
  fileToolFunctions
};