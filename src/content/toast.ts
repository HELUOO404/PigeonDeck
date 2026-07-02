/* ============================================================
   toast.ts — 轻提示（渲染进 feedback 层）
   design-system §5.23：190ms 进出，~2.5s 自动消失。
   ============================================================ */

const TOAST_DURATION_MS = 2500;
const TOAST_TRANSITION_MS = 190; // --t-mid

const ICON_INFO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ico-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
const ICON_OK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ico-ok"><path d="M20 6 9 17l-5-5"/></svg>`;

export type ToastKind = 'info' | 'ok';

export class Toast {
  private root: HTMLElement; // feedback 层根容器
  private current: HTMLElement | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(feedbackLayer: HTMLElement) {
    this.root = feedbackLayer;
  }

  show(message: string, kind: ToastKind = 'info'): void {
    this.dismiss();

    const toast = document.createElement('div');
    toast.className = 'pd-toast';
    toast.setAttribute('data-testid', 'pd-toast');
    toast.innerHTML = kind === 'ok' ? ICON_OK : ICON_INFO;
    toast.appendChild(document.createTextNode(message));
    this.root.appendChild(toast);
    this.current = toast;

    // 强制 reflow 后加 show 类，触发 190ms 进场过渡
    void toast.offsetHeight;
    toast.classList.add('show');

    this.hideTimer = setTimeout(() => this.dismiss(), TOAST_DURATION_MS);
  }

  private dismiss(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    const toast = this.current;
    if (!toast) return;
    this.current = null;
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), TOAST_TRANSITION_MS);
  }
}
