export const learnerTabs = [
  { name: '(home)', label: 'Trang chủ', route: '/', icon: { ios: 'house.fill', android: 'home', web: 'home' }, fallback: '⌂' },
  { name: '(courses)', label: 'Khóa học', route: '/courses', icon: { ios: 'book', android: 'menu_book', web: 'menu_book' }, fallback: '▤' },
  { name: '(practice)', label: 'Luyện tập', route: '/practice', icon: { ios: 'chart.bar.fill', android: 'equalizer', web: 'equalizer' }, fallback: '▥' },
  { name: 'progress', label: 'Tiến độ', route: '/progress', icon: { ios: 'chart.bar.xaxis', android: 'bar_chart', web: 'bar_chart' }, fallback: '▥' },
  { name: '(account)', label: 'Cá nhân', route: '/account', icon: { ios: 'person.crop.circle', android: 'person', web: 'person' }, fallback: '●' },
] as const;

export function getLearnerTabIndex(pathname: string) {
  if (/^\/courses(?:\/|$)/.test(pathname)) return 1;
  if (/^\/(?:progress|vocabulary\/stats|practice\/(?:listening|reading)\/stats)(?:\/|$)/.test(pathname)) return 3;
  if (/^\/practice(?:\/|$)/.test(pathname)) return 2;
  if (/^\/(?:account|settings)(?:\/|$)/.test(pathname)) return 4;
  return 0;
}

export function shouldHideLearnerTabs(pathname: string) {
  if (pathname === '/settings') return true;
  return pathname !== '/practice/speaking' && pathname !== '/practice/chat' && /^\/(?:vocabulary|grammar|courses|practice|account)\/[^/]+/.test(pathname);
}
