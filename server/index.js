import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVideos, createVideo, updateVideo, deleteVideo, getConversations, createConversation } from './data/db.js';
import { askLLM } from './agent/agent.js';








const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());


app.get('/api/conversations', (req, res) => {
  try {
    const conversations = getConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load conversations from storage.' });
  }
});


app.post('/api/conversations', (req, res) => {
  try {
    const { title } = req.body;

    const conversationId = createConversation(title);

    // What should we send back to React?
    res.status(201).json({ id: conversationId, title });
  } catch (error) {
    res.status(500).json({ error: 'Unable to create conversation.' });
  }
});



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
    const { conversationId, message } = req.body;
    if (!conversationId) {
      return res.status(400).json({
        error: 'conversationId is required.'
      });
    }

    const answer = await askLLM(conversationId, message);

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
