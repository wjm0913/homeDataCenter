import { spawn } from 'child_process';
import { FileService } from './fileService';
import { FILE_PATHS } from '../config';

const MOSQUITTO_PASSWD_CMD = process.env.MOSQUITTO_PASSWD_CMD || 'mosquitto_passwd';

export interface UserRecord {
  username: string;
  hash: string;
}

function execCommand(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(MOSQUITTO_PASSWD_CMD, args);
    let stderr = '';
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr || `mosquitto_passwd exited with code ${code}`));
    });
  });
}

export class UserService {
  static async list(): Promise<UserRecord[]> {
    const content = await FileService.readFile(FILE_PATHS.pwfile).catch(() => '');
    return content
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [username, hash] = line.split(':');
        return { username, hash } as UserRecord;
      });
  }

  static async add(username: string, password: string) {
    if (!username || !password) throw new Error('username/password required');
    await execCommand(['-b', FILE_PATHS.pwfile, username, password]);
  }

  static async remove(username: string) {
    if (!username) throw new Error('username required');
    await execCommand(['-D', FILE_PATHS.pwfile, username]);
  }
}
