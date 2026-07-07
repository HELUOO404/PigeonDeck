import type { Settings } from '../state/settings';

export type Theme = Settings['theme'];

let themeHost: HTMLElement | null = null;

export function applyTheme(host: HTMLElement, theme: Theme): void {
  host.setAttribute('data-theme', theme);
}

export function setThemeHost(host: HTMLElement | null): void {
  themeHost = host;
}

export function setTheme(theme: Theme): void {
  if (!themeHost) return;
  applyTheme(themeHost, theme);
}
