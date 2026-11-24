import { Link, type Href } from 'expo-router';
import { forwardRef, type ComponentProps } from 'react';

type Props = Omit<ComponentProps<'a'>, 'href'> & { href: string };

const BrowserAnchor = forwardRef<HTMLAnchorElement, ComponentProps<'a'> & { onPress?: unknown }>(
  function BrowserAnchor({ onPress: _onPress, ...props }, ref) {
    return <a {...props} ref={ref} />;
  },
);

export default function WebLink({ href, ...props }: Props) {
  if (href.startsWith('#')) return <a href={href} {...props} />;

  return (
    <Link href={href as Href} asChild>
      <BrowserAnchor {...props} />
    </Link>
  );
}
