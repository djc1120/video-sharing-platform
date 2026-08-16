function VideoCard({ video, onSelect, isActive, onDelete, onEdit, isEditing }) {
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <div className={`video-card ${isActive ? 'active' : ''} ${isEditing ? 'editing' : ''}`}>
      <button className="video-card-button" onClick={onSelect}>
        <img src={video.thumbnail} alt={video.title} />
        <div className="video-card-body">
          <h4>{video.title}</h4>
          <p>{video.author}</p>
          <span>{video.views.toLocaleString()} views</span>
        </div>
      </button>
      <button className="video-card-edit" onClick={handleEditClick} title="Edit video">
        ✎
      </button>
      <button className="video-card-delete" onClick={handleDeleteClick} title="Delete video">
        ✕
      </button>
    </div>
  );
}

export default VideoCard;
