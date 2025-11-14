"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerService = void 0;
const child_process_1 = require("child_process");
const config_1 = require("../config");
class DockerService {
    static restart(container = config_1.DOCKER_CONTAINER_NAME) {
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)('docker', ['restart', container]);
            let stderr = '';
            child.stderr.on('data', (chunk) => (stderr += chunk));
            child.on('close', (code) => {
                if (code === 0)
                    return resolve();
                reject(new Error(stderr || `docker restart exited with ${code}`));
            });
        });
    }
}
exports.DockerService = DockerService;
//# sourceMappingURL=dockerService.js.map