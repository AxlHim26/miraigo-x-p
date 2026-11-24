import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack, LearnerExternalAction } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerHeading } from '@/components/ui/learner-glass';
import { findWebTool, resolveFrontendUrl } from '@/features/web-tools/data/web-tools';

export default function VoicePracticeScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const tool = findWebTool(`/practice/${mode}`);
  return <WebVoiceTool title={tool?.label ?? 'Luyện nói'} path={tool?.path} />;
}

export function ConversationScreen() {
  return <WebVoiceTool title="Hội thoại" path="/practice/conversation" />;
}

function WebVoiceTool({ title, path }: { title: string; path?: string }) {
  const url = path && resolveFrontendUrl(path);
  return (
    <LearnerCanvas>
      <LearnerBack href="/practice" label="Luyện tập" />
      <LearnerHeading title={title} />
      {url ? <LearnerExternalAction url={url} label="Mở công cụ" /> : <ThemedText>Chưa cấu hình công cụ này.</ThemedText>}
    </LearnerCanvas>
  );
}
