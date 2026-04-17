const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/db/nas-materials.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking materials in database...\n');

db.all('SELECT id, file_name, file_path, folder_type FROM materials ORDER BY id DESC LIMIT 10', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }

  rows.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`  file_name: ${row.file_name}`);
    console.log(`  file_path: ${row.file_path}`);
    console.log(`  folder_type: ${row.folder_type}`);
    console.log('---');
  });

  db.close();
});
