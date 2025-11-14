export interface TopicNode {
    title: string;
    key: string;
    children?: TopicNode[];
}
export declare class TopicCollector {
    private topics;
    add(topic: string): void;
    list(): string[];
    tree(): TopicNode[];
}
//# sourceMappingURL=topicCollector.d.ts.map