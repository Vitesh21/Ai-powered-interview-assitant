import React from 'react';
import { Card, Typography, Space, Alert, Result, Button } from 'antd';
import ResumeUpload from '@/components/ResumeUpload';
import MissingFieldsForm from '@/components/MissingFieldsForm';
import InterviewChat from '@/components/InterviewChat';
import WelcomeBackModal from '@/components/WelcomeBackModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState, setActiveTab, setSession } from '@/store';

export default function Interviewee() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s: RootState) => s.session);
  const candidate = useAppSelector((s: RootState) => (session.currentCandidateId ? s.candidates[session.currentCandidateId] : undefined));

  // Show Welcome Back modal if returning to unfinished session
  React.useEffect(() => {
    if (!session.paused && (session.interviewStage === 'collecting_profile' || session.interviewStage === 'in_progress')) {
      dispatch(setSession({ paused: true }));
    }
  }, []); // run once on mount

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <WelcomeBackModal />

      {session.interviewStage === 'idle' && (
        <>
          <Alert message="Welcome! Upload your resume to begin the interview." type="info" showIcon />
          <Card title="Resume Upload">
            <ResumeUpload />
          </Card>
        </>
      )}

      {session.interviewStage === 'collecting_profile' && (
        <>
          <Card title="Confirm Your Details">
            <MissingFieldsForm />
          </Card>
        </>
      )}

      {session.interviewStage === 'in_progress' && (
        <>
          <Card title={`Interview — ${candidate?.profile.name || 'Candidate'}`}>
            <InterviewChat />
          </Card>
        </>
      )}

      {session.interviewStage === 'completed' && candidate && (
        <Result
          status="success"
          title={`Great job, ${candidate.profile.name || 'Candidate'}!`}
          subTitle={`Your interview is complete. Final Score: ${candidate.finalScore}. Summary: ${candidate.summary}`}
          extra={<Button type="primary" onClick={() => dispatch(setActiveTab('interviewer'))}>View on Interviewer Dashboard</Button>}
        />
      )}
    </Space>
  );
}
