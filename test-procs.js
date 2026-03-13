import fs from 'fs';

const pids = fs.readdirSync('/proc').filter(f => !isNaN(f));
for (const pid of pids) {
  try {
    const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
    if (cmdline.includes('node') || cmdline.includes('tsx')) {
      console.log(`PID: ${pid}, CMD: ${cmdline.replace(/\0/g, ' ')}`);
    }
  } catch (e) {}
}
