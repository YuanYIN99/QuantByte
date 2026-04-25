import fs from 'fs';
try {
  const content = fs.readFileSync('./src/content.json', 'utf8');
  JSON.parse(content);
  console.log('JSON is valid');
} catch (err) {
  console.error('JSON is invalid:');
  console.error(err.message);
  process.exit(1);
}
