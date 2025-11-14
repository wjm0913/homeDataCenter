import { spawn } from 'child_process';
import { DOCKER_CONTAINER_NAME } from '../config';

export class DockerService {
  static restart(container = DOCKER_CONTAINER_NAME): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('docker', ['restart', container]);
      let stderr = '';
      child.stderr.on('data', (chunk) => (stderr += chunk));
      child.on('close', (code) => {
        if (code === 0) return resolve();
        reject(new Error(stderr || `docker restart exited with ${code}`));
      });
    });
  }
}
