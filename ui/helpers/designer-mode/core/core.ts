import type {
  InspectorAdapter,
  DesignerModeOptions,
  ComponentInfo,
} from './types';
import { OverlayController } from './overlay';
import { PanelController } from './panel';
import { ToggleController } from './toggle';
import { RelayClient } from './relay';
import { createAdapter } from './detect';

export class DesignerModeCore {
  private adapter: InspectorAdapter;

  private options: DesignerModeOptions;

  private relay: RelayClient;

  private overlay: OverlayController;

  private panel: PanelController;

  private toggleCtrl: ToggleController | null = null;

  private host: HTMLElement | null = null;

  private isActive = false;

  private selectedEl: HTMLElement | null = null;

  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(options: DesignerModeOptions & { adapter: InspectorAdapter }) {
    this.adapter = options.adapter;
    this.options = options;
    this.relay = new RelayClient(options.relayUrl);
    this.overlay = new OverlayController(this.adapter);
    this.panel = new PanelController(this.relay, {
      onClose: () => this.setActive(false),
      onUnlock: () => {
        this.overlay.unlock();
        this.selectedEl = null;
        this.panel.showCompact();
      },
    });
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  mount() {
    if (this.host) {
      return;
    }
    this.host = document.createElement('div');
    this.host.setAttribute('data-designer-mode', 'root');
    document.body.appendChild(this.host);

    this.overlay.mount(this.host);
    this.panel.mount(this.host);

    if (this.options.defaultActive !== false) {
      // show toggle button
      this.toggleCtrl = new ToggleController();
      this.toggleCtrl.setOnToggle(() => this.setActive(!this.isActive));
      this.toggleCtrl.mount(this.host);
    }

    this.overlay.setOnSelect((info, el) => {
      if (!info || !el) {
        this.selectedEl = null;
        // Selection cleared (Escape / clicking the locked element again) while
        // inspector mode is still active: drop back to the compact panel, same
        // as the header Unlock button. hide() would leave the overlay capturing
        // clicks with no visible UI until the next Ctrl+Shift+D.
        if (this.isActive) {
          this.panel.showCompact();
        } else {
          this.panel.hide();
        }
        return;
      }
      this.selectedEl = el;
      this.panel.show(info, el);
    });

    this.overlay.setOnHover((info, el) => {
      if (!info || !el) {
        this.panel.hideHover();
        return;
      }
      this.panel.showHover(info, el);
    });

    document.addEventListener('keydown', this.boundKeyDown, true);

    if (this.options.persistState) {
      const saved = localStorage.getItem('designer-mode-active');
      if (saved === 'true') {
        this.setActive(true);
      }
    }
  }

  unmount() {
    this.overlay.deactivate();
    this.panel.unmount();
    this.toggleCtrl?.unmount();
    this.host?.remove();
    this.host = null;
    document.removeEventListener('keydown', this.boundKeyDown, true);
  }

  toggle() {
    this.setActive(!this.isActive);
  }

  setActive(active: boolean) {
    this.isActive = active;
    if (active) {
      this.overlay.activate();
      if (this.toggleCtrl) {
        const tp = this.toggleCtrl.getPosition();
        this.panel.setPosition(tp.right, tp.bottom);
      }
      this.panel.showCompact();
    } else {
      this.overlay.deactivate();
      this.panel.hide();
    }
    this.toggleCtrl?.setActive(active);
    if (this.options.persistState) {
      localStorage.setItem('designer-mode-active', String(active));
    }
  }

  isMounted() {
    return Boolean(this.host?.isConnected);
  }

  private handleKeyDown(e: KeyboardEvent) {
    const modifier = e.ctrlKey || e.metaKey;
    if (modifier && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      this.toggle();
    }
  }

  static async autoInit(options: DesignerModeOptions = {}) {
    const adapter = createAdapter();
    const core = new DesignerModeCore({ ...options, adapter });
    core.mount();
    return core;
  }
}
