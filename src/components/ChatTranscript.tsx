import React from 'react';
import { List, Avatar, Typography, Space, Card } from 'antd';
import type { CandidateRecord } from '@/store';

interface Props {
  candidate: CandidateRecord;
}

export default function ChatTranscript({ candidate }: Props) {
  return (
    <Card size="small" title={<Typography.Text type="secondary">Transcript</Typography.Text>}>
      <List
        itemLayout="horizontal"
        dataSource={candidate.chatHistory}
        renderItem={(item) => (
          <List.Item style={{ justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <Space style={{ maxWidth: 720, width: '100%', justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {item.role === 'assistant' && <Avatar style={{ backgroundColor: '#635bff' }}>AI</Avatar>}
              <Card
                size="small"
                style={{ maxWidth: 600, background: item.role === 'user' ? '#f0f5ff' : 'white' }}
                bodyStyle={{ padding: '8px 12px' }}
              >
                <Typography.Text>{item.content}</Typography.Text>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{new Date(item.ts).toLocaleString()}</div>
              </Card>
              {item.role === 'user' && <Avatar style={{ backgroundColor: '#2db7f5' }}>U</Avatar>}
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
}
