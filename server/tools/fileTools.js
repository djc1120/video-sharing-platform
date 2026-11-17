import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspacePath = path.join(__dirname, '..', 'workspace');

function getSafePath(filename) {
  const filePath = path.resolve(workspacePath, filename);

  if (!filePath.startsWith(workspacePath + path.sep)) {
    throw new Error('Access denied: file must be inside the workspace.');
  }

  return filePath;
}


function readFile(filename) {
  const filePath = getSafePath(filename);

  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filename, content) {
  const filePath = getSafePath(filename);
  fs.writeFileSync(filePath, content, 'utf8');
  
  return `Successfully wrote to ${filename}`;
}

function listFiles() {
  return fs.readdirSync(workspacePath);
}

function deleteFile(filename) {
  const filePath = getSafePath(filename);
  fs.unlinkSync(filePath);

  return `Successfully deleted ${filename}`;
}

export {
  readFile,
  writeFile,
  listFiles,
  deleteFile
};