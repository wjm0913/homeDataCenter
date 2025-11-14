import { FILE_PATHS } from '../config';
import { FileService } from './fileService';

export interface MosquittoConfig {
  [key: string]: string;
}

export class ConfigService {
  static async read(): Promise<MosquittoConfig> {
    const content = await FileService.readFile(FILE_PATHS.config).catch(() => '');
    const config: MosquittoConfig = {};
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const [key, ...rest] = trimmed.split(/\s+/);
      if (key) {
        config[key] = rest.join(' ');
      }
    });
    return config;
  }

  static async save(newConfig: MosquittoConfig) {
    const lines = Object.entries(newConfig).map(([key, value]) => `${key} ${value}`);
    await FileService.writeFile(FILE_PATHS.config, lines.join('\n'));
  }
}
