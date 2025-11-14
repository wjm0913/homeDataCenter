export interface TopicNode {
  title: string;
  key: string;
  children?: TopicNode[];
}

export class TopicCollector {
  private topics: Set<string> = new Set();

  add(topic: string) {
    if (topic.startsWith('$SYS')) return;
    this.topics.add(topic);
  }

  list(): string[] {
    return Array.from(this.topics).sort();
  }

  tree(): TopicNode[] {
    const root: Record<string, any> = {};
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

    const toTree = (branch: any): TopicNode[] =>
      Object.values(branch.children || {}).map((child: any) => ({
        title: child.title,
        key: child.key,
        children: toTree(child)
      }));

    return toTree(root);
  }
}
