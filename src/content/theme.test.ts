// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { applyTheme, setTheme, setThemeHost } from './theme';

describe('theme host helpers', () => {
  it('applies the theme to a Shadow host element', () => {
    const host = document.createElement('div');

    applyTheme(host, 'dark');

    expect(host.getAttribute('data-theme')).toBe('dark');
  });

  it('updates the registered Shadow host', () => {
    const host = document.createElement('div');
    setThemeHost(host);

    setTheme('dark');
    expect(host.getAttribute('data-theme')).toBe('dark');

    setTheme('light');
    expect(host.getAttribute('data-theme')).toBe('light');
  });
});
