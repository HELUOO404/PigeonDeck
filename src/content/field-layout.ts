import type { ElementType } from '../shared/dom-utils';

export type FieldRow = string[];
export type AdvCategory = 'typography' | 'size' | 'appearance' | 'debug';

export const FIELD_CATEGORY: Record<string, 'typography' | 'size' | 'appearance'> = {
  text: 'typography',
  font: 'typography',
  fontSize: 'typography',
  fontWeight: 'typography',
  color: 'typography',
  align: 'typography',
  decoration: 'typography',
  fontStyle: 'typography',
  textDecoration: 'typography',
  lineHeight: 'typography',
  letter: 'typography',
  listStyle: 'typography',
  transform: 'typography',
  margin: 'typography',
  padding: 'typography',
  width: 'size',
  height: 'size',
  minW: 'size',
  maxW: 'size',
  display: 'size',
  overflow: 'size',
  bgColor: 'appearance',
  bgImage: 'appearance',
  border: 'appearance',
  borderColor: 'appearance',
  radius: 'appearance',
  shadow: 'appearance',
  shadowColor: 'appearance',
  opacity: 'appearance',
  blur: 'appearance',
  fill: 'appearance',
  stroke: 'appearance',
  strokeWidth: 'appearance',
};

export function modbarTitleKey(type: ElementType): string {
  switch (type) {
    case 'text':
      return 'modbar_text';
    case 'image':
      return 'modbar_image';
    case 'video':
      return 'modbar_video';
    case 'button':
    case 'container':
      return 'modbar_box';
    default:
      return 'modbar_auto';
  }
}

export function modbarRows(type: ElementType): FieldRow[] {
  switch (type) {
    case 'text':
      return [['text'], ['fontSize', 'fontWeight'], ['color'], ['align']];
    case 'image':
    case 'video':
      return [['replaceImg'], ['width', 'height'], ['radius', 'border']];
    case 'button':
    case 'container':
      return [['bgColor'], ['radius', 'border'], ['shadow'], ['opacity'], ['margin', 'padding']];
    default:
      return [];
  }
}

export function advancedRows(category: AdvCategory): FieldRow[] {
  switch (category) {
    case 'typography':
      return [
        ['font'],
        ['fontSize', 'fontWeight'],
        ['color'],
        ['align'],
        ['decoration'],
        ['lineHeight', 'letter'],
        ['listStyle', 'transform'],
        ['margin', 'padding'],
      ];
    case 'size':
      return [['width', 'height'], ['minW', 'maxW'], ['display'], ['overflow']];
    case 'appearance':
      return [
        ['bgColor'],
        ['bgImage'],
        ['border', 'radius'],
        ['borderColor'],
        ['shadow'],
        ['shadowColor'],
        ['opacity'],
        ['blur'],
      ];
    default:
      return [];
  }
}
