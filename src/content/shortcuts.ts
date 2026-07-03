/* ============================================================
   shortcuts.ts — 全局键盘快捷键（仅展开态响应）
   建议6：全量可重绑。绑定存 settings.shortcuts（combo 串），处理器每次按键
   实时读该共享引用 → 设置面板改动即时生效，无需重挂监听器。
   默认（蓝图 §4.4/§4.5）：
     Mod+Z          → 撤销（仅展开态）    Mod = Ctrl(Win/Linux) / Cmd(Mac)
     Mod+Shift+Z    → 重做（仅展开态）
     Escape         → 退出当前工具（move/settings → annotate；annotate 不处理）
   注意：direct-edit 内联编辑的 Esc 在 capture 阶段 stopPropagation 先消费，
   此处注册在 capture 阶段但注册晚于 direct-edit，通过 stopPropagation 顺序化解。
   ============================================================ */

import { Controller } from './controller';
import { History } from '../state/history';
import { Settings } from '../state/settings';

/** 设置面板录制快捷键期间置 true：全局处理器让路，避免正在录制的键触发撤销/重做/退出。 */
let recording = false;

/** 设置面板在录制快捷键前后调用，屏蔽/恢复全局快捷键响应。 */
export function setShortcutRecording(on: boolean): void {
  recording = on;
}

/**
 * 把 KeyboardEvent 规范成 combo 串：修饰键固定序（Mod → Shift → Alt）+ 主键。
 * Mod = Ctrl(Win/Linux) 或 Cmd(Mac)，故 e.ctrlKey||e.metaKey 一律记为 `Mod`（跨平台匹配）。
 * 主键：单字符大写（如 `Z`）；命名键（`Escape`/`Enter`/`ArrowUp`/`F2`…）保留 e.key 原值。
 * 若按下的仅是修饰键本身（Control/Meta/Shift/Alt），返回 ''（表示尚无主键，继续等待）。
 */
export function formatCombo(e: KeyboardEvent): string {
  const key = e.key;
  if (key === 'Control' || key === 'Meta' || key === 'Shift' || key === 'Alt') return '';
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Mod');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  parts.push(key.length === 1 ? key.toUpperCase() : key);
  return parts.join('+');
}

/** 事件是否匹配给定 combo 串（大小写不敏感，因 formatCombo 已规范化）。 */
export function matchCombo(e: KeyboardEvent, combo: string): boolean {
  if (!combo) return false;
  return formatCombo(e).toLowerCase() === combo.toLowerCase();
}

/** 注册快捷键监听器，返回卸载函数。keymap 实时读 settings.shortcuts（共享引用）。 */
export function setupShortcuts(
  controller: Controller,
  history: History,
  settings: Settings
): () => void {
  const handler = (e: KeyboardEvent): void => {
    // 仅展开态响应
    if (!controller.getState().expanded) return;
    // 设置面板正在录制快捷键 → 让路（录制监听器自行消费该键）
    if (recording) return;

    const sc = settings.shortcuts;

    if (matchCombo(e, sc.undo)) {
      e.preventDefault();
      history.undo();
      return;
    }

    if (matchCombo(e, sc.redo)) {
      e.preventDefault();
      history.redo();
      return;
    }

    if (matchCombo(e, sc.exit)) {
      const { mode } = controller.getState();
      if (mode === 'move' || mode === 'settings') {
        // toggleMode 再次点同一模式 → 回 annotate
        controller.toggleMode(mode);
      }
      // annotate 态不处理（留给各 manager 自己的 Esc）
    }
  };

  window.addEventListener('keydown', handler, true);
  return () => window.removeEventListener('keydown', handler, true);
}
