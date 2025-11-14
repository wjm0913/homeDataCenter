import { Card, Col, List, Row, Tree, Typography } from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useTopicStream } from '../../hooks/useTopicStream';

interface TopicResponse {
  list: string[];
  tree: DataNode[];
}

const TopicsPage = () => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const { messages } = useTopicStream(selectedTopics);

  const load = async () => {
    const res = await api.get<TopicResponse>('/api/topics');
    setTreeData(res.data.tree);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelect: TreeProps['onSelect'] = (_keys, info) => {
    const nodes = info.selectedNodes || [];
    if (!nodes.length) {
      setSelectedTopics([]);
      return;
    }
    const mapped = nodes.map((node: any) => {
      const hasChildren = node.children && node.children.length > 0;
      return hasChildren ? `${node.key}/#` : node.key;
    });
    setSelectedTopics(mapped);
  };

  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card title="主题列表" className="glass-card" bordered={false}>
          <Tree
            className="topics-tree"
            treeData={treeData}
            defaultExpandAll
            showLine
            multiple={false}
            onSelect={handleSelect}
          />
        </Card>
      </Col>
      <Col span={16}>
        <Card title="最近消息" className="glass-card" bordered={false}>
          {selectedTopics.length === 0 ? (
            <Typography.Text type="secondary">请选择一个主题即可实时查看消息。</Typography.Text>
          ) : (
            <List
              className="message-panel"
              bordered
              locale={{ emptyText: '等待最新消息...' }}
              dataSource={messages}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${item.topic} · ${new Date(item.timestamp).toLocaleTimeString()}`}
                    description={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{formatPayload(item.payload)}</pre>}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
};

function formatPayload(payload: string) {
  try {
    const parsed = JSON.parse(payload);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return payload;
  }
}

export default TopicsPage;
