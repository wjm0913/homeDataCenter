import { FILE_PATHS } from '../config';
import { FileService } from './fileService';

export type AclAccess = 'read' | 'write' | 'readwrite' | 'deny';
export interface AclEntry {
  user: string;
  topic: string;
  access: AclAccess;
}

export class AclService {
  static async list(): Promise<AclEntry[]> {
    const content = await FileService.readFile(FILE_PATHS.aclfile).catch(() => '');
    const entries: AclEntry[] = [];
    let currentUser = '';
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      if (trimmed.startsWith('user')) {
        currentUser = trimmed.split(/\s+/)[1] || '';
        return;
      }
      if (trimmed.startsWith('topic')) {
        const parts = trimmed.split(/\s+/);
        const access = (parts[1] as AclAccess) || 'read';
        const topic = parts.slice(2).join(' ');
        if (currentUser && topic) {
          entries.push({ user: currentUser, access, topic });
        }
      }
      if (trimmed.startsWith('pattern')) {
        const parts = trimmed.split(/\s+/);
        const access = (parts[1] as AclAccess) || 'read';
        const topic = parts.slice(2).join(' ');
        if (currentUser && topic) {
          entries.push({ user: currentUser, access, topic: `pattern:${topic}` });
        }
      }
    });
    return entries;
  }

  static async save(entries: AclEntry[]) {
    const grouped: Record<string, AclEntry[]> = {};
    entries.forEach((entry) => {
      if (!grouped[entry.user]) {
        grouped[entry.user] = [];
      }
      grouped[entry.user]!.push(entry);
    });
    const lines: string[] = [];
    Object.entries(grouped).forEach(([user, aclEntries]) => {
      const items = aclEntries || [];
      lines.push(`user ${user}`);
      items.forEach((entry) => {
        if (entry.topic.startsWith('pattern:')) {
          lines.push(`pattern ${entry.access} ${entry.topic.replace('pattern:', '')}`);
        } else {
          lines.push(`topic ${entry.access} ${entry.topic}`);
        }
      });
      lines.push('');
    });
    await FileService.writeFile(FILE_PATHS.aclfile, lines.join('\n'));
  }
}
