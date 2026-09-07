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

  INSERT INTO videos
(title, author, views)
VALUES
('Mountain Sunrise', 'Open Media', 23542);
`);



export function getVideos() {
  return db
        .prepare("SELECT * FROM videos")
        .all();
}


export function createVideo(video) {
    const { title, author, views, thumbnail, src, description, createdAt } = video;
    const statement = db.prepare(`
        INSERT INTO videos (title, author, views, thumbnail, src, description, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = statement.run(title, author, views, thumbnail, src, description, createdAt);
    return {
        id: result.lastInsertRowid,
        ...video,
    };
}

export function updateVideo(id, video) {
    const { title, author, thumbnail, src, description } = video;
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
    const result = statement.run(title, author, thumbnail, src, description, id);
    
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
