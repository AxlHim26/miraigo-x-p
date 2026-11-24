import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View, type ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { LearnerBack, LearnerLoadState } from '@/components/ui/learner-detail';
import { LearnerCanvas, LearnerControl, LearnerHeading, LearnerPanel } from '@/components/ui/learner-glass';
import { VocabularyFlashcards } from '@/features/practice/components/offline-practice-screens';
import { ApiError } from '@/shared/utils/api-error';
import { VocabularySetForm, VocabularyWordForm } from './vocabulary-set-forms';
import {
  copyVocabularySet, createVocabularySet, createVocabularySetWord, deleteVocabularySet, deleteVocabularySetWord,
  getVocabularySet, getVocabularySetWords, listVocabularySets, setsKey, updateVocabularySet, updateVocabularySetWord,
  type SetInput, type VocabularySet, type VocabularySetWord, type WordInput,
} from '@/features/vocabulary/services/vocabulary-sets-service';

const listPath = '/vocabulary/sets' as const;
const setHref = (setId: string) => ({ pathname: '/vocabulary/sets/[setId]' as const, params: { setId } });

export function VocabularySetsScreen() {
  const [community, setCommunity] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...setsKey, 'list', community],
    queryFn: ({ signal }) => listVocabularySets(community, signal),
  });
  const create = useMutation({
    mutationFn: createVocabularySet,
    onSuccess: async (set) => {
      setCreating(false);
      await client.invalidateQueries({ queryKey: setsKey });
      router.push(setHref(set.id));
    },
  });

  return (
    <LearnerCanvas>
      <LearnerBack href="/vocabulary" label="Từ vựng" />
      <LearnerHeading title="Bộ từ vựng" />
      <View style={styles.row}>
        <LearnerControl label="Bộ từ của tôi" selected={!community} disabled={create.isPending} onPress={() => setCommunity(false)} />
        <LearnerControl label="Cộng đồng" selected={community} disabled={create.isPending} onPress={() => { setCommunity(true); setCreating(false); }} />
      </View>
      {!community && (creating ? (
        <VocabularySetForm pending={create.isPending} onSubmit={(input) => create.mutate(input)}
          onCancel={() => { create.reset(); setCreating(false); }} />
      ) : <LearnerControl label="Tạo bộ từ" tone="accent" onPress={() => setCreating(true)} />)}
      <MutationError error={create.error} />
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      {query.data?.length === 0 && <ThemedText>{community ? 'Chưa có bộ từ cộng đồng.' : 'Bạn chưa có bộ từ nào.'}</ThemedText>}
      {query.data?.map((set) => (
        <LearnerPanel key={set.id}>
          <LearnerControl label={set.title} glyph="›" onPress={() => router.push(setHref(set.id))} />
          <ThemedText type="small" themeColor="textSecondary">{set.level ? `${set.level} · ` : ''}{set.wordCount} từ{set.isCommunity ? ' · Cộng đồng' : ''}</ThemedText>
          {!!set.description && <ThemedText>{set.description}</ThemedText>}
        </LearnerPanel>
      ))}
    </LearnerCanvas>
  );
}

export function VocabularySetScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const query = useQuery({ queryKey: [...setsKey, setId], queryFn: ({ signal }) => getVocabularySet(setId, signal) });
  return (
    <LearnerCanvas scrollRef={scroll}>
      <LearnerBack label="Bộ từ vựng" href={listPath} />
      <LearnerLoadState pending={query.isPending} error={query.error} retry={() => void query.refetch()} />
      {query.data && !query.isError && (
        <SetDetail key={setId} set={query.data} scrollToActions={() => scroll.current?.scrollTo({ y: 0 })} />
      )}
    </LearnerCanvas>
  );
}

type Edit = 'set' | 'new-word' | VocabularySetWord | null;
type DeleteTarget = { type: 'set' } | { type: 'word'; word: VocabularySetWord };
type Action =
  | { kind: 'copy' }
  | { kind: 'delete'; target: DeleteTarget }
  | { kind: 'set'; input: SetInput }
  | { kind: 'word'; wordId?: string; input: WordInput };

function SetDetail({ set, scrollToActions }: { set: VocabularySet; scrollToActions: () => void }) {
  const client = useQueryClient();
  const router = useRouter();
  const [editor, setEditor] = useState<Edit>(null);
  const [confirmation, setConfirmation] = useState<DeleteTarget | null>(null);
  const [studying, setStudying] = useState(false);
  const words = useQuery({
    queryKey: [...setsKey, set.id, 'words'],
    queryFn: ({ signal }) => getVocabularySetWords(set.id, signal),
  });

  const mutation = useMutation({
    mutationFn: async (action: Action) => {
      switch (action.kind) {
        case 'copy': return copyVocabularySet(set.id);
        case 'delete':
          if (action.target.type === 'set') await deleteVocabularySet(set.id);
          else await deleteVocabularySetWord(set.id, action.target.word.id);
          break;
        case 'set': await updateVocabularySet(set.id, action.input); break;
        case 'word':
          if (action.wordId) await updateVocabularySetWord(set.id, action.wordId, action.input);
          else await createVocabularySetWord(set.id, action.input);
          break;
      }
    },
    onSuccess: async (copy, action) => {
      setEditor(null);
      setConfirmation(null);
      if (action.kind === 'delete' && action.target.type === 'set') router.dismissTo(listPath);
      if (copy) router.replace(setHref(copy.id));
      await client.invalidateQueries({ queryKey: setsKey });
    },
  });
  const pending = mutation.isPending;
  const close = () => { mutation.reset(); setEditor(null); setConfirmation(null); };
  const edit = (value: Edit) => { close(); setEditor(value); scrollToActions(); };
  const confirm = (value: DeleteTarget) => { close(); setConfirmation(value); scrollToActions(); };
  const editable = set.canEdit && !studying;
  const editingWord = editor && typeof editor === 'object' ? editor : undefined;

  return (
    <>
      <LearnerHeading title={set.title} description={set.description} />
      <ThemedText type="small" themeColor="textSecondary">{set.wordCount} từ{set.isCommunity ? ' · Cộng đồng' : ''}</ThemedText>
      <View style={styles.row}>
        {!!words.data?.length && <LearnerControl label={studying ? 'Về danh sách từ' : 'Học flashcard'} tone="accent" disabled={pending}
          onPress={() => { close(); setStudying(!studying); }} />}
        {editable && (
          <>
            <LearnerControl label="Sửa bộ" disabled={pending} onPress={() => edit('set')} />
            <LearnerControl label="Thêm từ" disabled={pending} onPress={() => edit('new-word')} />
            <LearnerControl label="Xóa bộ" disabled={pending} onPress={() => confirm({ type: 'set' })} />
          </>
        )}
        {!studying && set.isCommunity && <LearnerControl label="Sao chép vào bộ của tôi" disabled={pending} onPress={() => mutation.mutate({ kind: 'copy' })} />}
      </View>
      <MutationError error={mutation.error} />
      {confirmation && (
        <LearnerPanel>
          <ThemedText>{confirmation.type === 'set' ? `Xóa bộ “${set.title}” và toàn bộ từ trong bộ?` : `Xóa từ “${confirmation.word.japanese}”?`}</ThemedText>
          <View style={styles.row}>
            <LearnerControl label="Hủy" disabled={pending} onPress={close} />
            <LearnerControl label="Xác nhận xóa" disabled={pending} tone="accent" onPress={() => mutation.mutate({ kind: 'delete', target: confirmation })} />
          </View>
        </LearnerPanel>
      )}
      {editor === 'set' && <VocabularySetForm initial={set} pending={pending} onCancel={close} onSubmit={(input) => mutation.mutate({ kind: 'set', input })} />}
      {(editor === 'new-word' || editingWord) && <VocabularyWordForm key={editingWord?.id ?? 'new'} initial={editingWord} pending={pending}
        onCancel={close} onSubmit={(input) => mutation.mutate({ kind: 'word', wordId: editingWord?.id, input })} />}
      <LearnerLoadState pending={words.isPending} error={words.error} retry={() => void words.refetch()} />
      {words.data?.length === 0 && <ThemedText>Bộ này chưa có từ vựng.</ThemedText>}
      {studying && words.data?.length ? <VocabularyFlashcards cards={words.data} /> : words.data?.map((word) => (
        <LearnerPanel key={word.id}>
          <ThemedText type="smallBold">{word.japanese} · {word.reading}</ThemedText>
          <ThemedText>{word.meaning}</ThemedText>
          {!!word.example && <ThemedText>{word.example}</ThemedText>}
          {!!word.exampleMeaning && <ThemedText themeColor="textSecondary">{word.exampleMeaning}</ThemedText>}
          {editable && (
            <View style={styles.row}>
              <LearnerControl label="Sửa" accessibilityLabel={`Sửa từ ${word.japanese}`} disabled={pending} onPress={() => edit(word)} />
              <LearnerControl label="Xóa" accessibilityLabel={`Xóa từ ${word.japanese}`} disabled={pending} onPress={() => confirm({ type: 'word', word })} />
            </View>
          )}
        </LearnerPanel>
      ))}
    </>
  );
}

function MutationError({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof ApiError && error.status === 403
    ? 'Bạn không có quyền sửa bộ từ này.'
    : 'Không thể thực hiện thao tác. Vui lòng kiểm tra dữ liệu và thử lại.';
  return <ThemedText accessibilityLiveRegion="polite">{message}</ThemedText>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
