"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
class FileService {
    static async readFile(path) {
        try {
            return await promises_1.default.readFile(path, 'utf-8');
        }
        catch (error) {
            throw new Error(`Unable to read ${path}: ${error.message}`);
        }
    }
    static async writeFile(path, content) {
        try {
            await promises_1.default.writeFile(path, content, 'utf-8');
        }
        catch (error) {
            throw new Error(`Unable to write ${path}: ${error.message}`);
        }
    }
}
exports.FileService = FileService;
//# sourceMappingURL=fileService.js.map