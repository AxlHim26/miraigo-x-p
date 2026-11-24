import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { env } from '@/core/config/env';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { createStudyStorage } from '@/shared/utils/study-storage';

export const levels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
export const themes = ['Theo hệ thống', 'Sáng', 'Tối'] as const;
export const genders = ['Không công khai', 'Nam', 'Nữ', 'Khác'] as const;
const schema = z.object({
  name: z.string().max(100), displayName: z.string().max(60), birthDate: z.union([z.literal(''), z.iso.date()]),
  gender: z.enum(genders), currentLevel: z.enum(levels), goal: z.enum(levels), minutes: z.number().int().min(5).max(180),
  streakGoal: z.number().int().min(1).max(365), avatar: z.string().max(220), theme: z.enum(themes),
  reminderEnabled: z.boolean(), reminderTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  reminderDays: z.array(z.number().int().min(1).max(7)).min(1).max(7), demoTwoFactorEnabled: z.boolean(),
});
export type LearnerProfile = z.infer<typeof schema>;
export const emptyProfile: LearnerProfile = {
  name: '', displayName: '', birthDate: '', gender: genders[0], currentLevel: 'N5', goal: 'N3', minutes: 30, streakGoal: 7,
  avatar: '', theme: themes[0], reminderEnabled: false, reminderTime: '20:00',
  reminderDays: [1, 2, 3, 4, 5, 6, 7], demoTwoFactorEnabled: false,
};
const files = createStudyStorage('miraigo-learner-profile');
const server = Array.from(env.apiBaseUrl.replace(/\/$/, ''), (char) => char.codePointAt(0)!.toString(16)).join('.');

export function useLearnerProfile() {
  const user = useCurrentUser();
  const id = user.data?.id;
  const key = `profile.v1.${server}.${id ?? 'guest'}`;
  const initial = env.demoMode ? { ...emptyProfile, name: 'Nguyễn Đình Quốc Khánh', displayName: 'Quốc Khánh',
    avatar: 'fuji', birthDate: '2004-09-02', gender: 'Nam' as const, goal: 'N2' as const, reminderEnabled: true, demoTwoFactorEnabled: true } : emptyProfile;
  const queryKey = ['learner-profile', key];
  const client = useQueryClient();
  const query = useQuery({
    queryKey, enabled: !user.isPending, staleTime: Infinity, retry: false,
    queryFn: async () => {
      const raw = await files.get(key);
      return raw ? schema.parse({ ...initial, ...JSON.parse(raw) }) : initial;
    },
  });
  const mutation = useMutation({
    scope: { id: key },
    mutationFn: async (changes: Partial<LearnerProfile>) => {
      const next = schema.parse({ ...initial, ...client.getQueryData<LearnerProfile>(queryKey), ...changes });
      await files.set(key, JSON.stringify(next));
      client.setQueryData(queryKey, next);
    },
  });
  return { user, query, data: query.data ?? initial, save: mutation.mutateAsync, saving: mutation.isPending };
}
