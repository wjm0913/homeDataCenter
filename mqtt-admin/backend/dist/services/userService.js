"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const child_process_1 = require("child_process");
const fileService_1 = require("./fileService");
const config_1 = require("../config");
const MOSQUITTO_PASSWD_CMD = process.env.MOSQUITTO_PASSWD_CMD || 'mosquitto_passwd';
function execCommand(args) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(MOSQUITTO_PASSWD_CMD, args);
        let stderr = '';
        child.stderr.on('data', (chunk) => (stderr += chunk));
        child.on('close', (code) => {
            if (code === 0)
                return resolve();
            reject(new Error(stderr || `mosquitto_passwd exited with code ${code}`));
        });
    });
}
class UserService {
    static async list() {
        const content = await fileService_1.FileService.readFile(config_1.FILE_PATHS.pwfile).catch(() => '');
        return content
            .split('\n')
            .filter(Boolean)
            .map((line) => {
            const [username, hash] = line.split(':');
            return { username, hash };
        });
    }
    static async add(username, password) {
        if (!username || !password)
            throw new Error('username/password required');
        await execCommand(['-b', config_1.FILE_PATHS.pwfile, username, password]);
    }
    static async remove(username) {
        if (!username)
            throw new Error('username required');
        await execCommand(['-D', config_1.FILE_PATHS.pwfile, username]);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map