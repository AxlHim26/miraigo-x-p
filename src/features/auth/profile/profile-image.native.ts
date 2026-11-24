import { getDocumentAsync } from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

const directory = new Directory(Paths.document, 'miraigo-profile-photos');
export const avatarUri = (key: string) => /^photo-[\w-]+\.(?:jpg|jpeg|png|webp|heic|heif)$/i.test(key)
  ? new File(directory, key).uri : undefined;

export async function pickProfilePhoto() {
  const selection = await getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
  if (selection.canceled) return null;
  const image = selection.assets[0];
  const extension = image.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)?.[1].toLowerCase();
  if (!extension || (image.size ?? 0) > 10_000_000) throw new Error('Unsupported profile image');
  const filename = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  directory.create({ intermediates: true, idempotent: true });
  new File(image.uri).copy(new File(directory, filename));
  return filename;
}
