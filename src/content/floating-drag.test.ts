// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDraggableByHandle } from './floating-drag';

describe('makeDraggableByHandle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('does not start dragging from interactive controls', () => {
    const panel = document.createElement('div');
    const handle = document.createElement('div');
    const button = document.createElement('button');
    const onDrag = vi.fn();
    handle.appendChild(button);
    panel.appendChild(handle);
    document.body.appendChild(panel);
    makeDraggableByHandle(panel, handle, onDrag);

    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
    handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 20, clientY: 20 }));

    expect(onDrag).not.toHaveBeenCalled();
  });

  it('runs the drag-start callback once when dragging starts', () => {
    const panel = document.createElement('div');
    const handle = document.createElement('div');
    const onDragStart = vi.fn();
    panel.appendChild(handle);
    document.body.appendChild(panel);
    makeDraggableByHandle(panel, handle, undefined, onDragStart);

    handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: 10, clientY: 10 }));
    handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 20, clientY: 20 }));
    handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 30, clientY: 30 }));

    expect(onDragStart).toHaveBeenCalledTimes(1);
  });
});
