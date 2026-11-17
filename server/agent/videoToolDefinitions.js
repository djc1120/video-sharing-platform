import {
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo
} from '../data/db.js';



const videoToolFunctions = {
  getVideos: () => getVideos(),
  createVideo: (args) => createVideo(args),
  updateVideo: (args) => {
    const { id, ...video } = args;
    return updateVideo(id, video);
  },
  deleteVideo: (args) => deleteVideo(args.id),
};

const videoTools = [
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
      },
];


export {
  videoTools,
  videoToolFunctions
};