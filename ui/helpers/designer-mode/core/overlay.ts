import type { InspectorAdapter, ComponentInfo } from './types';

const IGNORED_SELECTORS = [
  '[data-designer-mode]',
  '.dm-overlay',
  '.dm-panel',
  '.dm-highlight',
  '.dm-toggle',
];

export class OverlayController {
  private adapter: InspectorAdapter;

  private isActive = false;

  private isLocked = false;

  private hoveredEl: HTMLElement | null = null;

  private selectedEl: HTMLElement | null = null;

  private highlight: HTMLDivElement | null = null;

  private tooltip: HTMLDivElement | null = null;

  private onSelect:
    | ((info: ComponentInfo | null, el: HTMLElement | null) => void)
    | null = null;

  private onHover:
    | ((info: ComponentInfo | null, el: HTMLElement | null) => void)
    | null = null;

  private boundMouseMove: (e: MouseEvent) => void;

  private boundClick: (e: MouseEvent) => void;

  private boundKeyDown: (e: KeyboardEvent) => void;

  private boundMouseLeave: () => void;

  constructor(adapter: InspectorAdapter) {
    this.adapter = adapter;
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundMouseLeave = this.handleMouseLeave.bind(this);
  }

  mount(container: HTMLElement) {
    this.highlight = document.createElement('div');
    this.highlight.className = 'dm-highlight';
    Object.assign(this.highlight.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '2147483640',
      border: '2px dashed rgb(3, 125, 214)',
      borderRadius: '4px',
      display: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.1s ease-out',
    });

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'dm-tooltip';
    Object.assign(this.tooltip.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '2147483641',
      background: 'rgb(3, 125, 214)',
      color: 'rgb(255, 255, 255)',
      fontSize: '11px',
      fontFamily: 'monospace',
      padding: '2px 6px',
      borderRadius: '3px',
      display: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      maxWidth: '400px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });

    container.appendChild(this.highlight);
    container.appendChild(this.tooltip);
  }

  activate() {
    this.isActive = true;
    this.adapter.onActivate();
    document.addEventListener('mousemove', this.boundMouseMove, true);
    document.addEventListener('click', this.boundClick, true);
    document.addEventListener('keydown', this.boundKeyDown, true);
    document.addEventListener('mouseleave', this.boundMouseLeave);
  }

  deactivate() {
    this.isActive = false;
    this.isLocked = false;
    this.adapter.onDeactivate();
    document.removeEventListener('mousemove', this.boundMouseMove, true);
    document.removeEventListener('click', this.boundClick, true);
    document.removeEventListener('keydown', this.boundKeyDown, true);
    document.removeEventListener('mouseleave', this.boundMouseLeave);
    if (this.highlight) {
      this.highlight.style.display = 'none';
    }
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  setOnSelect(
    cb: (info: ComponentInfo | null, el: HTMLElement | null) => void,
  ) {
    this.onSelect = cb;
  }

  setOnHover(cb: (info: ComponentInfo | null, el: HTMLElement | null) => void) {
    this.onHover = cb;
  }

  getHoveredElement(): HTMLElement | null {
    return this.hoveredEl;
  }

  private shouldIgnore(el: HTMLElement): boolean {
    return IGNORED_SELECTORS.some((s) => el.closest(s) !== null);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isActive || this.isLocked) {
      return;
    }
    const el = e.target as HTMLElement;
    if (this.shouldIgnore(el)) {
      return;
    }
    this.hoveredEl = el;
    this.showHighlight(el, false);
    const info = this.adapter.getComponentInfo(el);
    this.onHover?.(info, el);
    if (this.tooltip && info) {
      const rect = el.getBoundingClientRect();
      this.tooltip.textContent = `${info.componentName}${info.testId ? ` [${info.testId}]` : ''}`;
      this.tooltip.style.display = 'block';
      this.tooltip.style.top = `${rect.top - 28}px`;
      this.tooltip.style.left = `${rect.left}px`;
    }
  }

  private handleMouseLeave() {
    if (!this.isActive || this.isLocked) {
      return;
    }
    this.hoveredEl = null;
    if (this.highlight) {
      this.highlight.style.display = 'none';
    }
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
    this.onHover?.(null, null);
  }

  private handleClick(e: MouseEvent) {
    if (!this.isActive) {
      return;
    }
    const el = e.target as HTMLElement;
    if (this.shouldIgnore(el)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (this.isLocked && this.selectedEl === el) {
      this.unlock();
    } else {
      this.isLocked = true;
      this.selectedEl = el;
      this.showHighlight(el, true);
      const info = this.adapter.getComponentInfo(el);
      if (this.tooltip && info) {
        const rect = el.getBoundingClientRect();
        this.tooltip.textContent = `${info.componentName}${info.testId ? ` [${info.testId}]` : ''} (locked - press C to copy, Esc to unlock)`;
        this.tooltip.style.display = 'block';
        this.tooltip.style.top = `${rect.top - 28}px`;
        this.tooltip.style.left = `${rect.left}px`;
      }
      if (info) {
        this.onSelect?.(info, el);
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Don't hijack keystrokes while the user is typing — e.g. `c` or Escape in
    // the panel's message box (the event target is the shadow host, which
    // shouldIgnore matches) or in any page input.
    const target = e.target as HTMLElement;
    if (
      this.shouldIgnore(target) ||
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable
    ) {
      return;
    }
    if (e.key === 'Escape') {
      this.unlock();
    }
    if (e.key === 'c' || e.key === 'C') {
      const el = this.selectedEl || this.hoveredEl;
      if (el) {
        const info = this.adapter.getComponentInfo(el);
        if (info) {
          navigator.clipboard
            .writeText(JSON.stringify(info, null, 2))
            .catch(() => {
              // Clipboard write can reject without focus; ignore in this dev tool.
            });
        }
      }
    }
  }

  unlock() {
    this.isLocked = false;
    this.selectedEl = null;
    if (this.highlight) {
      this.highlight.style.display = 'none';
    }
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
    this.onSelect?.(null, null);
  }

  private showHighlight(el: HTMLElement, locked: boolean) {
    if (!this.highlight) {
      return;
    }
    const rect = el.getBoundingClientRect();
    Object.assign(this.highlight.style, {
      display: 'block',
      top: `${rect.top - 2}px`,
      left: `${rect.left - 2}px`,
      width: `${rect.width + 4}px`,
      height: `${rect.height + 4}px`,
      border: `2px ${locked ? 'solid' : 'dashed'} rgb(3, 125, 214)`,
      background: locked ? 'rgba(3, 125, 214, 0.1)' : 'rgba(3, 125, 214, 0.05)',
    });
  }
}
