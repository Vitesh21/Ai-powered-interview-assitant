import React from 'react';
import { Drawer, Descriptions, Typography, Table, Tag, Space, Divider } from 'antd';
import type { CandidateRecord } from '@/store';

interface Props {
  open: boolean;
  onClose: () => void;
  candidate?: CandidateRecord;
}

export default function CandidateDetailDrawer({ open, onClose, candidate }: Props) {
  const columnsQA = [
    { title: '#', dataIndex: 'idx', key: 'idx', width: 50 },
    { title: 'Difficulty', dataIndex: 'difficulty', key: 'difficulty', render: (d: string) => <Tag color={d === 'easy' ? 'blue' : d === 'medium' ? 'orange' : 'red'}>{d.toUpperCase()}</Tag> },
    { title: 'Question', dataIndex: 'question', key: 'question', width: 400 },
    { title: 'Answer', dataIndex: 'answer', key: 'answer', width: 400, render: (v: string) => v || <Typography.Text type="secondary">[No answer]</Typography.Text> },
    { title: 'Time (s)', dataIndex: 'timeTakenSec', key: 'timeTakenSec', width: 100 },
    { title: 'Score', dataIndex: 'score', key: 'score', width: 100 },
  ];

  const columnsChat = [
    { title: 'Role', dataIndex: 'role', key: 'role', width: 120, render: (r: string) => <Tag color={r === 'user' ? 'geekblue' : r === 'assistant' ? 'green' : 'default'}>{r}</Tag> },
    { title: 'Message', dataIndex: 'content', key: 'content' },
    { title: 'Time', dataIndex: 'ts', key: 'ts', width: 200, render: (ts: number) => new Date(ts).toLocaleString() },
  ];

  return (
    <Drawer width={920} title={candidate ? `${candidate.profile.name} — Details` : 'Candidate Details'} open={open} onClose={onClose}>
      {!candidate ? null : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Name">{candidate.profile.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{candidate.profile.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{candidate.profile.phone}</Descriptions.Item>
            <Descriptions.Item label="Score">{candidate.finalScore ?? 'NA'}</Descriptions.Item>
            <Descriptions.Item label="Summary">{candidate.summary ?? 'NA'}</Descriptions.Item>
            <Descriptions.Item label="Started">{new Date(candidate.startedAt).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Completed">{candidate.completedAt ? new Date(candidate.completedAt).toLocaleString() : 'In progress'}</Descriptions.Item>
          </Descriptions>

          <Divider>Q&A</Divider>
          <Table
            rowKey={(r: any, i: number) => `${i}`}
            columns={columnsQA}
            dataSource={(candidate.qas || []).map((q, i) => ({ idx: i + 1, ...q }))}
            pagination={{ pageSize: 5 }}
            size="small"
            scroll={{ x: 1000 }}
          />

          <Divider>Chat History</Divider>
          <Table
            rowKey={(r: any, i: number) => `${i}`}
            columns={columnsChat}
            dataSource={candidate.chatHistory}
            pagination={{ pageSize: 6 }}
            size="small"
          />
        </Space>
      )}
    </Drawer>
  );
}
