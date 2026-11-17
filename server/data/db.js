import Database from "better-sqlite3";

const db = new Database("videos.db");







db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    embedding TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);



export function updateConversationSummary(conversationId, summary, summarizedThroughMessageId) {
  const stmt = db.prepare(`
    UPDATE conversations
    SET summary = ?,
        summarizedThroughMessageId = ?
    WHERE id = ?
  `);

  const result = stmt.run(summary, summarizedThroughMessageId, conversationId);

  if (result.changes > 0) {
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
  }
  return null;
}



export function createMemory(content, embedding) {
  const embeddingText = JSON.stringify(embedding);

  const stmt = db.prepare(`
    INSERT INTO memories (content, embedding)
    VALUES (?, ?)
  `);

  const result = stmt.run(content, embeddingText);

  return result.lastInsertRowid;
}


export function getMemories() {
    return db
        .prepare("SELECT * FROM memories")
        .all();
}


export function updateMemory(id, content, embedding) {
    const embeddingText = JSON.stringify(embedding);

    const stmt = db.prepare(`
        UPDATE memories
        SET content = ?, embedding = ?
        WHERE id = ?
    `);

    const result = stmt.run(content, embeddingText, id);

    if (result.changes > 0) {
        return db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
    }
    return null;
}






db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    summarizedThroughMessageId INTEGER,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);


export function createConversation(title) {
  const stmt = db.prepare(`
    INSERT INTO conversations (title)
    VALUES (?)
  `);

  const result = stmt.run(title);
  return result.lastInsertRowid;
}


export function getConversations() {
    return db
        .prepare("SELECT * FROM conversations ORDER BY createdAt DESC")
        .all();
}


export function getConversation(conversationId) {
  return db
    .prepare("SELECT * FROM conversations WHERE id = ?")
    .get(conversationId);
}




db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    conversationId INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);



export function createMessage(conversationId, role, content) {
  const stmt = db.prepare(`
    INSERT INTO messages (conversationId, role, content)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(conversationId, role, content);
}


export function getMessages(conversationId) {
  return db
    .prepare(`
      SELECT * FROM messages
      WHERE conversationId = ?
      ORDER BY id ASC
    `)
    .all(conversationId);
}


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

export function deleteMemory(id) {
const result = db
  .prepare(`
    DELETE FROM memories
    WHERE id = ?
  `)
  .run(id);

return result;
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




