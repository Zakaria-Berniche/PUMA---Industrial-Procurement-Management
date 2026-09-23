import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDomainColor(domain: string) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    base: `hsl(${hue}, 75%, 45%)`,
    light: `hsl(${hue}, 75%, 95%)`,
    dark: `hsl(${hue}, 80%, 25%)`,
    glow: `rgba(${hue}, 75%, 45%, 0.15)`
  };
}
