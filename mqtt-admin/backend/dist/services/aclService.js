"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AclService = void 0;
const config_1 = require("../config");
const fileService_1 = require("./fileService");
class AclService {
    static async list() {
        const content = await fileService_1.FileService.readFile(config_1.FILE_PATHS.aclfile).catch(() => '');
        const entries = [];
        let currentUser = '';
        content.split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                return;
            if (trimmed.startsWith('user')) {
                currentUser = trimmed.split(/\s+/)[1] || '';
                return;
            }
            if (trimmed.startsWith('topic')) {
                const parts = trimmed.split(/\s+/);
                const access = parts[1] || 'read';
                const topic = parts.slice(2).join(' ');
                if (currentUser && topic) {
                    entries.push({ user: currentUser, access, topic });
                }
            }
            if (trimmed.startsWith('pattern')) {
                const parts = trimmed.split(/\s+/);
                const access = parts[1] || 'read';
                const topic = parts.slice(2).join(' ');
                if (currentUser && topic) {
                    entries.push({ user: currentUser, access, topic: `pattern:${topic}` });
                }
            }
        });
        return entries;
    }
    static async save(entries) {
        const grouped = {};
        entries.forEach((entry) => {
            if (!grouped[entry.user]) {
                grouped[entry.user] = [];
            }
            grouped[entry.user].push(entry);
        });
        const lines = [];
        Object.entries(grouped).forEach(([user, aclEntries]) => {
            const items = aclEntries || [];
            lines.push(`user ${user}`);
            items.forEach((entry) => {
                if (entry.topic.startsWith('pattern:')) {
                    lines.push(`pattern ${entry.access} ${entry.topic.replace('pattern:', '')}`);
                }
                else {
                    lines.push(`topic ${entry.access} ${entry.topic}`);
                }
            });
            lines.push('');
        });
        await fileService_1.FileService.writeFile(config_1.FILE_PATHS.aclfile, lines.join('\n'));
    }
}
exports.AclService = AclService;
//# sourceMappingURL=aclService.js.map