import { useEffect, useMemo, useState } from 'react';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';

function App() {
  const [videos, setVideos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', thumbnail: '', src: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
 
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/videos');
        if (!response.ok) {
          throw new Error('Could not load videos.');
        }
        const data = await response.json();
        setVideos(data);
        setSelectedId(data[0]?.id ?? null);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedId) || videos[0] || null,
    [selectedId, videos],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.src.trim()) {
      setFormError('Title and Video URL are required fields.');
      return;
    }

    const videoData = {
      title: form.title,
      author: form.author || 'Creator',
      thumbnail: form.thumbnail || 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=500&q=60',
      src: form.src,
      description: form.description || 'Uploaded to the platform.',
    };

    try {
      if (isEditing) {
        // Update existing video
        const response = await fetch(`/api/videos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoData),
        });

        if (!response.ok) {
          throw new Error('Update failed.');
        }

        const updatedVideo = await response.json();
        setVideos((currentVideos) =>
          currentVideos.map((v) => (v.id === editingId ? updatedVideo : v))
        );
        setFormError(null);
        setIsEditing(false);
        setEditingId(null);
        setForm({ title: '', author: '', thumbnail: '', src: '', description: '' });
      } else {
        // Create new video
        const response = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoData),
        });

        if (!response.ok) {
          throw new Error('Upload failed.');
        }

        const createdVideo = await response.json();
        setVideos((currentVideos) => [createdVideo, ...currentVideos]);
        setForm({ title: '', author: '', thumbnail: '', src: '', description: '' });
        setSelectedId(createdVideo.id);
        setFormError(null);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEditVideo = (video) => {
    setForm({
      title: video.title,
      author: video.author,
      thumbnail: video.thumbnail,
      src: video.src,
      description: video.description,
    });
    setIsEditing(true);
    setEditingId(video.id);
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ title: '', author: '', thumbnail: '', src: '', description: '' });
    setFormError(null);
  };

  const handleVideoSelect = (id) => {
    setSelectedId(id);
    setIsFullscreen(true);
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed.');
      }

      setVideos((currentVideos) => currentVideos.filter((v) => v.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setIsFullscreen(false);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>VideoShare</h1>
          <p>Create, browse, and watch videos on desktop.</p>
        </div>
      </header>

      <main className="content-grid">
        <section className="home-section">
          <div className="home-header">
            <div>
              <h2>Uploaded Videos</h2>
              <p>Click any video to watch it in full screen.</p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <h3>Loading videos…</h3>
            </div>
          ) : loadError ? (
            <div className="empty-state">
              <h3>Could not load videos</h3>
              <p>{loadError}</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="empty-state">
              <h3>No videos uploaded yet</h3>
              <p>Upload your first video and it will appear here in a 3-column layout.</p>
            </div>
          ) : (
            <div className="video-grid">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isActive={video.id === selectedId}
                  onSelect={() => handleVideoSelect(video.id)}
                  onDelete={() => handleDeleteVideo(video.id)}
                  onEdit={() => handleEditVideo(video)}
                  isEditing={isEditing && editingId === video.id}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="sidebar">
          <div className="upload-card">
            <h3>{isEditing ? 'Edit Video' : 'Upload New Video'}</h3>
            {formError && <div className="error-message">{formError}</div>}
            <form onSubmit={handleSubmit} className="upload-form">
              <label>
                Title <span className="required">(Required)</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Video title"
                />
              </label>
              <label>
                Author
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Your name"
                />
              </label>
              <label>
                Thumbnail URL
                <input
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              <label>
                Video URL <span className="required">(Required)</span>
                <input
                  value={form.src}
                  onChange={(e) => setForm({ ...form, src: e.target.value })}
                  placeholder="https://...mp4"
                />
              </label>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description"
                />
              </label>
              <div className="form-buttons">
                <button type="submit">{isEditing ? 'Save Changes' : 'Upload Video'}</button>
                {isEditing && (
                  <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </aside>
      </main>

      {isFullscreen && selectedVideo && (
        <div className="fullscreen-overlay">
          <div className="fullscreen-topbar">
            <button type="button" className="back-button" onClick={handleCloseFullscreen}>
              ← Back
            </button>
            <div className="fullscreen-meta">
              <h3>{selectedVideo.title}</h3>
              <p>{selectedVideo.author} • {selectedVideo.views.toLocaleString()} views</p>
            </div>
          </div>
          <div className="fullscreen-player">
            <VideoPlayer video={selectedVideo} fullscreen />
            <div className="fullscreen-description">{selectedVideo.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
