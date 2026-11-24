import { deviceStorage } from '@/shared/utils/device-storage';

export const createStudyStorage: (folder: string) => typeof deviceStorage = () => deviceStorage;
