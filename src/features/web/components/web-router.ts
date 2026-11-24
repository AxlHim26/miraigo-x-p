import { router, type Href } from 'expo-router';

export { usePathname } from 'expo-router';

const webRouter = {
  push: (href: string) => router.push(href as Href),
  replace: (href: string) => router.replace(href as Href),
};

export function useRouter() {
  return webRouter;
}
