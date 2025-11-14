"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const config_1 = require("../config");
const fileService_1 = require("./fileService");
class ConfigService {
    static async read() {
        const content = await fileService_1.FileService.readFile(config_1.FILE_PATHS.config).catch(() => '');
        const config = {};
        content.split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                return;
            const [key, ...rest] = trimmed.split(/\s+/);
            if (key) {
                config[key] = rest.join(' ');
            }
        });
        return config;
    }
    static async save(newConfig) {
        const lines = Object.entries(newConfig).map(([key, value]) => `${key} ${value}`);
        await fileService_1.FileService.writeFile(config_1.FILE_PATHS.config, lines.join('\n'));
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=configService.js.map