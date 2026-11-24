import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack, LearnerExternalAction } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerHeading } from '@/components/ui/learner-glass';
import { findWebTool, resolveFrontendUrl } from '@/features/web-tools/data/web-tools';

export default function StudyToolScreen() {
  const { path } = useLocalSearchParams<{ path?: string }>();
  const tool = findWebTool(path);
  const url = tool && resolveFrontendUrl(tool.path);
  return (
    <LearnerCanvas>
      <LearnerBack label="Về trang học" href="/practice" />
      <LearnerHeading title={tool?.label ?? 'Công cụ học tập'} />
      {tool && url
        ? <LearnerExternalAction label="Mở công cụ" url={url} />
        : <ThemedText>Công cụ này chưa có địa chỉ MiraiGo Web.</ThemedText>}
    </LearnerCanvas>
  );
}
