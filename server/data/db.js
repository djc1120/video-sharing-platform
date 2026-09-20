import Database from "better-sqlite3";

const db = new Database("videos.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    views INTEGER,
    thumbnail TEXT,
    src TEXT,
    description TEXT,
    createdAt TEXT
  );
`
);



export function getVideos() {
  return db
        .prepare("SELECT * FROM videos")
        .all();
}


export function createVideo(video) {
  const nextVideo = {
    title: video.title || 'New Video',
    author: video.author || 'Creator',
    views: video.views ?? Math.floor(Math.random() * 90000) + 1000,
    thumbnail:
      video.thumbnail ||
      'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=500&q=60',
    src:
      video.src ||
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description: video.description || 'Uploaded to the platform.',
    createdAt: video.createdAt || new Date().toISOString(),
  };

  const statement = db.prepare(`
    INSERT INTO videos (
      title,
      author,
      views,
      thumbnail,
      src,
      description,
      createdAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    nextVideo.title,
    nextVideo.author,
    nextVideo.views,
    nextVideo.thumbnail,
    nextVideo.src,
    nextVideo.description,
    nextVideo.createdAt
  );

  return {
    id: result.lastInsertRowid,
    ...nextVideo,
  };
}

export function updateVideo(id, video) {
    const existingVideo = db
    .prepare('SELECT * FROM videos WHERE id = ?')
    .get(id);

    if (!existingVideo) {
    return null;
    }
    
    const updatedVideo = {
    ...existingVideo,
    ...video
    };

    const statement = db.prepare(`
        UPDATE videos
        SET 
            title = ?,
            author = ?,
            thumbnail = ?,
            src = ?,
            description = ?
        WHERE id = ?
    `);
    const result = statement.run(
        updatedVideo.title,
        updatedVideo.author,
        updatedVideo.thumbnail,
        updatedVideo.src,
        updatedVideo.description,
        id
    );
    
    if (result.changes > 0) {
        return db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
    }
    return null;    
}

export function deleteVideo(id) {
    const video = db
        .prepare(`
            SELECT *
            FROM videos
            WHERE id = ?
        `)
        .get(id);

    if (!video) {
        return null;
    }

    db
        .prepare(`
            DELETE FROM videos
            WHERE id = ?
        `)
        .run(id);

    return video;
}




export default db;
