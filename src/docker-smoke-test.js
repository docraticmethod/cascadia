import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

async function checkDocker() {
  try {
    await execFileAsync('docker', ['info']);
    return { available: true };
  } catch (err) {
    return {
      available: false,
      reason: err.code === 'ENOENT'
        ? 'Docker CLI not installed'      // binary not on PATH
        : 'Docker installed but daemon not reachable',  // daemon down / no permission
    };
  }
}

const docker = await checkDocker();
console.log(docker);