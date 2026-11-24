import { useState } from 'react';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerExternalAction } from '@/components/ui/learner-detail';
import { LearnerControl, LearnerPanel } from '@/components/ui/learner-glass';
import { resolveFrontendUrl, webTools, type WebToolGroup } from '@/features/web-tools/data/web-tools';

export function WebToolsPanel({ groups }: { groups: readonly WebToolGroup[] }) {
  const [openGroup, setOpenGroup] = useState<WebToolGroup | null>(null);
  const configured = Boolean(resolveFrontendUrl('/login'));

  return groups.map((group) => {
    const expanded = openGroup === group;
    const info = webTools[group];
    return (
      <LearnerPanel key={group}>
        <LearnerControl label={info.title} glyph={expanded ? '−' : '+'} accessibilityState={{ expanded }} onPress={() => setOpenGroup(expanded ? null : group)} />
        {expanded && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {configured
                ? 'Những công cụ này sử dụng tài khoản MiraiGo Web.'
                : 'Cần cấu hình địa chỉ MiraiGo Web để mở các công cụ này.'}
            </ThemedText>
            {info.items.map((item) => {
              const url = resolveFrontendUrl(item.path);
              if (!url) return <LearnerControl key={item.path} label={item.label} disabled />;
              return Platform.OS === 'web'
                ? <LearnerExternalAction key={item.path} label={item.label} url={url} />
                : <LearnerControl key={item.path} label={item.label} glyph="›" onPress={() => router.push({
                  pathname: '/study-tool', params: { path: item.path },
                })} />;
            })}
          </>
        )}
      </LearnerPanel>
    );
  });
}
