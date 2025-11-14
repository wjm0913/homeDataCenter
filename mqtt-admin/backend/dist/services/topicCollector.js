"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicCollector = void 0;
class TopicCollector {
    constructor() {
        this.topics = new Set();
    }
    add(topic) {
        if (topic.startsWith('$SYS'))
            return;
        this.topics.add(topic);
    }
    list() {
        return Array.from(this.topics).sort();
    }
    tree() {
        const root = {};
        this.list().forEach((topic) => {
            const parts = topic.split('/');
            let node = root;
            let path = '';
            parts.forEach((part, index) => {
                path = path ? `${path}/${part}` : part;
                node.children = node.children || {};
                node.children[part] = node.children[part] || { key: path, title: part, children: {} };
                node = node.children[part];
                if (index === parts.length - 1) {
                    node.leaf = true;
                }
            });
        });
        const toTree = (branch) => Object.values(branch.children || {}).map((child) => ({
            title: child.title,
            key: child.key,
            children: toTree(child)
        }));
        return toTree(root);
    }
}
exports.TopicCollector = TopicCollector;
//# sourceMappingURL=topicCollector.js.map