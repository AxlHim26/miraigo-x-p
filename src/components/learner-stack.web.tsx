import { Slot } from 'expo-router';

export default function LearnerWebStack() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Slot />
    </div>
  );
}
