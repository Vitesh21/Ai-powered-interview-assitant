import React from 'react';
import { Card, Typography, Space, Button, Input, Progress, message, Tag, Row, Col } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState, setSession, updateCandidate } from '@/store';
import { QUESTION_TIME, scoreAnswer, summarizeCandidate } from '@/ai/engine';
import ChatTranscript from '@/components/ChatTranscript';

export default function InterviewChat() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s: RootState) => s.session);
  const candidate = useAppSelector((s: RootState) => (session.currentCandidateId ? s.candidates[session.currentCandidateId] : undefined));

  const [answer, setAnswer] = React.useState('');
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (!candidate) return;
    // initialize timer for current question if not set
    const idx = session.currentQuestionIndex;
    const q = candidate.qas[idx];
    if (!q) return;
    if (!session.currentQuestionExpiresAt) {
      const expires = Date.now() + QUESTION_TIME[q.difficulty] * 1000;
      dispatch(setSession({ currentQuestionExpiresAt: expires }));
      setAnswer('');
    }
  }, [candidate, dispatch, session.currentQuestionExpiresAt, session.currentQuestionIndex]);

  if (!candidate) return null;
  const idx = session.currentQuestionIndex;
  const q = candidate.qas[idx];
  if (!q) return null;

  const timeLeftMs = Math.max(0, (session.currentQuestionExpiresAt || 0) - now);
  const totalMs = QUESTION_TIME[q.difficulty as keyof typeof QUESTION_TIME] * 1000;
  const percent = Math.round((timeLeftMs / totalMs) * 100);

  const submit = (auto = false) => {
    const spentSec = Math.round((totalMs - timeLeftMs) / 1000);
    const computedScore = scoreAnswer(q, answer, spentSec);

    const newQ = { ...q, answer: answer.trim(), timeTakenSec: spentSec, score: computedScore };
    const newQAs = candidate.qas.slice();
    newQAs[idx] = newQ;

    dispatch(updateCandidate({ id: candidate.id, patch: { qas: newQAs, chatHistory: candidate.chatHistory.concat({ role: 'user', content: answer || (auto ? '[No answer]' : ''), ts: Date.now() }) } }));

    // move to next or finish
    if (idx < 5) {
      const nextQ = candidate.qas[idx + 1];
      dispatch(setSession({ currentQuestionIndex: idx + 1, currentQuestionExpiresAt: Date.now() + QUESTION_TIME[nextQ.difficulty as keyof typeof QUESTION_TIME] * 1000 }));
      setAnswer('');
    } else {
      // finalize
      const finalScore = Math.round(newQAs.reduce((a, b) => a + (b.score || 0), 0) / newQAs.length);
      const summary = summarizeCandidate(candidate.profile.name || 'Candidate', newQAs, finalScore);
      dispatch(updateCandidate({ id: candidate.id, patch: { completedAt: Date.now(), finalScore, summary } }));
      dispatch(setSession({ interviewStage: 'completed', currentQuestionExpiresAt: undefined }));
      message.success('Interview completed. Great job!');
    }
  };

  React.useEffect(() => {
    if (session.paused) return;
    if (!session.currentQuestionExpiresAt) return;
    if (timeLeftMs === 0 && session.interviewStage === 'in_progress') {
      submit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftMs, session.paused, session.currentQuestionExpiresAt]);

  // Log assistant question when question starts (avoid duplicates)
  React.useEffect(() => {
    if (!candidate) return;
    const current = candidate.qas[idx];
    if (!current) return;
    const last = candidate.chatHistory[candidate.chatHistory.length - 1];
    if (!last || last.content !== current.question || last.role !== 'assistant') {
      dispatch(updateCandidate({ id: candidate.id, patch: { chatHistory: candidate.chatHistory.concat({ role: 'assistant', content: current.question, ts: Date.now() }) } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space>
                <Typography.Text type="secondary">Question {idx + 1} / 6</Typography.Text>
                <Tag color={q.difficulty === 'easy' ? 'blue' : q.difficulty === 'medium' ? 'orange' : 'red'}>{q.difficulty.toUpperCase()}</Tag>
              </Space>
            </Col>
            <Col>
              <Space>
                <Typography.Text type="secondary">Overall Progress</Typography.Text>
                <Progress style={{ width: 180 }} percent={Math.round(((idx + 1) / 6) * 100)} size="small" />
              </Space>
            </Col>
          </Row>
          <Typography.Paragraph strong style={{ marginBottom: 8 }}>{q.question}</Typography.Paragraph>
          <Progress percent={percent} showInfo format={() => `${Math.ceil(timeLeftMs / 1000)}s`} status={percent < 20 ? 'exception' : 'active'} />
          <Input.TextArea rows={6} placeholder="Type your answer here..." value={answer} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)} />
          <Space>
            <Button type="primary" onClick={() => submit(false)}>Submit</Button>
          </Space>
          <ChatTranscript candidate={candidate} />
        </Space>
      </Card>
    </Space>
  );
}
