import React from 'react';
import { Upload, message, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { getResumeText, extractProfileFromText, deriveNameFromFilename } from '@/utils/resume';
import { useAppDispatch } from '@/store/hooks';
import { upsertCandidate, setSession } from '@/store';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onParsed?: () => void;
}

export default function ResumeUpload({ onParsed }: Props) {
  const dispatch = useAppDispatch();

  const beforeUpload = async (file: File) => {
    try {
      message.loading({ content: 'Parsing resume...', key: 'parse' });
      const text = await getResumeText(file);
      const profile = extractProfileFromText(text);
      if (!profile.name) {
        const fnName = deriveNameFromFilename(file.name);
        if (fnName) profile.name = fnName;
      }

      const id = uuidv4();
      const record = {
        id,
        profile: {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          resumeMeta: { fileName: file.name, fileType: file.type || (file.name.endsWith('.docx') ? 'docx' : 'pdf') },
        },
        qas: [],
        startedAt: Date.now(),
        chatHistory: [
          { role: 'system' as const, content: 'Resume uploaded and parsed.', ts: Date.now() },
        ],
      };
      dispatch(upsertCandidate(record as any));
      dispatch(setSession({ currentCandidateId: id, interviewStage: 'collecting_profile', currentQuestionIndex: 0, paused: false }));
      message.success({ content: 'Resume parsed. Please confirm missing details.', key: 'parse' });
      onParsed?.();
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || 'Failed to parse resume. Please upload a valid PDF/DOCX.');
    }
    return Upload.LIST_IGNORE as unknown as boolean;
  };

  return (
    <Upload.Dragger multiple={false} accept=".pdf,.docx" beforeUpload={beforeUpload} showUploadList={false}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <Typography.Text strong>Click or drag file to this area to upload</Typography.Text>
      <p className="ant-upload-hint">Support for PDF and DOCX.</p>
    </Upload.Dragger>
  );
}
