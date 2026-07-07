import { describe, expect, it } from 'vitest';
import { FIELD_CATEGORY, advancedRows, modbarRows, modbarTitleKey } from './field-layout';

describe('field layout helpers', () => {
  it('selects compact modbar rows by element type', () => {
    expect(modbarRows('text').flat()).toContain('text');
    expect(modbarRows('image').flat()).toContain('replaceImg');
    expect(modbarRows('video').flat()).toContain('replaceImg');
    expect(modbarRows('button').flat()).toContain('bgColor');
    expect(modbarRows('container').flat()).toEqual(modbarRows('button').flat());
  });

  it('selects localized title keys by element type', () => {
    expect(modbarTitleKey('text')).toBe('modbar_text');
    expect(modbarTitleKey('other')).toBe('modbar_auto');
  });

  it('keeps every advanced field in a known category', () => {
    const keys = [
      ...advancedRows('typography').flat(),
      ...advancedRows('size').flat(),
      ...advancedRows('appearance').flat(),
    ];

    for (const key of keys) {
      expect(FIELD_CATEGORY[key], key).toBeTruthy();
    }
  });
});
