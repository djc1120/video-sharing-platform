import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const videosPath = path.join(__dirname, 'data', 'videos.json');

const readVideos = () => JSON.parse(fs.readFileSync(videosPath, 'utf8'));
const writeVideos = (videos) => fs.writeFileSync(videosPath, JSON.stringify(videos, null, 2));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/videos', (req, res) => {
  try {
    const videos = readVideos();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load videos from storage.' });
  }
});

app.post('/api/videos', (req, res) => {
  try {
    const { title, author, thumbnail, src, description } = req.body;
    const videos = readVideos();
    const nextVideo = {
      id: Date.now(),
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

    const updatedVideos = [nextVideo, ...videos];
    writeVideos(updatedVideos);
    res.status(201).json(nextVideo);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save the video.' });
  }
});

app.put('/api/videos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, thumbnail, src, description } = req.body;
    const videos = readVideos();
    const videoIndex = videos.findIndex((v) => v.id === parseInt(id));

    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    videos[videoIndex] = {
      ...videos[videoIndex],
      title: title || videos[videoIndex].title,
      author: author || videos[videoIndex].author,
      thumbnail: thumbnail || videos[videoIndex].thumbnail,
      src: src || videos[videoIndex].src,
      description: description || videos[videoIndex].description,
    };

    writeVideos(videos);
    res.json(videos[videoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Unable to update the video.' });
  }
});

app.delete('/api/videos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const videos = readVideos();
    const videoIndex = videos.findIndex((v) => v.id === parseInt(id));

    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    const deletedVideo = videos[videoIndex];
    const updatedVideos = videos.filter((v) => v.id !== parseInt(id));
    writeVideos(updatedVideos);
    res.json({ message: 'Video deleted.', video: deletedVideo });
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
