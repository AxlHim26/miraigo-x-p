type Result = { text: string; score: number; uri: string };

export function useSpeakingRecorder() {
  const toggle: (reference: string, onResult: (result: Result) => void) => Promise<void> = async () => undefined;
  return { isRecording: false, seconds: 0, busy: false, error: 'Mở bằng ứng dụng mobile để ghi âm.', toggle };
}
