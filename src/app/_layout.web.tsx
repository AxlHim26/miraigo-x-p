import '@/features/web/styles/roboto.css';
import '@/features/web/styles/globals.css';

import { Slot } from 'expo-router';
import Head from 'expo-router/head';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { WebProviders } from '@/features/web/theme/web-providers';

export default function WebLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WebProviders>
        <Head>
          <title>MiraiGo</title>
          <meta name="description" content="Nền tảng học ngữ pháp tiếng Nhật với trải nghiệm cao cấp." />
        </Head>
        <div className="mirai-web-content">
          <Slot />
        </div>
      </WebProviders>
    </GestureHandlerRootView>
  );
}
