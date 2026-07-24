import { DesignerModeCore } from './core';
import type { ComponentInfo, InspectorAdapter } from './types';

const EMPTY_STYLES = {
  layout: {},
  typography: {},
  color: {},
  spacing: {},
  border: {},
  effects: {},
};

function makeInfo(componentName: string): ComponentInfo {
  return {
    componentName,
    filePath: null,
    lineNumber: null,
    props: null,
    testId: null,
    classes: [],
    computedStyles: EMPTY_STYLES,
    layoutRect: {
      top: 0,
      left: 0,
      width: 100,
      height: 40,
      right: 100,
      bottom: 40,
      x: 0,
      y: 0,
    } as unknown as DOMRectReadOnly,
    textContent: null,
  };
}

function shortcut(): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key: 'D',
    ctrlKey: true,
    shiftKey: true,
    bubbles: true,
    cancelable: true,
  });
}

describe('DesignerModeCore', () => {
  let adapter: {
    getComponentInfo: jest.Mock;
    onActivate: jest.Mock;
    onDeactivate: jest.Mock;
  };
  let core: DesignerModeCore | null;

  const getHost = () =>
    document.body.querySelector('[data-designer-mode="root"]');
  const getPanelShadow = () =>
    (document.body.querySelector('.dm-panel') as HTMLElement | null)
      ?.shadowRoot ?? null;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('relay offline'));
    adapter = {
      getComponentInfo: jest.fn(() => makeInfo('MyComponent')),
      onActivate: jest.fn(),
      onDeactivate: jest.fn(),
    };
    core = null;
  });

  afterEach(() => {
    core?.unmount();
    localStorage.clear();
  });

  const createCore = (
    options: Record<string, unknown> = {},
  ): DesignerModeCore => {
    core = new DesignerModeCore({
      ...options,
      adapter: adapter as InspectorAdapter,
    });
    return core;
  };

  describe('mount', () => {
    it('appends a designer-mode host with the toggle button to the body', () => {
      createCore().mount();

      const host = getHost();
      expect(host).not.toBeNull();
      expect(host?.querySelector('.dm-toggle')).not.toBeNull();
      expect(core?.isMounted()).toBe(true);
    });

    it('is a no-op when called twice', () => {
      const instance = createCore();
      instance.mount();
      instance.mount();

      expect(
        document.body.querySelectorAll('[data-designer-mode="root"]'),
      ).toHaveLength(1);
    });

    it('skips the toggle button when defaultActive is false', () => {
      createCore({ defaultActive: false }).mount();

      expect(getHost()?.querySelector('.dm-toggle')).toBeNull();
    });
  });

  describe('setActive / toggle', () => {
    it('activates the overlay and shows the compact panel', () => {
      const instance = createCore();
      instance.mount();

      instance.setActive(true);

      expect(adapter.onActivate).toHaveBeenCalled();
      const shadow = getPanelShadow();
      expect(shadow?.querySelector('.panel')).not.toBeNull();
      expect(shadow?.querySelector('.empty-state')).not.toBeNull();
    });

    it('deactivates the overlay and hides the panel', () => {
      const instance = createCore();
      instance.mount();
      instance.setActive(true);

      instance.setActive(false);

      expect(adapter.onDeactivate).toHaveBeenCalled();
      expect(getPanelShadow()?.querySelector('.panel')).toBeNull();
    });

    it('toggle() flips the active state', () => {
      const instance = createCore();
      instance.mount();

      instance.toggle();
      expect(adapter.onActivate).toHaveBeenCalledTimes(1);

      instance.toggle();
      expect(adapter.onDeactivate).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcut', () => {
    it('toggles on Ctrl+Shift+D', () => {
      createCore().mount();

      document.body.dispatchEvent(shortcut());

      expect(adapter.onActivate).toHaveBeenCalledTimes(1);
    });

    it('toggles on Cmd+Shift+D', () => {
      createCore().mount();

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'D',
          metaKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(adapter.onActivate).toHaveBeenCalledTimes(1);
    });

    it('ignores other key combinations', () => {
      createCore().mount();

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'D',
          ctrlKey: true,
          bubbles: true,
        }),
      );
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'K',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );

      expect(adapter.onActivate).not.toHaveBeenCalled();
    });
  });

  describe('persistState', () => {
    it('saves the active state to localStorage', () => {
      const instance = createCore({ persistState: true });
      instance.mount();

      instance.setActive(true);
      expect(localStorage.getItem('designer-mode-active')).toBe('true');

      instance.setActive(false);
      expect(localStorage.getItem('designer-mode-active')).toBe('false');
    });

    it('restores the active state on mount', () => {
      localStorage.setItem('designer-mode-active', 'true');

      createCore({ persistState: true }).mount();

      expect(adapter.onActivate).toHaveBeenCalled();
    });

    it('does not touch localStorage without the option', () => {
      const instance = createCore();
      instance.mount();

      instance.setActive(true);

      expect(localStorage.getItem('designer-mode-active')).toBeNull();
    });
  });

  describe('selection flow', () => {
    it('shows the locked panel when an element is selected', () => {
      const instance = createCore();
      instance.mount();
      instance.setActive(true);
      const pageEl = document.createElement('div');
      document.body.appendChild(pageEl);

      pageEl.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );

      const shadow = getPanelShadow();
      expect(shadow?.querySelector('.panel.locked-mode')).not.toBeNull();
      expect(shadow?.querySelector('.el-name')?.textContent).toContain(
        'MyComponent',
      );
    });

    it('drops back to the compact panel when the selection is cleared while active', () => {
      const instance = createCore();
      instance.mount();
      instance.setActive(true);
      const pageEl = document.createElement('div');
      document.body.appendChild(pageEl);
      pageEl.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );

      const shadow = getPanelShadow();
      expect(shadow?.querySelector('.panel')).not.toBeNull();
      expect(shadow?.querySelector('.empty-state')).not.toBeNull();
    });

    it('unlocks back to the compact panel via the panel Unlock button', () => {
      const instance = createCore();
      instance.mount();
      instance.setActive(true);
      const pageEl = document.createElement('div');
      document.body.appendChild(pageEl);
      pageEl.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );

      const unlockBtn = getPanelShadow()?.querySelector(
        '.unlock-btn',
      ) as HTMLButtonElement;
      unlockBtn.click();

      const shadow = getPanelShadow();
      expect(shadow?.querySelector('.panel.locked-mode')).toBeNull();
      expect(shadow?.querySelector('.empty-state')).not.toBeNull();
    });

    it('deactivates via the panel close button', () => {
      const instance = createCore();
      instance.mount();
      instance.setActive(true);

      const buttons = Array.from(
        getPanelShadow()?.querySelectorAll('.icon-btn') ?? [],
      ) as HTMLButtonElement[];
      const closeBtn = buttons.find((b) => b.textContent === '×');
      closeBtn?.click();

      expect(adapter.onDeactivate).toHaveBeenCalled();
      expect(getPanelShadow()?.querySelector('.panel')).toBeNull();
    });

    it('shows and hides the hover panel as the pointer moves', () => {
      const instance = createCore();
      instance.mount();
      instance.setActive(true);
      const pageEl = document.createElement('div');
      document.body.appendChild(pageEl);

      pageEl.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      expect(
        getPanelShadow()?.querySelector('.panel.hover-mode'),
      ).not.toBeNull();

      document.dispatchEvent(new Event('mouseleave'));
      expect(getPanelShadow()?.querySelector('.empty-state')).not.toBeNull();
    });
  });

  describe('unmount', () => {
    it('removes the host and the keyboard listener', () => {
      const instance = createCore();
      instance.mount();

      instance.unmount();

      expect(getHost()).toBeNull();
      expect(instance.isMounted()).toBe(false);

      document.body.dispatchEvent(shortcut());
      expect(adapter.onActivate).not.toHaveBeenCalled();
    });
  });

  describe('autoInit', () => {
    it('mounts a core backed by the fallback adapter', async () => {
      const instance = await DesignerModeCore.autoInit();

      expect(instance.isMounted()).toBe(true);

      instance.unmount();
      expect(instance.isMounted()).toBe(false);
    });
  });
});
