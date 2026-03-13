import fs from 'fs';
import path from 'path';

const watchDir = process.cwd();
console.log(`Watching ${watchDir} for changes...`);

fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.includes('pinet-state.json')) {
    console.log(`Event: ${eventType} on ${filename}`);
    try {
      console.log(fs.readFileSync(filename, 'utf8'));
    } catch (e) {
      console.error(e.message);
    }
  }
});

setTimeout(() => process.exit(0), 10000);
