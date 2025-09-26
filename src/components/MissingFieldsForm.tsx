import React from 'react';
import { Form, Input, Button, Typography, Space, message } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState, setSession, updateCandidate } from '@/store';
import { generateInterviewQuestions, QUESTION_TIME } from '@/ai/engine';

export default function MissingFieldsForm() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s: RootState) => s.session);
  const candidate = useAppSelector((s: RootState) => (session.currentCandidateId ? s.candidates[session.currentCandidateId] : undefined));

  const [form] = Form.useForm();

  React.useEffect(() => {
    if (candidate) {
      form.setFieldsValue({
        name: candidate.profile.name,
        email: candidate.profile.email,
        phone: candidate.profile.phone,
      });
    }
  }, [candidate, form]);

  if (!candidate) return null;

  const onFinish = () => {
    const values = form.getFieldsValue();
    if (!values.name || !values.email || !values.phone) {
      message.error('Please fill all fields to begin the interview.');
      return;
    }
    // Save profile
    dispatch(updateCandidate({ id: candidate.id, patch: { profile: { ...candidate.profile, ...values } } }));
    // Generate questions
    const qas = generateInterviewQuestions();
    dispatch(updateCandidate({ id: candidate.id, patch: { qas } }));
    // Initialize first question timer immediately to prevent auto-submit of Q1
    const first = qas[0];
    const expiresAt = Date.now() + QUESTION_TIME[first.difficulty] * 1000;
    dispatch(setSession({ interviewStage: 'in_progress', currentQuestionIndex: 0, currentQuestionExpiresAt: expiresAt }));
    message.success('Profile confirmed. Starting interview...');
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Typography.Text>
        Please confirm your details before we begin.
      </Typography.Text>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your full name' }]} extra="Your legal full name as it appears on your resume.">
          <Input placeholder="John Doe" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]} extra="We will use this to identify your submission.">
          <Input placeholder="john@example.com" />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Phone"
          rules={[
            { required: true, message: 'Please enter your phone number' },
            { pattern: /^(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}$/,
              message: 'Please enter a valid phone number (e.g., +1 555 555 5555)' },
          ]}
          extra="Include country code if outside your home region."
        >
          <Input placeholder="+1 555 555 5555" />
        </Form.Item>
        <Button type="primary" htmlType="submit">Start Interview</Button>
      </Form>
    </Space>
  );
}
