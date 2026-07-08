import { Annotation, RICHTEXT_DOM_CSSPROP } from '../state/annotations';
import type { StyleChange } from '../state/annotations';
import { fieldLabelKey } from './field-labels';
import { t } from './i18n';

export interface ChangeSummaryRow {
  label: string;
  oldText: string;
  newText: string;
}

export type AnnotationSummaryRow =
  | { kind: 'change'; row: ChangeSummaryRow }
  | { kind: 'richText'; text: string };

export function truncateValue(value: string, max = 24): string {
  return value.length > max ? value.slice(0, max) + '…' : value;
}

export function htmlToText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function srcSummary(src: string): string {
  if (!src) return '—';
  if (src.startsWith('data:')) {
    const mime = src.slice(5, src.indexOf(';') >= 0 ? src.indexOf(';') : src.indexOf(','));
    return `data:${mime || 'media'}`;
  }
  try {
    const u = new URL(src, location.href);
    const last = u.pathname.split('/').filter(Boolean).pop();
    return last || u.hostname;
  } catch {
    return src;
  }
}

export function summarizeStyleChange(change: StyleChange): ChangeSummaryRow | null {
  if (change.cssProp === RICHTEXT_DOM_CSSPROP) return null;
  const isHtml = change.cssProp === 'html';
  const isText = change.cssProp === 'text';
  const isSrc = change.cssProp === 'src';
  const labelKey = fieldLabelKey(change.prop);
  const label =
    isHtml || isText
      ? t('rt_content_change')
      : isSrc
        ? t('replace_media_change')
        : labelKey
          ? t(labelKey)
          : change.prop;
  const format = (v: string): string => (isHtml ? htmlToText(v) : isSrc ? srcSummary(v) : v);
  return {
    label,
    oldText: truncateValue(format(change.oldValue)),
    newText: truncateValue(format(change.newValue)),
  };
}

export function summarizeAnnotationRows(annotation: Annotation): AnnotationSummaryRow[] {
  const rows: AnnotationSummaryRow[] = [];
  for (const change of annotation.changes) {
    const row = summarizeStyleChange(change);
    if (row) rows.push({ kind: 'change', row });
  }
  for (const rc of annotation.richText ?? []) {
    rows.push({ kind: 'richText', text: rc.summary });
  }
  return rows;
}

export function composeCardChangeLines(annotation: Annotation): string[] {
  return summarizeAnnotationRows(annotation).map((row) =>
    row.kind === 'change' ? `${row.row.label}: ${row.row.oldText} → ${row.row.newText}` : row.text
  );
}
