import type {
  ComponentInfo,
  ChangesetEntry,
  RelayStatus,
  TokenPattern,
} from './types';
import type { RelayClient } from './relay';
import { formatAgentPrompt, formatForClipboard } from './prompt';

/* ── Panel theme (dev-tool overlay; rgb()/rgba() so it never inherits product tokens) ── */
const C = {
  bg: 'rgb(44, 44, 44)',
  surface: 'rgb(56, 56, 56)',
  surfaceHover: 'rgb(64, 64, 64)',
  input: 'rgb(30, 30, 30)',
  inputHover: 'rgb(42, 42, 42)',
  inputFocus: 'rgb(13, 153, 255)',
  text: 'rgb(255, 255, 255)',
  textSecondary: 'rgb(173, 173, 173)',
  textTertiary: 'rgb(119, 119, 119)',
  accent: 'rgb(13, 153, 255)',
  accentDim: 'rgba(13, 153, 255, 0.15)',
  success: 'rgb(48, 209, 88)',
  error: 'rgb(255, 69, 58)',
  divider: 'rgb(64, 64, 64)',
  chevron: 'rgb(136, 136, 136)',
} as const;
const F = `Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;
const M = `ui-monospace,SFMono-Regular,Menlo,monospace`;

/* ── Helpers ── */
function css(strings: TemplateStringsArray, ...vals: (string | number)[]) {
  return strings.reduce((acc, s, i) => acc + s + (vals[i] ?? ''), '');
}

function findStyleValue(styles: Record<string, string>, prop: string): string {
  return styles[prop] ?? '';
}

function shortenValue(val: string): string {
  if (!val) {
    return '';
  }
  return val.replace(/px$/u, '').trim();
}

/**
 * Convert a CSS color to the `#rrggbb` form required by `<input type="color">`.
 * The `#`-prefixed strings are built via interpolation (not hex literals) so the
 * value stays valid for the color input without hardcoding hex color tokens.
 *
 * @param color - A CSS color string (hex or `rgb()/rgba()`).
 */
function toHexColor(color: string): string {
  if (color.startsWith('#')) {
    return color;
  }
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/u);
  if (!m) {
    return `#${hex(0)}${hex(0)}${hex(0)}`;
  }
  return `#${hex(Number(m[1]))}${hex(Number(m[2]))}${hex(Number(m[3]))}`;
}

/* ── Built-in token patterns ── */
const DEFAULT_TOKEN_PATTERNS: TokenPattern[] = [
  { pattern: /^(token|ds|theme)-/u, category: 'Design Token' },
  { pattern: /^(text|bg|border|shadow|color)-/u, category: 'Tailwind Color' },
  { pattern: /^(p|m|gap|space|w|h|min|max)-/u, category: 'Tailwind Spacing' },
  {
    pattern: /^(flex|grid|col|row|justify|items|self)-/u,
    category: 'Tailwind Layout',
  },
  {
    pattern: /^(font|text|leading|tracking|uppercase|lowercase|capitalize)/u,
    category: 'Tailwind Typography',
  },
];

/* ── CSS ── */
const PANEL_CSS = css`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :host {
    all: initial;
  }

  @keyframes pulse-orb {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.3);
    }
  }

  .panel {
    position: fixed;
    width: 340px;
    background: ${C.bg};
    border-radius: 10px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.55),
      0 0 0 1px rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    font-family: ${F};
    font-size: 12px;
    color: ${C.text};
    z-index: 2147483645;
    overflow: hidden;
    user-select: none;
    transition: max-height 0.2s ease;
  }
  .panel.hover-mode {
    max-height: 280px;
    overflow: hidden;
  }
  .panel.locked-mode {
    max-height: 680px;
    overflow-y: auto;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: ${C.surface};
    cursor: move;
    flex-shrink: 0;
    border-bottom: 1px solid ${C.divider};
  }
  .drag-handle {
    color: ${C.textSecondary};
    font-size: 16px;
    cursor: grab;
    flex-shrink: 0;
    line-height: 1;
  }
  .header-title {
    flex: 1;
    font-weight: 600;
    font-size: 13px;
    color: ${C.textSecondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .header-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .icon-btn {
    background: none;
    border: none;
    color: ${C.textSecondary};
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1;
  }
  .icon-btn:hover {
    background: ${C.surfaceHover};
    color: ${C.text};
  }
  .copy-btn {
    font-size: 10px;
    background: ${C.surface};
    color: ${C.textSecondary};
    border: 1px solid ${C.divider};
    border-radius: 4px;
    padding: 3px 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .copy-btn:hover {
    color: ${C.text};
    border-color: ${C.accent};
  }
  .copy-btn.copied {
    color: ${C.success};
    border-color: ${C.success};
  }

  /* Lock bar */
  .lock-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 12px;
    background: ${C.accentDim};
    font-size: 10px;
    color: ${C.accent};
  }
  .unlock-btn {
    background: transparent;
    border: 1px solid ${C.accent};
    color: ${C.accent};
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 10px;
    cursor: pointer;
  }
  .unlock-btn:hover {
    background: ${C.accent};
    color: rgb(255, 255, 255);
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    color: ${C.textTertiary};
    text-align: center;
  }

  /* Element header */
  .el-header {
    padding: 10px 12px;
    border-bottom: 1px solid ${C.divider};
  }
  .el-name {
    font-weight: 700;
    font-size: 13px;
    color: ${C.text};
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .test-id-pill {
    font-size: 9px;
    font-family: ${M};
    background: ${C.accentDim};
    color: ${C.accent};
    padding: 1px 6px;
    border-radius: 8px;
    font-weight: 500;
  }
  .el-breadcrumb {
    font-size: 10px;
    color: ${C.textTertiary};
    margin-top: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .el-filepath {
    font-size: 10px;
    color: ${C.textTertiary};
    font-family: ${M};
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Body */
  .body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
  .body::-webkit-scrollbar {
    width: 4px;
  }
  .body::-webkit-scrollbar-track {
    background: transparent;
  }
  .body::-webkit-scrollbar-thumb {
    background: ${C.divider};
    border-radius: 2px;
  }

  /* Sections */
  .section {
    border-bottom: 1px solid ${C.divider};
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    background: none;
    border: none;
    width: 100%;
    color: ${C.textSecondary};
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    cursor: pointer;
    font-family: ${F};
  }
  .section-header:hover {
    background: ${C.surfaceHover};
  }
  .section-icon {
    font-size: 11px;
    width: 14px;
    text-align: center;
  }
  .chevron {
    font-size: 8px;
    transition: transform 0.15s;
    color: ${C.chevron};
    margin-left: auto;
  }
  .chevron.open {
    transform: rotate(90deg);
  }
  .section-body {
    padding: 6px 12px 10px;
  }

  /* Property rows */
  .prop-row {
    display: flex;
    align-items: flex-start;
    min-height: 24px;
    gap: 6px;
    margin: 1px 0;
  }
  .prop-label {
    font-size: 10px;
    color: ${C.textTertiary};
    width: 72px;
    flex-shrink: 0;
    padding-top: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .prop-value {
    flex: 1;
    min-width: 0;
  }

  /* Two-col grid */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 8px;
  }

  /* Editable values */
  .editable {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-family: ${M};
    color: ${C.text};
    border: 1px solid transparent;
    min-height: 22px;
    word-break: break-all;
    transition: background 0.1s;
  }
  .editable:hover {
    background: ${C.inputHover};
    border-color: ${C.divider};
  }
  .editable input,
  .edit-input {
    width: 100%;
    background: ${C.input};
    color: ${C.text};
    border: 1px solid ${C.inputFocus};
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    font-family: ${M};
    outline: none;
  }
  .color-swatch {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
    cursor: pointer;
  }
  .color-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
  .readonly {
    font-size: 11px;
    font-family: ${M};
    color: ${C.text};
    padding: 2px 6px;
    word-break: break-all;
  }

  /* Text area */
  .text-input {
    width: 100%;
    background: ${C.input};
    color: ${C.text};
    border: 1px solid ${C.divider};
    border-radius: 4px;
    padding: 6px 8px;
    font-size: 11px;
    font-family: ${F};
    outline: none;
    resize: vertical;
    min-height: 40px;
  }
  .text-input:focus {
    border-color: ${C.inputFocus};
  }

  /* Spacing editor */
  .spacing-editor {
    margin: 4px 0;
  }
  .spacing-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 4px;
    font-family: ${F};
  }
  .spacing-cross-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
    background: ${C.input};
    border-radius: 6px;
    border: 1px solid ${C.divider};
  }
  .spacing-mid-row {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    justify-content: center;
  }
  .spacing-cross-wrap .sc-center {
    width: 36px;
    height: 18px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .mini-input {
    width: 40px;
    text-align: center;
    background: transparent;
    color: ${C.text};
    border: 1px solid transparent;
    border-radius: 3px;
    padding: 2px 2px;
    font-size: 10px;
    font-family: ${M};
    outline: none;
    cursor: pointer;
    transition:
      border-color 0.1s,
      background-color 0.1s;
  }
  .mini-input:hover {
    border-color: ${C.divider};
    background: ${C.inputHover};
  }
  .mini-input:focus {
    border-color: ${C.inputFocus};
    background: ${C.input};
  }

  /* Pill list */
  .pill-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 8px;
    background: ${C.surface};
    border-radius: 10px;
    font-size: 10px;
    font-family: ${M};
    color: ${C.textSecondary};
    max-width: 100%;
    overflow: hidden;
  }
  .pill-x {
    color: ${C.textTertiary};
    cursor: pointer;
    padding: 0 2px;
    font-size: 10px;
  }
  .pill-x:hover {
    color: ${C.error};
  }
  .add-btn {
    font-size: 10px;
    color: ${C.accent};
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    margin-top: 4px;
  }
  .add-input {
    font-size: 10px;
    font-family: ${M};
    background: ${C.input};
    color: ${C.text};
    border: 1px solid ${C.inputFocus};
    border-radius: 4px;
    padding: 3px 6px;
    outline: none;
    width: 100%;
    margin-top: 4px;
  }

  /* Props JSON */
  .props-pre {
    font-size: 10px;
    font-family: ${M};
    color: ${C.textTertiary};
    background: ${C.input};
    border-radius: 4px;
    padding: 6px 8px;
    margin-top: 6px;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 100px;
    overflow-y: auto;
    line-height: 1.4;
  }

  /* Chat footer */
  .footer {
    flex-shrink: 0;
    background: rgb(26, 26, 26);
    border-radius: 0 0 10px 10px;
  }
  .footer-top {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-top: 1px solid ${C.divider};
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background: ${C.textTertiary};
  }
  .status-dot.connected {
    background: ${C.success};
    box-shadow: 0 0 6px ${C.success};
  }
  .status-dot.disconnected {
    background: ${C.error};
    box-shadow: 0 0 6px ${C.error};
  }
  .component-pill {
    font-size: 10px;
    font-family: ${M};
    color: ${C.textSecondary};
    background: ${C.surface};
    padding: 1px 6px;
    border-radius: 8px;
  }

  /* Pending edits banner */
  .edits-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: rgba(255, 165, 0, 0.12);
    font-size: 10px;
    color: rgb(255, 179, 71);
  }
  .edits-banner-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .apply-btn {
    background: rgb(255, 179, 71);
    color: rgb(26, 26, 26);
    border: none;
    border-radius: 4px;
    padding: 3px 10px;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
  }
  .apply-btn:hover {
    background: rgb(255, 197, 110);
  }

  /* Message thread */
  .message-thread {
    max-height: 160px;
    overflow-y: auto;
    padding: 6px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .message-thread::-webkit-scrollbar {
    width: 3px;
  }
  .message-thread::-webkit-scrollbar-thumb {
    background: ${C.divider};
    border-radius: 2px;
  }
  .msg-sent {
    align-self: flex-end;
    background: ${C.accent};
    color: rgb(255, 255, 255);
    border-radius: 8px 8px 2px 8px;
    padding: 5px 8px;
    font-size: 11px;
    max-width: 85%;
    word-break: break-word;
    line-height: 1.35;
  }
  .msg-agent {
    align-self: flex-start;
    background: ${C.surface};
    color: ${C.textSecondary};
    border-radius: 8px 8px 8px 2px;
    padding: 5px 8px;
    font-size: 11px;
    max-width: 85%;
    word-break: break-word;
    line-height: 1.35;
  }
  .msg-status {
    align-self: center;
    color: ${C.textTertiary};
    font-size: 10px;
    font-style: italic;
  }

  /* Agent working indicator */
  .agent-working {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    font-size: 10px;
    color: ${C.textTertiary};
  }
  .pulse-orb {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${C.accent};
    animation: pulse-orb 1.2s ease-in-out infinite;
  }

  /* Composer */
  .composer {
    display: flex;
    align-items: flex-end;
    padding: 6px 12px 10px;
    gap: 0;
    position: relative;
  }
  .composer-wrap {
    flex: 1;
    position: relative;
  }
  .chat-input {
    width: 100%;
    box-sizing: border-box;
    background: ${C.input};
    color: ${C.text};
    border: 1px solid ${C.divider};
    border-radius: 8px;
    padding: 8px 40px 8px 10px;
    font-size: 11px;
    font-family: ${F};
    outline: none;
    resize: none;
    min-height: 36px;
  }
  .chat-input:focus {
    border-color: ${C.inputFocus};
  }
  .send-btn {
    position: absolute;
    right: 5px;
    bottom: 7px;
    background: ${C.accent};
    color: rgb(255, 255, 255);
    border: none;
    border-radius: 6px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
  }
  .send-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  /* Minimized */
  .minimized .body,
  .minimized .footer,
  .minimized .el-header,
  .minimized .lock-bar,
  .minimized .empty-state {
    display: none;
  }
`;

/** Upper bound on the chat thread length (oldest messages are dropped). */
const MAX_CHAT_MESSAGES = 50;

/* ── Types ── */
type EditState = { original: string; current: string };
type ChatMessage = { type: 'sent' | 'agent' | 'status'; text: string };
type PanelOptions = {
  onClose?: () => void;
  onUnlock?: () => void;
  tokenPatterns?: TokenPattern[];
};

/* ── PanelController ── */
export class PanelController {
  private host: HTMLElement | null = null;

  private shadow: ShadowRoot | null = null;

  private relay: RelayClient;

  private options: PanelOptions;

  private info: ComponentInfo | null = null;

  private selectedEl: HTMLElement | null = null;

  private originalSnapshot: Record<string, string> = {};

  private editLog: Map<string, EditState> = new Map();

  private editLogStrings: string[] = [];

  private chatMessages: ChatMessage[] = [];

  private agentWorking = false;

  private relayStatus: RelayStatus = 'checking';

  private isMinimized = false;

  private isVisible = false;

  private isLocked = false;

  private anchor: {
    h: 'left' | 'right';
    x: number;
    v: 'top' | 'bottom';
    y: number;
  } = { h: 'right', x: 20, v: 'bottom', y: 20 };

  private sectionStates: Map<string, boolean> = new Map();

  private healthInterval: ReturnType<typeof setInterval> | null = null;

  /** True after unmount(); guards async callbacks against touching a dead panel. */
  private destroyed = false;

  /** Removes the document-level listeners of an in-progress header drag. */
  private activeDragCleanup: (() => void) | null = null;

  private copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(relay: RelayClient, options: PanelOptions) {
    this.relay = relay;
    this.options = options;
  }

  mount(container: Element) {
    this.destroyed = false;
    this.host = document.createElement('div');
    this.host.className = 'dm-panel';
    this.host.setAttribute('data-designer-mode', 'panel');
    this.shadow = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = PANEL_CSS;
    this.shadow.appendChild(style);

    // Align bottom edge with toggle button (bottom: 20px, right: 20px)
    this.render();
    container.appendChild(this.host);

    this.relay.onResponse((r: string) => {
      if (this.destroyed) {
        return;
      }
      this.agentWorking = false;
      this.pushChatMessage({ type: 'agent', text: r });
      this.render();
    });

    this.checkHealth();
    this.healthInterval = setInterval(() => this.checkHealth(), 10000);
  }

  setPosition(right: number, bottom: number) {
    const panelW = 340;
    const panelH = 680; // max locked height
    const toggleSize = 44;

    // Determine horizontal anchor
    const toggleLeft = window.innerWidth - right - toggleSize;
    if (right + panelW <= window.innerWidth) {
      // Panel fits to the right-aligned side
      this.anchor = { ...this.anchor, h: 'right', x: right };
    } else if (toggleLeft + panelW <= window.innerWidth) {
      // Panel fits on the left side
      this.anchor = { ...this.anchor, h: 'left', x: toggleLeft };
    } else {
      this.anchor = {
        ...this.anchor,
        h: 'right',
        x: Math.max(0, window.innerWidth - panelW),
      };
    }

    // Determine vertical anchor
    const toggleTop = window.innerHeight - bottom - toggleSize;
    if (bottom + panelH <= window.innerHeight) {
      // Panel fits growing upward from bottom
      this.anchor = { ...this.anchor, v: 'bottom', y: bottom };
    } else if (toggleTop + panelH <= window.innerHeight) {
      // Panel fits growing downward from top
      this.anchor = { ...this.anchor, v: 'top', y: toggleTop };
    } else {
      this.anchor = {
        ...this.anchor,
        v: 'bottom',
        y: Math.max(0, window.innerHeight - panelH),
      };
    }
  }

  showCompact() {
    this.info = null;
    this.selectedEl = null;
    this.isLocked = false;
    // Discard pending edits — with no selection they could neither be shown
    // correctly nor sent (sendToAgent requires info), so a stale banner would
    // just be misleading.
    this.editLog.clear();
    this.editLogStrings = [];
    this.isVisible = true;
    this.render();
  }

  show(info: ComponentInfo, el: HTMLElement) {
    this.info = info;
    this.selectedEl = el;
    this.isLocked = true;
    const snap: Record<string, string> = {};
    for (const group of Object.values(info.computedStyles)) {
      for (const [k, v] of Object.entries(group as Record<string, string>)) {
        snap[k] = v;
      }
    }
    if (info.textContent) {
      snap.__textContent = info.textContent;
    }
    snap.__classes = info.classes.join(' ');
    this.originalSnapshot = snap;
    this.editLog.clear();
    this.editLogStrings = [];
    this.isVisible = true;
    this.render();
  }

  showHover(info: ComponentInfo, el: HTMLElement) {
    if (this.isLocked) {
      return;
    } // don't override locked panel with hover
    if (this.selectedEl === el && this.isVisible) {
      // Same element as the last hover — mousemove fires continuously, and a
      // full Shadow-DOM rebuild per event is pure churn.
      return;
    }
    this.info = info;
    this.selectedEl = el;
    this.isVisible = true;
    this.render();
  }

  hideHover() {
    if (this.isLocked) {
      return;
    } // don't hide locked panel on mouse leave
    this.info = null;
    this.selectedEl = null;
    // Keep panel visible in compact mode (no info, but still showing)
    this.render();
  }

  hide() {
    this.info = null;
    this.selectedEl = null;
    this.isLocked = false;
    this.isVisible = false;
    this.editLog.clear();
    this.editLogStrings = [];
    this.render();
  }

  /**
   * Record an edit and apply the style, but don't re-render the panel
   * @param property
   * @param newValue
   * @param el
   */
  private recordEdit(property: string, newValue: string, el: HTMLElement) {
    const original = this.originalSnapshot[property] ?? '';
    if (newValue === original) {
      this.editLog.delete(property);
    } else {
      const existing = this.editLog.get(property);
      const origVal = existing?.original ?? original;
      this.editLog.set(property, { original: origVal, current: newValue });
      const logEntry = `${property}: ${shortenValue(origVal)} → ${shortenValue(newValue)}`;
      const existingIdx = this.editLogStrings.findIndex((s) =>
        s.startsWith(`${property}:`),
      );
      if (existingIdx >= 0) {
        this.editLogStrings[existingIdx] = logEntry;
      } else {
        this.editLogStrings.push(logEntry);
      }
    }
    if (!property.startsWith('__')) {
      el.style.setProperty(property, newValue);
    }
  }

  /**
   * Record an edit, apply the style, and re-render the panel
   * @param property
   * @param newValue
   * @param el
   */
  applyEdit(property: string, newValue: string, el: HTMLElement) {
    this.recordEdit(property, newValue, el);
    this.render();
  }

  unmount() {
    this.destroyed = true;
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
    if (this.copyFeedbackTimer) {
      clearTimeout(this.copyFeedbackTimer);
      this.copyFeedbackTimer = null;
    }
    this.endDrag();
    this.relay.stopPolling();
    this.relay.onResponse(null);
    this.host?.remove();
    this.host = null;
    this.shadow = null;
    this.info = null;
    this.selectedEl = null;
  }

  /* ── Private ── */

  private getChangeset(): ChangesetEntry[] {
    return Array.from(this.editLog.entries()).map(
      ([property, { original, current }]) => ({ property, original, current }),
    );
  }

  /**
   * Cap the chat thread so a long session doesn't grow the DOM unboundedly.
   * @param msg
   */
  private pushChatMessage(msg: ChatMessage) {
    this.chatMessages.push(msg);
    if (this.chatMessages.length > MAX_CHAT_MESSAGES) {
      this.chatMessages.splice(0, this.chatMessages.length - MAX_CHAT_MESSAGES);
    }
  }

  private async checkHealth() {
    const prev = this.relayStatus;
    const status = await this.relay.checkHealth();
    if (this.destroyed) {
      return;
    }
    this.relayStatus = status;
    if (this.relayStatus !== prev) {
      // Skip the rebuild while the user is typing in the panel — a full
      // re-render would destroy the focused input mid-edit. The status dot
      // catches up on the next render.
      const active = this.shadow?.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        return;
      }
      this.render();
    }
  }

  private async sendToAgent(message: string) {
    if (!this.info) {
      return;
    }
    if (message) {
      this.pushChatMessage({ type: 'sent', text: message });
    }
    this.agentWorking = true;
    this.render();
    const prompt = formatAgentPrompt(this.info, this.getChangeset(), message);
    try {
      await this.relay.sendMessage(prompt);
    } catch {
      if (this.destroyed) {
        return;
      }
      this.agentWorking = false;
      this.pushChatMessage({
        type: 'status',
        text: 'Could not reach the relay — is the designer-mode server running?',
      });
      this.render();
    }
  }

  private getAllStyles(): Record<string, string> {
    if (!this.info) {
      return {};
    }
    const all: Record<string, string> = {};
    for (const group of Object.values(this.info.computedStyles)) {
      for (const [k, v] of Object.entries(group as Record<string, string>)) {
        all[k] = v;
      }
    }
    return all;
  }

  private getVal(prop: string): string {
    return this.editLog.get(prop)?.current ?? this.getAllStyles()[prop] ?? '';
  }

  private detectTokens(): string[] {
    if (!this.info) {
      return [];
    }
    const patterns = this.options.tokenPatterns ?? DEFAULT_TOKEN_PATTERNS;
    const tokens: string[] = [];
    for (const cls of this.info.classes) {
      for (const tp of patterns) {
        if (tp.pattern.test(cls)) {
          tokens.push(cls);
          break;
        }
      }
    }
    return tokens;
  }

  private getComponentPath(): string {
    if (!this.info?.domPath) {
      return '';
    }
    const parts = this.info.domPath.split(' > ');
    return parts.slice(-3).join(' › ');
  }

  /* ── Render ── */

  private render() {
    if (!this.shadow || this.destroyed) {
      return;
    }
    const old = this.shadow.querySelector('.panel');
    // `.body` is the scroll container (overflow-y: auto), not `.panel`.
    const prevScroll = old?.querySelector('.body')?.scrollTop ?? 0;
    if (old) {
      old.remove();
    }
    this.endDrag(); // the dragged panel node is gone; drop its listeners

    if (!this.isVisible) {
      return;
    }

    const panel = document.createElement('div');
    panel.className = `panel${this.isMinimized ? ' minimized' : ''} ${this.isLocked ? 'locked-mode' : 'hover-mode'}`;
    panel.style.cssText = `${this.anchor.h}:${this.anchor.x}px;${this.anchor.v}:${this.anchor.y}px;`;

    panel.appendChild(this.renderHeader());

    if (!this.isMinimized) {
      if (this.isLocked) {
        panel.appendChild(this.renderLockBar());
      }

      if (this.info) {
        panel.appendChild(this.renderElementHeader());
        panel.appendChild(this.renderBody());
        panel.appendChild(this.renderFooter());
      } else {
        panel.appendChild(this.renderEmptyState());
      }
    }

    this.shadow.appendChild(panel);
    if (prevScroll) {
      const newBody = panel.querySelector('.body');
      if (newBody) {
        newBody.scrollTop = prevScroll;
      }
    }
    this.setupDrag(panel);
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'header';

    const drag = document.createElement('span');
    drag.className = 'drag-handle';
    drag.textContent = '⠿';

    const title = document.createElement('span');
    title.className = 'header-title';
    title.textContent = 'Designer Mode';

    const actions = document.createElement('div');
    actions.className = 'header-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy for AI';
    copyBtn.onclick = () => {
      const { info } = this;
      if (!info) {
        return;
      }
      navigator.clipboard
        .writeText(formatForClipboard(info, this.getChangeset()))
        .then(() => {
          copyBtn.textContent = '✓ Copied';
          copyBtn.classList.add('copied');
          if (this.copyFeedbackTimer) {
            clearTimeout(this.copyFeedbackTimer);
          }
          this.copyFeedbackTimer = setTimeout(() => {
            this.copyFeedbackTimer = null;
            copyBtn.textContent = 'Copy for AI';
            copyBtn.classList.remove('copied');
          }, 2000);
        })
        .catch(() => {
          // Clipboard write can reject without focus; ignore in this dev tool.
        });
    };

    const minBtn = document.createElement('button');
    minBtn.className = 'icon-btn';
    minBtn.textContent = this.isMinimized ? '▢' : '▁';
    minBtn.onclick = () => {
      this.isMinimized = !this.isMinimized;
      this.render();
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'icon-btn';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => {
      this.options.onClose?.();
    };

    actions.appendChild(copyBtn);
    actions.appendChild(minBtn);
    actions.appendChild(closeBtn);

    header.appendChild(drag);
    header.appendChild(title);
    header.appendChild(actions);
    return header;
  }

  private renderLockBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'lock-bar';

    const txt = document.createElement('span');
    txt.textContent = '🔒 Selection locked';

    const unlockBtn = document.createElement('button');
    unlockBtn.className = 'unlock-btn';
    unlockBtn.textContent = 'Unlock';
    unlockBtn.onclick = () => {
      this.options.onUnlock?.();
    };

    bar.appendChild(txt);
    bar.appendChild(unlockBtn);
    return bar;
  }

  private renderEmptyState(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'empty-state';

    const icon = document.createElement('div');
    icon.textContent = '◎';
    icon.style.cssText = 'font-size:32px;margin-bottom:12px;opacity:0.4;';

    const primary = document.createElement('div');
    primary.textContent = 'Hover over any element';
    primary.style.cssText = 'font-size:12px;font-weight:500;margin-bottom:4px;';

    const secondary = document.createElement('div');
    secondary.textContent = 'Click to lock selection and edit values';
    secondary.style.cssText = 'font-size:11px;';

    div.appendChild(icon);
    div.appendChild(primary);
    div.appendChild(secondary);
    return div;
  }

  private renderElementHeader(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'el-header';

    const nameRow = document.createElement('div');
    nameRow.className = 'el-name';

    const name = document.createElement('span');
    name.textContent = this.info?.componentName ?? '—';
    nameRow.appendChild(name);

    if (this.info?.testId) {
      const pill = document.createElement('span');
      pill.className = 'test-id-pill';
      pill.textContent = this.info.testId;
      nameRow.appendChild(pill);
    }

    el.appendChild(nameRow);

    const path = this.getComponentPath();
    if (path) {
      const breadcrumb = document.createElement('div');
      breadcrumb.className = 'el-breadcrumb';
      breadcrumb.textContent = path;
      el.appendChild(breadcrumb);
    }

    if (this.info?.filePath) {
      const fp = document.createElement('div');
      fp.className = 'el-filepath';
      const parts = this.info.filePath.split('/');
      const short = parts.slice(-2).join('/');
      const full = `${this.info.filePath}${this.info.lineNumber ? `:${this.info.lineNumber}` : ''}`;
      fp.textContent = `${short}${this.info.lineNumber ? `:${this.info.lineNumber}` : ''}`;
      fp.title = full;
      el.appendChild(fp);
    }

    return el;
  }

  private renderBody(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'body';

    // Text content
    if (this.info && this.info.textContent !== null) {
      body.appendChild(this.renderTextSection());
    }

    // Layout
    body.appendChild(this.renderLayoutSection());

    // Spacing
    body.appendChild(this.renderSpacingSection());

    // Typography
    body.appendChild(this.renderTypographySection());

    // Fill & Stroke
    body.appendChild(this.renderFillStrokeSection());

    // Component
    body.appendChild(this.renderComponentSection());

    // Design Tokens
    const tokens = this.detectTokens();
    if (tokens.length > 0) {
      body.appendChild(this.renderTokensSection(tokens));
    }

    // Classes
    if (this.info?.classes.length) {
      body.appendChild(this.renderClassesSection());
    }

    return body;
  }

  /* ── Text Content ── */
  private renderTextSection(): HTMLElement {
    return this.buildSection('Text Content', '✏', true, (body) => {
      const ta = document.createElement('textarea');
      ta.className = 'text-input';
      // Show the edited value across re-renders, not the original snapshot.
      ta.value =
        this.editLog.get('__textContent')?.current ??
        this.info?.textContent ??
        '';
      ta.rows = 2;
      ta.oninput = () => {
        if (this.selectedEl) {
          this.recordEdit('__textContent', ta.value, this.selectedEl);
          // Reflect the edit in the DOM: put the new text in the first text
          // node and blank the rest, so the element's direct text matches the
          // input even when it was split across several text nodes.
          const textNodes = Array.from(this.selectedEl.childNodes).filter(
            (n) => n.nodeType === Node.TEXT_NODE,
          );
          if (textNodes.length > 0) {
            textNodes[0].textContent = ta.value;
            for (const node of textNodes.slice(1)) {
              node.textContent = '';
            }
          }
        }
      };
      body.appendChild(ta);
    });
  }

  /* ── Layout ── */
  private renderLayoutSection(): HTMLElement {
    return this.buildSection('Layout', '⊞', true, (body) => {
      const styles = this.getAllStyles();
      const grid = document.createElement('div');
      grid.className = 'two-col';

      const layoutProps: [string, string][] = [
        ['Display', 'display'],
        ['Position', 'position'],
        ['W', 'width'],
        ['H', 'height'],
      ];
      for (const [label, prop] of layoutProps) {
        grid.appendChild(this.makePropRow(label, prop, this.getVal(prop)));
      }
      body.appendChild(grid);

      // Flex props: only show when flex-direction exists
      const fd = findStyleValue(styles, 'flex-direction');
      if (fd) {
        const flexGrid = document.createElement('div');
        flexGrid.className = 'two-col';
        flexGrid.style.marginTop = '6px';

        const flexProps: [string, string][] = [
          ['Direction', 'flex-direction'],
          ['Align', 'align-items'],
          ['Justify', 'justify-content'],
          ['Gap', 'gap'],
        ];
        for (const [label, prop] of flexProps) {
          flexGrid.appendChild(
            this.makePropRow(label, prop, this.getVal(prop)),
          );
        }
        body.appendChild(flexGrid);
      }

      // Overflow
      const ov = this.getVal('overflow');
      if (ov && ov !== 'visible') {
        body.appendChild(this.makePropRowFull('Overflow', 'overflow', ov));
      }
    });
  }

  /* ── Spacing ── */
  private renderSpacingSection(): HTMLElement {
    return this.buildSection('Spacing', '⬜', true, (body) => {
      // Margin
      body.appendChild(
        this.buildSpacingCross('Margin', C.accent, C.accentDim, [
          'margin-top',
          'margin-right',
          'margin-bottom',
          'margin-left',
        ]),
      );

      // Padding
      body.appendChild(
        this.buildSpacingCross(
          'Padding',
          C.success,
          'rgba(48, 209, 88, 0.15)',
          ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
        ),
      );
    });
  }

  private buildSpacingCross(
    label: string,
    color: string,
    bgColor: string,
    props: [string, string, string, string],
  ): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'spacing-editor';
    wrap.style.marginBottom = '8px';

    const lbl = document.createElement('div');
    lbl.className = 'spacing-label';
    lbl.style.color = color;
    lbl.textContent = label;
    wrap.appendChild(lbl);

    const crossWrap = document.createElement('div');
    crossWrap.className = 'spacing-cross-wrap';

    const makeInput = (idx: number) => {
      const input = document.createElement('input');
      input.className = 'mini-input';
      input.value = shortenValue(this.getVal(props[idx])) || '0';
      input.style.color = color;
      this.setupMiniInput(input, props[idx], color);
      return input;
    };

    // Top
    crossWrap.appendChild(makeInput(0));

    // Middle row: left - center - right
    const midRow = document.createElement('div');
    midRow.className = 'spacing-mid-row';
    midRow.appendChild(makeInput(3)); // left
    const center = document.createElement('div');
    center.className = 'sc-center';
    center.style.background = bgColor;
    center.style.opacity = '0.15';
    center.style.backgroundColor = color;
    midRow.appendChild(center);
    midRow.appendChild(makeInput(1)); // right
    crossWrap.appendChild(midRow);

    // Bottom
    crossWrap.appendChild(makeInput(2));

    wrap.appendChild(crossWrap);
    return wrap;
  }

  private setupMiniInput(
    input: HTMLInputElement,
    prop: string,
    _color: string,
  ) {
    let startValue = '';
    input.onfocus = () => {
      startValue = input.value;
      input.select();
    };
    input.onblur = () => {
      if (this.selectedEl && input.value !== startValue) {
        const val = input.value.trim();
        const withUnit = /^\d+$/u.test(val) ? `${val}px` : val;
        this.applyEdit(prop, withUnit, this.selectedEl);
      }
    };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        input.blur();
        return;
      }
      if (e.key === 'Escape') {
        input.value = shortenValue(this.getVal(prop)) || '0';
        input.blur();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const delta = e.key === 'ArrowUp' ? step : -step;
        const num = parseFloat(input.value) || 0;
        input.value = String(num + delta);
        if (this.selectedEl) {
          this.recordEdit(prop, `${input.value}px`, this.selectedEl);
        }
      }
    };
  }

  /* ── Typography ── */
  private renderTypographySection(): HTMLElement {
    return this.buildSection('Typography', 'T', true, (body) => {
      // Font (full width)
      body.appendChild(
        this.makePropRowFull('Font', 'font-family', this.getVal('font-family')),
      );

      const grid = document.createElement('div');
      grid.className = 'two-col';

      const typoProps: [string, string][] = [
        ['Size', 'font-size'],
        ['Weight', 'font-weight'],
        ['Line H.', 'line-height'],
        ['Align', 'text-align'],
      ];
      for (const [label, prop] of typoProps) {
        grid.appendChild(this.makePropRow(label, prop, this.getVal(prop)));
      }
      body.appendChild(grid);

      // Color with picker
      const colorVal = this.getVal('color');
      if (colorVal) {
        body.appendChild(this.makeColorRow('Color', 'color', colorVal));
      }
    });
  }

  /* ── Fill & Stroke ── */
  private renderFillStrokeSection(): HTMLElement {
    return this.buildSection('Fill & Stroke', '◉', false, (body) => {
      // Background with color
      const bgVal =
        this.getVal('background-color') || this.getVal('background');
      if (bgVal && bgVal !== 'rgba(0, 0, 0, 0)') {
        body.appendChild(
          this.makeColorRow('Background', 'background-color', bgVal),
        );
      }

      // Opacity
      const op = this.getVal('opacity');
      if (op && op !== '1') {
        body.appendChild(this.makePropRowFull('Opacity', 'opacity', op));
      }

      // Border — edit the `border` shorthand: the displayed value is composite
      // ("1px solid rgb(…)"), which would be invalid if written to border-width.
      const bw = this.getVal('border-width');
      const bs = this.getVal('border-style');
      const bc = this.getVal('border-color');
      if (bw && bw !== '0px') {
        body.appendChild(
          this.makePropRowFull(
            'Border',
            'border',
            this.getVal('border') || `${bw} ${bs} ${bc}`,
          ),
        );
      }

      // Radius
      const br = this.getVal('border-radius');
      if (br && br !== '0px') {
        body.appendChild(this.makePropRowFull('Radius', 'border-radius', br));
      }

      // Shadow
      const shadow = this.getVal('box-shadow');
      if (shadow && shadow !== 'none') {
        body.appendChild(this.makePropRowFull('Shadow', 'box-shadow', shadow));
      }
    });
  }

  /* ── Component ── */
  private renderComponentSection(): HTMLElement {
    return this.buildSection('Component', '⚛', false, (body) => {
      const { info } = this;
      if (!info) {
        return;
      }
      const fields: [string, string][] = [
        ['Name', info.componentName],
        ['Test ID', info.testId ?? '—'],
        [
          'File',
          info.filePath
            ? `${info.filePath.split('/').slice(-2).join('/')}${info.lineNumber ? `:${info.lineNumber}` : ''}`
            : '—',
        ],
      ];

      for (const [label, val] of fields) {
        const row = document.createElement('div');
        row.className = 'prop-row';
        const l = document.createElement('span');
        l.className = 'prop-label';
        l.textContent = label;
        const v = document.createElement('span');
        v.className = 'readonly';
        v.textContent = val;
        if (label === 'File' && info.filePath) {
          v.title = `${info.filePath}${info.lineNumber ? `:${info.lineNumber}` : ''}`;
        }
        row.appendChild(l);
        row.appendChild(v);
        body.appendChild(row);
      }

      // DOM Path (unique feature)
      if (info.domPath) {
        const row = document.createElement('div');
        row.className = 'prop-row';
        const l = document.createElement('span');
        l.className = 'prop-label';
        l.textContent = 'DOM Path';
        const v = document.createElement('span');
        v.className = 'readonly';
        v.style.cssText = `font-size:9px;color:${C.textTertiary};word-break:break-all;`;
        v.textContent = info.domPath;
        row.appendChild(l);
        row.appendChild(v);
        body.appendChild(row);
      }

      // Props JSON (unique feature)
      if (info.props && Object.keys(info.props).length > 0) {
        const pre = document.createElement('pre');
        pre.className = 'props-pre';
        pre.textContent = JSON.stringify(info.props, null, 2);
        body.appendChild(pre);
      }
    });
  }

  /**
   * Add or remove a class on the selected element, keeping `info.classes` and
   * the changeset in sync — otherwise class edits would mutate the page but be
   * invisible in the pending-edits banner and the agent prompt.
   * @param action
   * @param cls
   */
  private applyClassEdit(action: 'add' | 'remove', cls: string) {
    if (!this.selectedEl) {
      return;
    }
    this.selectedEl.classList[action](cls);
    if (this.info) {
      this.info.classes = Array.from(this.selectedEl.classList);
    }
    this.recordEdit(
      '__classes',
      Array.from(this.selectedEl.classList).join(' '),
      this.selectedEl,
    );
    this.render();
  }

  /* ── Design Tokens ── */
  private renderTokensSection(tokens: string[]): HTMLElement {
    return this.buildSection('Design Tokens', '◆', false, (body) => {
      this.buildEditablePillList(body, tokens, {
        onRemove: (token) => this.applyClassEdit('remove', token),
        onAdd: (token) => this.applyClassEdit('add', token),
      });
    });
  }

  /* ── Classes ── */
  private renderClassesSection(): HTMLElement {
    return this.buildSection('Classes', '{ }', false, (body) => {
      const classes = this.info?.classes ?? [];
      this.buildEditablePillList(body, classes, {
        onRemove: (cls) => this.applyClassEdit('remove', cls),
        onAdd: (cls) => this.applyClassEdit('add', cls),
      });
    });
  }

  /* ── Editable Pill List ── */
  private buildEditablePillList(
    container: HTMLElement,
    items: string[],
    opts: { onRemove: (item: string) => void; onAdd: (item: string) => void },
  ) {
    const list = document.createElement('div');
    list.className = 'pill-list';

    for (const item of items) {
      const pill = document.createElement('span');
      pill.className = 'pill';
      const txt = document.createElement('span');
      txt.textContent = item;
      txt.style.cssText =
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      const x = document.createElement('span');
      x.className = 'pill-x';
      x.textContent = '×';
      x.onclick = (e) => {
        e.stopPropagation();
        opts.onRemove(item);
      };
      pill.appendChild(txt);
      pill.appendChild(x);
      list.appendChild(pill);
    }
    container.appendChild(list);

    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';
    addBtn.textContent = '+ Add';
    addBtn.onclick = () => {
      addBtn.style.display = 'none';
      const input = document.createElement('input');
      input.className = 'add-input';
      input.placeholder = 'Type and press Enter';
      container.appendChild(input);
      input.focus();
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const val = input.value.trim();
          if (val) {
            opts.onAdd(val);
          }
          input.remove();
          addBtn.style.display = '';
        }
        if (e.key === 'Escape') {
          input.remove();
          addBtn.style.display = '';
        }
      };
      input.onblur = () => {
        input.remove();
        addBtn.style.display = '';
      };
    };
    container.appendChild(addBtn);
  }

  /* ── Footer (Chat) ── */
  private renderFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'footer';

    // Top bar: status + component pill
    const topBar = document.createElement('div');
    topBar.className = 'footer-top';

    const dot = document.createElement('span');
    dot.className = `status-dot ${this.relayStatus}`;

    const statusLabel = document.createElement('span');
    statusLabel.style.cssText = `font-size:10px;color:${this.relayStatus === 'connected' ? C.success : C.textTertiary};`;
    statusLabel.textContent =
      this.relayStatus === 'connected' ? 'Connected' : 'Not connected';

    const compPill = document.createElement('span');
    compPill.className = 'component-pill';
    compPill.textContent = this.info?.componentName ?? 'No selection';

    topBar.appendChild(dot);
    topBar.appendChild(statusLabel);
    topBar.appendChild(compPill);
    footer.appendChild(topBar);

    // Pending edits banner
    if (this.editLog.size > 0) {
      const banner = document.createElement('div');
      banner.className = 'edits-banner';

      const txt = document.createElement('span');
      txt.className = 'edits-banner-text';
      const editNames = this.editLogStrings.slice(0, 2).join(', ');
      const more =
        this.editLog.size > 2 ? ` +${this.editLog.size - 2} more` : '';
      txt.textContent = `${this.editLog.size} pending edit${this.editLog.size > 1 ? 's' : ''}: ${editNames}${more}`;

      const applyBtn = document.createElement('button');
      applyBtn.className = 'apply-btn';
      applyBtn.textContent = 'Apply';
      applyBtn.onclick = () => this.sendToAgent('');

      banner.appendChild(txt);
      banner.appendChild(applyBtn);
      footer.appendChild(banner);
    }

    // Message thread
    if (this.chatMessages.length > 0) {
      const thread = document.createElement('div');
      thread.className = 'message-thread';
      for (const msg of this.chatMessages) {
        const bubble = document.createElement('div');
        bubble.className = `msg-${msg.type}`;
        bubble.textContent = msg.text;
        thread.appendChild(bubble);
      }
      footer.appendChild(thread);
      // Auto-scroll
      requestAnimationFrame(() => {
        thread.scrollTop = thread.scrollHeight;
      });
    }

    // Agent working indicator
    if (this.agentWorking) {
      const working = document.createElement('div');
      working.className = 'agent-working';
      const orb = document.createElement('span');
      orb.className = 'pulse-orb';
      const txt = document.createElement('span');
      txt.textContent = 'Check your agent for progress and approvals';
      working.appendChild(orb);
      working.appendChild(txt);
      footer.appendChild(working);
    }

    // Composer
    const composer = document.createElement('div');
    composer.className = 'composer';

    const composerWrap = document.createElement('div');
    composerWrap.className = 'composer-wrap';

    const input = document.createElement('textarea');
    input.className = 'chat-input';
    input.placeholder = 'Describe the change...';
    input.rows = 3;

    const sendBtn = document.createElement('button');
    sendBtn.className = 'send-btn';
    sendBtn.textContent = '↑';
    sendBtn.disabled = this.relayStatus !== 'connected';

    const send = () => {
      const msg = input.value.trim();
      if (!msg && this.editLog.size === 0) {
        return;
      }
      this.sendToAgent(msg);
      input.value = '';
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    };
    sendBtn.onclick = send;

    composerWrap.appendChild(input);
    composerWrap.appendChild(sendBtn);
    composer.appendChild(composerWrap);
    footer.appendChild(composer);

    return footer;
  }

  /* ── Section builder ── */
  private buildSection(
    title: string,
    icon: string,
    defaultOpen: boolean,
    content: (body: HTMLElement) => void,
  ): HTMLElement {
    const section = document.createElement('div');
    section.className = 'section';

    const header = document.createElement('button');
    header.className = 'section-header';

    const iconEl = document.createElement('span');
    iconEl.className = 'section-icon';
    iconEl.textContent = icon;

    const label = document.createElement('span');
    label.textContent = title;

    const isOpen = this.sectionStates.get(title) ?? defaultOpen;

    const chevron = document.createElement('span');
    chevron.className = `chevron${isOpen ? ' open' : ''}`;
    chevron.textContent = '▶';

    header.appendChild(iconEl);
    header.appendChild(label);
    header.appendChild(chevron);

    const body = document.createElement('div');
    body.className = 'section-body';
    body.style.display = isOpen ? 'block' : 'none';
    content(body);

    header.onclick = () => {
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      chevron.className = `chevron${open ? '' : ' open'}`;
      this.sectionStates.set(title, !open);
    };

    section.appendChild(header);
    section.appendChild(body);
    return section;
  }

  /* ── Prop row helpers ── */
  private makePropRow(label: string, prop: string, value: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('span');
    l.className = 'prop-label';
    l.textContent = label;
    const v = document.createElement('div');
    v.className = 'prop-value';
    v.appendChild(this.makeEditableValue(prop, value));
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }

  private makePropRowFull(
    label: string,
    prop: string,
    value: string,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('span');
    l.className = 'prop-label';
    l.textContent = label;
    const v = document.createElement('div');
    v.className = 'prop-value';
    v.appendChild(this.makeEditableValue(prop, value));
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }

  private makeColorRow(
    label: string,
    prop: string,
    value: string,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'prop-row';
    const l = document.createElement('span');
    l.className = 'prop-label';
    l.textContent = label;
    const v = document.createElement('div');
    v.className = 'prop-value';
    v.appendChild(this.makeEditableValue(prop, value, true));
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }

  private makeEditableValue(
    prop: string,
    value: string,
    isColor = false,
  ): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'editable';

    if (isColor && value && value !== 'rgba(0, 0, 0, 0)') {
      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      swatch.style.background = value;

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'color-input';
      colorInput.value = toHexColor(value);
      colorInput.oninput = () => {
        swatch.style.background = colorInput.value;
        if (this.selectedEl) {
          this.recordEdit(prop, colorInput.value, this.selectedEl);
        }
      };

      swatch.onclick = (e) => {
        e.stopPropagation();
        colorInput.click();
      };
      wrap.appendChild(swatch);
      wrap.appendChild(colorInput);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = shortenValue(value) || '—';
    textSpan.style.cssText =
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    wrap.appendChild(textSpan);

    wrap.onclick = () => {
      const input = document.createElement('input');
      input.className = 'edit-input';
      input.value = value;
      wrap.replaceWith(input);
      input.focus();
      input.select();

      const original = value;
      const isNumeric = /^-?\d*\.?\d+(px|em|rem|%|vh|vw|pt)?$/u.test(
        value.trim(),
      );

      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          input.blur();
          return;
        }
        if (e.key === 'Escape') {
          input.value = original;
          input.blur();
          return;
        }
        if (isNumeric && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const delta = e.key === 'ArrowUp' ? step : -step;
          const m = input.value.match(/^(-?\d*\.?\d+)(.*)/u);
          if (m) {
            input.value = `${parseFloat(m[1]) + delta}${m[2]}`;
            if (this.selectedEl) {
              this.recordEdit(prop, input.value, this.selectedEl);
            }
          }
        }
      };
      // Live apply on keystrokes
      input.oninput = () => {
        if (this.selectedEl) {
          this.recordEdit(prop, input.value, this.selectedEl);
        }
      };
      input.onblur = () => {
        const newVal = input.value;
        const newWrap = this.makeEditableValue(prop, newVal, isColor);
        input.replaceWith(newWrap);
        if (this.selectedEl && newVal !== original) {
          this.applyEdit(prop, newVal, this.selectedEl);
        }
      };
    };

    return wrap;
  }

  /* ── Drag ── */

  /**
   * Header-drag for the panel. Document-level mousemove/mouseup listeners are
   * attached only for the duration of a drag (mousedown → mouseup) — attaching
   * them unconditionally here would leak a pair per render() call, since render
   * replaces the panel node but document listeners survive it.
   * @param panel
   */
  private setupDrag(panel: HTMLElement) {
    const header = panel.querySelector('.header');
    if (!(header instanceof HTMLElement)) {
      return;
    }
    header.onmousedown = (e) => {
      if ((e.target as HTMLElement).closest('button')) {
        return;
      }
      e.preventDefault();
      let startX = e.clientX;
      let startY = e.clientY;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const dirX = this.anchor.h === 'right' ? -1 : 1;
        const dirY = this.anchor.v === 'bottom' ? -1 : 1;
        this.anchor.x = Math.max(
          0,
          Math.min(window.innerWidth - 340, this.anchor.x + dx * dirX),
        );
        this.anchor.y = Math.max(
          0,
          Math.min(window.innerHeight - 100, this.anchor.y + dy * dirY),
        );
        panel.style[this.anchor.h] = `${this.anchor.x}px`;
        panel.style[this.anchor.v] = `${this.anchor.y}px`;
        startX = ev.clientX;
        startY = ev.clientY;
      };
      const onUp = () => this.endDrag();

      this.endDrag(); // defensive: never stack two active drags
      this.activeDragCleanup = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
  }

  /** Remove the document-level listeners of an in-progress drag, if any. */
  private endDrag() {
    this.activeDragCleanup?.();
    this.activeDragCleanup = null;
  }
}
