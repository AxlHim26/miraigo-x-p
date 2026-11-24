import { Directory, File, Paths } from 'expo-file-system';

type Snapshot = { revision: number; value: string };

async function readSlot(file: File): Promise<Snapshot | null> {
  if (!file.exists) return null;
  try {
    const data = JSON.parse(await file.text()) as Snapshot;
    return Number.isSafeInteger(data?.revision) && typeof data?.value === 'string' ? data : null;
  } catch {
    return null;
  }
}

export function createStudyStorage(folder: string) {
  const directory = new Directory(Paths.document, folder);

  async function snapshots(key: string) {
    const files = [new File(directory, `${key}.0.json`), new File(directory, `${key}.1.json`)] as const;
    const [first, second] = await Promise.all(files.map(readSlot));
    const slot = first && (!second || first.revision >= second.revision) ? 0 : 1;
    const latest = slot === 0 ? first : second;
    if (!latest && files.some((file) => file.exists)) throw new Error('Stored study progress could not be read');
    return { files, latest, slot };
  }

  return {
    get: async (key: string) => (await snapshots(key)).latest?.value ?? null,
    set: async (key: string, value: string) => {
      const { files, latest, slot } = await snapshots(key);
      directory.create({ idempotent: true, intermediates: true });
      // Keep the last complete snapshot if writing the other slot is interrupted.
      files[slot === 0 ? 1 : 0].write(JSON.stringify({ revision: (latest?.revision ?? 0) + 1, value }));
    },
  };
}
