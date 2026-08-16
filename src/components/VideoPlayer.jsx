function VideoPlayer({ video, fullscreen = false }) {
  return (
    <div className={`video-player-card ${fullscreen ? 'fullscreen' : ''}`}>
      <video key={video.id} controls autoPlay={fullscreen} poster={video.thumbnail}>
        <source src={video.src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoPlayer;
