import React from 'react';
import { Card, Table, Tag, Typography, Input, Space, Button } from 'antd';
import { useAppSelector } from '@/store/hooks';
import type { RootState, CandidateRecord } from '@/store';
import CandidateDetailDrawer from '@/components/CandidateDetailDrawer';

interface RowType {
  key: string;
  name: string;
  email: string;
  phone: string;
  score?: number;
  completedAt?: number;
}

export default function Interviewer() {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<CandidateRecord | undefined>(undefined);

  const { candidates, candidateOrder } = useAppSelector((s: RootState) => ({ candidates: s.candidates, candidateOrder: s.candidateOrder }));

  const rows: RowType[] = candidateOrder
    .map((id: string) => candidates[id])
    .filter(Boolean)
    .map((c: CandidateRecord) => ({
      key: c.id,
      name: c.profile.name || 'Unknown',
      email: c.profile.email || '—',
      phone: c.profile.phone || '—',
      score: c.finalScore,
      completedAt: c.completedAt,
    }));

  const filtered = rows.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()) || d.email.toLowerCase().includes(query.toLowerCase())
  );
  // Sort by score DESC by default (NA scores go to bottom)
  const sorted = filtered.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: RowType, b: RowType) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a: RowType, b: RowType) => (a.score || 0) - (b.score || 0),
      render: (v?: number) => (v != null ? <Tag color={v >= 70 ? 'green' : v >= 40 ? 'orange' : 'red'}>{v}</Tag> : <Tag>NA</Tag>),
    },
    {
      title: 'Status',
      dataIndex: 'completedAt',
      key: 'completedAt',
      sorter: (a: RowType, b: RowType) => (a.completedAt || 0) - (b.completedAt || 0),
      render: (v?: number) => (v ? <Tag color="green">Completed</Tag> : <Tag color="processing">In Progress</Tag>),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: RowType) => (
        <Button type="link" onClick={() => setSelected(candidates[record.key])}>View</Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>Candidates</Typography.Title>
          <Input.Search placeholder="Search by name or email" allowClear style={{ maxWidth: 320 }} onSearch={setQuery} />
        </Space>
      </Card>
      <Card>
        <Table columns={columns as any} dataSource={sorted} pagination={{ pageSize: 8 }} />
      </Card>
      <CandidateDetailDrawer open={!!selected} onClose={() => setSelected(undefined)} candidate={selected} />
    </Space>
  );
}
