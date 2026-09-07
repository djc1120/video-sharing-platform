import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVideos, createVideo, updateVideo, deleteVideo } from './data/db.js';

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



app.post('/api/videos', (req, res) => {
  try {
    const { title, author, thumbnail, src, description } = req.body;
    const nextVideo = {
      title: title || 'New Video',
      author: author || 'Creator',
      views: Math.floor(Math.random() * 90000) + 1000,
      thumbnail:
        thumbnail ||
        'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=500&q=60',
      src: src || 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      description: description || 'Uploaded to the platform.',
      createdAt: new Date().toISOString(),
    };

    const createdVideo = createVideo(nextVideo);
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
