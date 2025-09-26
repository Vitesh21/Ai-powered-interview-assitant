import React from 'react';
import { Modal } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState, setSession } from '@/store';

export default function WelcomeBackModal() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s: RootState) => s.session);
  const candidate = useAppSelector((s: RootState) => (session.currentCandidateId ? s.candidates[session.currentCandidateId] : undefined));

  const show = React.useMemo(() => {
    if (!candidate) return false;
    return session.interviewStage === 'collecting_profile' || session.interviewStage === 'in_progress';
  }, [candidate, session.interviewStage]);

  return (
    <Modal
      open={show && !!session.paused}
      title="Welcome Back"
      onOk={() => dispatch(setSession({ paused: false }))}
      onCancel={() => dispatch(setSession({ paused: false }))}
      okText="Resume"
      cancelButtonProps={{ style: { display: 'none' } }}
      destroyOnHidden
    >
      Your previous interview session is still in progress. Click Resume to continue.
    </Modal>
  );
}
