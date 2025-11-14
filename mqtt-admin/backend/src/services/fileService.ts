import fs from 'fs/promises';

export class FileService {
  static async readFile(path: string): Promise<string> {
    try {
      return await fs.readFile(path, 'utf-8');
    } catch (error: any) {
      throw new Error(`Unable to read ${path}: ${error.message}`);
    }
  }

  static async writeFile(path: string, content: string): Promise<void> {
    try {
      await fs.writeFile(path, content, 'utf-8');
    } catch (error: any) {
      throw new Error(`Unable to write ${path}: ${error.message}`);
    }
  }
}
