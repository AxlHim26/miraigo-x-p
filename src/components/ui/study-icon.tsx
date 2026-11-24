import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

export type StudySymbol = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

export function studySymbol(ios: SFSymbol, android: AndroidSymbol): StudySymbol {
  return { ios, android, web: android };
}

export function StudyIcon({ name, color, size = 24 }: { name: StudySymbol; color: string; size?: number }) {
  return (
    <SymbolView
      accessible={false}
      importantForAccessibility="no"
      name={name}
      size={size}
      tintColor={color}
      weight="semibold"
    />
  );
}
