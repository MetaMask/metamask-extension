import { PanelController } from './panel';
import type { RelayClient } from './relay';
import type { ComponentInfo, TokenPattern } from './types';

type ResponseCallback = ((response: string) => void) | null;

type PanelOptions = {
  onClose?: () => void;
  onUnlock?: () => void;
  tokenPatterns?: TokenPattern[];
};

const TEXT_CONTENT_KEY = '__textContent';
const CLASSES_KEY = '__classes';

const flushMicrotasks = () =>
  Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => Promise.resolve())
    .then(() => Promise.resolve())
    .then(() => Promise.resolve())
    .then(() => Promise.resolve());

const createRelayMock = () => {
  const callbackHolder: { current: ResponseCallback } = { current: null };
  const relay = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onResponse: jest.fn((cb: ResponseCallback) => {
      callbackHolder.current = cb;
    }),
    stopPolling: jest.fn(),
    checkHealth: jest.fn().mockResolvedValue('connected'),
  };
  return { relay, callbackHolder };
};

const createRect = (): DOMRectReadOnly =>
  ({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    top: 0,
    right: 100,
    bottom: 50,
    left: 0,
    toJSON: () => ({}),
  }) as DOMRectReadOnly;

const createInfo = (overrides: Partial<ComponentInfo> = {}): ComponentInfo => ({
  componentName: 'FancyButton',
  filePath: 'ui/components/fancy/fancy-button.tsx',
  lineNumber: 42,
  props: { foo: '"bar"' },
  testId: 'fancy-button',
  classes: ['token-primary', 'flex-row', 'plainclass'],
  computedStyles: {
    layout: {
      display: 'flex',
      position: 'relative',
      width: '100px',
      height: '50px',
      'flex-direction': 'row',
      'align-items': 'center',
      'justify-content': 'center',
      gap: '4px',
      overflow: 'hidden',
    },
    typography: {
      'font-family': 'Arial',
      'font-size': '14px',
      'font-weight': '500',
      'line-height': '20px',
      'text-align': 'left',
    },
    color: {
      color: 'rgb(255, 0, 0)',
      opacity: '0.5',
    },
    spacing: {
      'margin-top': '8px',
      'margin-right': '8px',
      'margin-bottom': '8px',
      'margin-left': '8px',
      'padding-top': '4px',
      'padding-right': '8px',
      'padding-bottom': '4px',
      'padding-left': '8px',
    },
    border: {
      'border-width': '1px',
      'border-style': 'solid',
      'border-color': 'rgb(0, 0, 0)',
      'border-radius': '4px',
      border: '1px solid rgb(0, 0, 0)',
    },
    effects: {
      'background-color': 'rgb(0, 0, 255)',
      'box-shadow': '0 1px 2px rgba(0,0,0,0.3)',
    },
  },
  layoutRect: createRect(),
  textContent: 'Hello',
  domPath: 'div#root > div.a > button.b',
  ...overrides,
});

const createMinimalInfo = (): ComponentInfo => ({
  componentName: 'Bare',
  filePath: null,
  lineNumber: null,
  props: null,
  testId: null,
  classes: [],
  computedStyles: {
    layout: {},
    typography: {},
    color: {},
    spacing: {},
    border: {},
    effects: {},
  },
  layoutRect: createRect(),
  textContent: null,
});

const createTargetElement = (): HTMLElement => {
  const el = document.createElement('button');
  el.className = 'token-primary flex-row plainclass';
  el.appendChild(document.createTextNode('Hello'));
  document.body.appendChild(el);
  return el;
};

const mountedControllers: PanelController[] = [];

const mountPanel = (
  options: PanelOptions = {},
  initialHealth: 'connected' | 'disconnected' = 'connected',
) => {
  const { relay, callbackHolder } = createRelayMock();
  relay.checkHealth.mockResolvedValue(initialHealth);
  const controller = new PanelController(
    relay as unknown as RelayClient,
    options,
  );
  const container = document.createElement('div');
  document.body.appendChild(container);
  controller.mount(container);
  mountedControllers.push(controller);
  const host = container.querySelector(
    '[data-designer-mode="panel"]',
  ) as HTMLElement;
  const shadow = host.shadowRoot as ShadowRoot;
  return { controller, relay, callbackHolder, container, host, shadow };
};

const findSection = (shadow: ShadowRoot, title: string): HTMLElement => {
  const sections = Array.from(shadow.querySelectorAll('.section'));
  const match = sections.find((section) =>
    section.querySelector('.section-header')?.textContent?.includes(title),
  );
  return match as HTMLElement;
};

const getSectionTitles = (shadow: ShadowRoot): string[] =>
  Array.from(shadow.querySelectorAll('.section-header')).map(
    (header) => header.querySelectorAll('span')[1]?.textContent ?? '',
  );

const dispatchInput = (el: Element) => {
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

const dispatchKeydown = (
  el: Element,
  key: string,
  init: KeyboardEventInit = {},
) => {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, ...init }),
  );
};

const dispatchMouse = (el: EventTarget, type: string, x: number, y: number) => {
  el.dispatchEvent(
    new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }),
  );
};

const getStatusLabel = (shadow: ShadowRoot): string =>
  shadow.querySelector('.footer-top')?.querySelectorAll('span')[1]
    ?.textContent ?? '';

describe('PanelController', () => {
  afterEach(() => {
    for (const controller of mountedControllers) {
      controller.unmount();
    }
    mountedControllers.length = 0;
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  describe('mount', () => {
    it('appends a shadow host with the designer-mode attribute and styles', () => {
      const { container, host, shadow } = mountPanel();

      expect(container.contains(host)).toBe(true);
      expect(host.getAttribute('data-designer-mode')).toBe('panel');
      expect(shadow.querySelector('style')?.textContent).toContain('.panel');
    });

    it('does not render a panel until made visible', () => {
      const { shadow } = mountPanel();

      expect(shadow.querySelector('.panel')).toBeNull();
    });

    it('checks relay health immediately and again on the interval', async () => {
      jest.useFakeTimers();
      const { relay } = mountPanel();

      expect(relay.checkHealth).toHaveBeenCalledTimes(1);

      await flushMicrotasks();
      jest.advanceTimersByTime(10000);

      expect(relay.checkHealth).toHaveBeenCalledTimes(2);
    });
  });

  describe('showCompact', () => {
    it('renders the empty state', () => {
      const { controller, shadow } = mountPanel();

      controller.showCompact();

      const panel = shadow.querySelector('.panel') as HTMLElement;
      expect(panel).not.toBeNull();
      expect(panel.querySelector('.empty-state')?.textContent).toContain(
        'Hover over any element',
      );
    });

    it('clears pending edits so the banner disappears', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);
      controller.applyEdit('width', '200px', el);
      expect(shadow.querySelector('.edits-banner')).not.toBeNull();

      controller.showCompact();

      expect(shadow.querySelector('.edits-banner')).toBeNull();
      expect(shadow.querySelector('.empty-state')).not.toBeNull();
    });
  });

  describe('show', () => {
    it('renders the element header with name, test id, breadcrumb and filepath', () => {
      const { controller, shadow } = mountPanel();

      controller.show(createInfo(), createTargetElement());

      expect(shadow.querySelector('.el-name')?.textContent).toContain(
        'FancyButton',
      );
      expect(shadow.querySelector('.test-id-pill')?.textContent).toBe(
        'fancy-button',
      );
      expect(shadow.querySelector('.el-breadcrumb')?.textContent).toBe(
        'div#root › div.a › button.b',
      );
      expect(shadow.querySelector('.el-filepath')?.textContent).toBe(
        'fancy/fancy-button.tsx:42',
      );
    });

    it('renders all sections, the lock bar and the footer', () => {
      const { controller, shadow } = mountPanel();

      controller.show(createInfo(), createTargetElement());

      expect(getSectionTitles(shadow)).toStrictEqual([
        'Text Content',
        'Layout',
        'Spacing',
        'Typography',
        'Fill & Stroke',
        'Component',
        'Design Tokens',
        'Classes',
      ]);
      expect(shadow.querySelector('.lock-bar')?.textContent).toContain(
        'Selection locked',
      );
      expect(shadow.querySelector('.footer')).not.toBeNull();
      expect(
        shadow.querySelector('.panel')?.classList.contains('locked-mode'),
      ).toBe(true);
    });

    it('renders the flex grid, overflow row and fill & stroke rows', () => {
      const { controller, shadow } = mountPanel();

      controller.show(createInfo(), createTargetElement());

      const layout = findSection(shadow, 'Layout');
      expect(layout.querySelectorAll('.two-col')).toHaveLength(2);
      expect(layout.textContent).toContain('Overflow');

      const fill = findSection(shadow, 'Fill & Stroke');
      expect(fill.textContent).toContain('Background');
      expect(fill.textContent).toContain('Opacity');
      expect(fill.textContent).toContain('Border');
      expect(fill.textContent).toContain('Radius');
      expect(fill.textContent).toContain('Shadow');
      expect(
        (fill.querySelector('.section-body') as HTMLElement).style.display,
      ).toBe('none');
    });

    it('renders the component section with DOM path and props JSON', () => {
      const { controller, shadow } = mountPanel();

      controller.show(createInfo(), createTargetElement());

      const component = findSection(shadow, 'Component');
      expect(component.textContent).toContain('div#root > div.a > button.b');
      expect(component.querySelector('.props-pre')?.textContent).toContain(
        'foo',
      );
    });

    it('omits optional pieces for a minimal component info', () => {
      const { controller, shadow } = mountPanel();

      controller.show(createMinimalInfo(), createTargetElement());

      expect(shadow.querySelector('.text-input')).toBeNull();
      expect(shadow.querySelector('.test-id-pill')).toBeNull();
      expect(shadow.querySelector('.el-breadcrumb')).toBeNull();
      expect(shadow.querySelector('.el-filepath')).toBeNull();
      expect(shadow.querySelector('.color-swatch')).toBeNull();
      expect(shadow.querySelector('.props-pre')).toBeNull();
      expect(getSectionTitles(shadow)).toStrictEqual([
        'Layout',
        'Spacing',
        'Typography',
        'Fill & Stroke',
        'Component',
      ]);
      const layout = findSection(shadow, 'Layout');
      expect(layout.querySelectorAll('.two-col')).toHaveLength(1);
      expect(layout.textContent).not.toContain('Overflow');
    });

    it('uses custom token patterns when provided', () => {
      const { controller, shadow } = mountPanel({
        tokenPatterns: [{ pattern: /^custom-/u, category: 'Custom' }],
      });
      const info = createInfo({ classes: ['custom-a', 'other'] });

      controller.show(info, createTargetElement());

      const tokens = findSection(shadow, 'Design Tokens');
      const pills = tokens.querySelectorAll('.pill');
      expect(pills).toHaveLength(1);
      expect(pills[0].textContent).toContain('custom-a');
    });
  });

  describe('text section', () => {
    it('shows the current text content in the textarea', () => {
      const { controller, shadow } = mountPanel();

      controller.show(createInfo(), createTargetElement());

      const ta = shadow.querySelector('.text-input') as HTMLTextAreaElement;
      expect(ta.value).toBe('Hello');
    });

    it('records a text edit and updates the element text nodes', () => {
      const { controller, shadow } = mountPanel();
      const el = document.createElement('button');
      el.appendChild(document.createTextNode('Hello'));
      el.appendChild(document.createElement('span'));
      el.appendChild(document.createTextNode('World'));
      document.body.appendChild(el);
      controller.show(createInfo(), el);

      const ta = shadow.querySelector('.text-input') as HTMLTextAreaElement;
      ta.value = 'New text';
      dispatchInput(ta);

      expect(el.childNodes[0].textContent).toBe('New text');
      expect(el.childNodes[2].textContent).toBe('');

      controller.applyEdit('width', '200px', el);

      const banner = shadow.querySelector('.edits-banner-text');
      expect(banner?.textContent).toContain(TEXT_CONTENT_KEY);
      const rerendered = shadow.querySelector(
        '.text-input',
      ) as HTMLTextAreaElement;
      expect(rerendered.value).toBe('New text');
    });

    it('handles a text edit when the element has no text nodes', () => {
      const { controller, shadow } = mountPanel();
      const el = document.createElement('div');
      document.body.appendChild(el);
      controller.show(createInfo(), el);

      const ta = shadow.querySelector('.text-input') as HTMLTextAreaElement;
      ta.value = 'Anything';

      expect(() => dispatchInput(ta)).not.toThrow();
    });
  });

  describe('classes and tokens pill lists', () => {
    it('removes a class when its pill x is clicked', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const classesSection = findSection(shadow, 'Classes');
      const pills = Array.from(classesSection.querySelectorAll('.pill'));
      const plainPill = pills.find((p) =>
        p.textContent?.includes('plainclass'),
      ) as HTMLElement;
      (plainPill.querySelector('.pill-x') as HTMLElement).click();

      expect(el.classList.contains('plainclass')).toBe(false);
      expect(shadow.querySelector('.edits-banner-text')?.textContent).toContain(
        CLASSES_KEY,
      );
      expect(
        findSection(shadow, 'Classes').querySelectorAll('.pill'),
      ).toHaveLength(2);
    });

    it('adds a class via the add input and Enter key', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const classesSection = findSection(shadow, 'Classes');
      (classesSection.querySelector('.add-btn') as HTMLElement).click();
      const input = classesSection.querySelector(
        '.add-input',
      ) as HTMLInputElement;
      input.value = 'mt-4';
      dispatchKeydown(input, 'Enter');

      expect(el.classList.contains('mt-4')).toBe(true);
      expect(
        findSection(shadow, 'Classes').querySelectorAll('.pill'),
      ).toHaveLength(4);
    });

    it('cancels the add input with Escape', () => {
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());

      const classesSection = findSection(shadow, 'Classes');
      const addBtn = classesSection.querySelector('.add-btn') as HTMLElement;
      addBtn.click();
      const input = classesSection.querySelector(
        '.add-input',
      ) as HTMLInputElement;
      dispatchKeydown(input, 'Escape');

      expect(classesSection.querySelector('.add-input')).toBeNull();
      expect(addBtn.style.display).toBe('');
    });

    it('removes the add input on blur', () => {
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());

      const classesSection = findSection(shadow, 'Classes');
      const addBtn = classesSection.querySelector('.add-btn') as HTMLElement;
      addBtn.click();
      const input = classesSection.querySelector(
        '.add-input',
      ) as HTMLInputElement;
      input.dispatchEvent(new FocusEvent('blur'));

      expect(classesSection.querySelector('.add-input')).toBeNull();
      expect(addBtn.style.display).toBe('');
    });

    it('pressing Enter with an empty add input just closes it', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const classesSection = findSection(shadow, 'Classes');
      (classesSection.querySelector('.add-btn') as HTMLElement).click();
      const input = classesSection.querySelector(
        '.add-input',
      ) as HTMLInputElement;
      input.value = '   ';
      dispatchKeydown(input, 'Enter');

      expect(classesSection.querySelector('.add-input')).toBeNull();
      expect(el.classList).toHaveLength(3);
    });
  });

  describe('inline editable values', () => {
    it('replaces the value with an input on click and applies edits live', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const layout = findSection(shadow, 'Layout');
      const display = layout.querySelector('.editable') as HTMLElement;
      display.click();

      const input = layout.querySelector('.edit-input') as HTMLInputElement;
      expect(input.value).toBe('flex');

      input.value = 'block';
      dispatchInput(input);

      expect(el.style.display).toBe('block');
    });

    it('commits the edit and re-renders with a banner on Enter', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const layout = findSection(shadow, 'Layout');
      (layout.querySelector('.editable') as HTMLElement).click();
      const input = layout.querySelector('.edit-input') as HTMLInputElement;
      input.value = 'block';
      dispatchInput(input);
      dispatchKeydown(input, 'Enter');

      expect(el.style.display).toBe('block');
      expect(shadow.querySelector('.edits-banner-text')?.textContent).toContain(
        'display',
      );
    });

    it('restores the original value on Escape', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const layout = findSection(shadow, 'Layout');
      (layout.querySelector('.editable') as HTMLElement).click();
      const input = layout.querySelector('.edit-input') as HTMLInputElement;
      input.value = 'block';
      dispatchKeydown(input, 'Escape');

      expect(layout.querySelector('.edit-input')).toBeNull();
      expect(layout.querySelector('.editable')?.textContent).toContain('flex');
    });

    it('re-renders with a banner when blurring a changed value', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const layout = findSection(shadow, 'Layout');
      const rows = Array.from(layout.querySelectorAll('.editable'));
      const position = rows[1] as HTMLElement;
      position.click();
      const input = layout.querySelector('.edit-input') as HTMLInputElement;
      input.value = 'absolute';
      dispatchInput(input);
      input.dispatchEvent(new FocusEvent('blur'));

      expect(el.style.position).toBe('absolute');
      expect(shadow.querySelector('.edits-banner-text')?.textContent).toContain(
        'position',
      );
    });

    it('increments numeric values with arrow keys', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const layout = findSection(shadow, 'Layout');
      const rows = Array.from(layout.querySelectorAll('.editable'));
      const width = rows[2] as HTMLElement;
      width.click();
      const input = layout.querySelector('.edit-input') as HTMLInputElement;

      dispatchKeydown(input, 'ArrowUp');
      expect(input.value).toBe('101px');
      expect(el.style.width).toBe('101px');

      dispatchKeydown(input, 'ArrowDown', { shiftKey: true });
      expect(input.value).toBe('91px');
      expect(el.style.width).toBe('91px');
    });

    it('removes an edit that returns to its original value', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      controller.applyEdit('display', 'block', el);
      expect(shadow.querySelector('.edits-banner')).not.toBeNull();

      controller.applyEdit('display', 'flex', el);
      expect(shadow.querySelector('.edits-banner')).toBeNull();
    });

    it('updates an existing edit log entry instead of duplicating it', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      controller.applyEdit('width', '200px', el);
      controller.applyEdit('width', '300px', el);

      const banner = shadow.querySelector('.edits-banner-text');
      expect(banner?.textContent).toContain('1 pending edit:');
      expect(banner?.textContent).toContain('width: 100 → 300');
    });

    it('summarizes more than two edits with a +N more suffix', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      controller.applyEdit('width', '200px', el);
      controller.applyEdit('height', '60px', el);
      controller.applyEdit('display', 'block', el);

      expect(shadow.querySelector('.edits-banner-text')?.textContent).toContain(
        '+1 more',
      );
    });
  });

  describe('color rows', () => {
    it('renders swatches for color values and records color input edits', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const typography = findSection(shadow, 'Typography');
      const swatch = typography.querySelector('.color-swatch') as HTMLElement;
      expect(swatch).not.toBeNull();

      const colorInput = typography.querySelector(
        '.color-input',
      ) as HTMLInputElement;
      expect(colorInput.value).toBe('#ff0000');

      expect(() => swatch.click()).not.toThrow();

      colorInput.value = '#00ff00';
      dispatchInput(colorInput);

      expect(el.style.color).toBe('rgb(0, 255, 0)');
    });

    it('converts hex and unparseable colors for the color input', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      controller.applyEdit('color', '#123456', el);
      let colorInput = findSection(shadow, 'Typography').querySelector(
        '.color-input',
      ) as HTMLInputElement;
      expect(colorInput.value).toBe('#123456');

      controller.applyEdit('color', 'blue', el);
      colorInput = findSection(shadow, 'Typography').querySelector(
        '.color-input',
      ) as HTMLInputElement;
      expect(colorInput.value).toBe('#000000');
    });
  });

  describe('spacing mini inputs', () => {
    it('applies an edit with a px unit on blur', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const spacing = findSection(shadow, 'Spacing');
      const input = spacing.querySelector('.mini-input') as HTMLInputElement;
      expect(input.value).toBe('8');

      input.dispatchEvent(new FocusEvent('focus'));
      input.value = '12';
      input.dispatchEvent(new FocusEvent('blur'));

      expect(el.style.marginTop).toBe('12px');
      expect(shadow.querySelector('.edits-banner-text')?.textContent).toContain(
        'margin-top',
      );
    });

    it('keeps non-numeric values as-is on blur', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const spacing = findSection(shadow, 'Spacing');
      const input = spacing.querySelector('.mini-input') as HTMLInputElement;

      input.dispatchEvent(new FocusEvent('focus'));
      input.value = 'auto';
      input.dispatchEvent(new FocusEvent('blur'));

      expect(el.style.marginTop).toBe('auto');
    });

    it('steps values with arrow keys and shift for larger steps', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const spacing = findSection(shadow, 'Spacing');
      const input = spacing.querySelector('.mini-input') as HTMLInputElement;

      dispatchKeydown(input, 'ArrowUp');
      expect(input.value).toBe('9');
      expect(el.style.marginTop).toBe('9px');

      dispatchKeydown(input, 'ArrowDown', { shiftKey: true });
      expect(input.value).toBe('-1');
      expect(el.style.marginTop).toBe('-1px');
    });

    it('resets the value on Escape', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const spacing = findSection(shadow, 'Spacing');
      const input = spacing.querySelector('.mini-input') as HTMLInputElement;
      input.dispatchEvent(new FocusEvent('focus'));
      input.value = '99';
      dispatchKeydown(input, 'Escape');

      expect(input.value).toBe('8');
    });

    it('blurs on Enter without throwing', () => {
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());

      const spacing = findSection(shadow, 'Spacing');
      const input = spacing.querySelector('.mini-input') as HTMLInputElement;

      expect(() => dispatchKeydown(input, 'Enter')).not.toThrow();
    });
  });

  describe('footer and chat', () => {
    it('shows the relay status and component pill', async () => {
      const { controller, shadow } = mountPanel();
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());

      expect(shadow.querySelector('.status-dot.connected')).not.toBeNull();
      expect(getStatusLabel(shadow)).toBe('Connected');
      expect(shadow.querySelector('.component-pill')?.textContent).toBe(
        'FancyButton',
      );
    });

    it('disables the send button when disconnected', async () => {
      const { controller, shadow } = mountPanel({}, 'disconnected');
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());

      const sendBtn = shadow.querySelector('.send-btn') as HTMLButtonElement;
      expect(sendBtn.disabled).toBe(true);
      expect(getStatusLabel(shadow)).toBe('Not connected');
    });

    it('sends a message on Enter and renders the reply', async () => {
      const { controller, relay, callbackHolder, shadow } = mountPanel();
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());

      const input = shadow.querySelector('.chat-input') as HTMLTextAreaElement;
      const sendBtn = shadow.querySelector('.send-btn') as HTMLButtonElement;
      expect(sendBtn.disabled).toBe(false);

      input.value = 'Make it blue';
      dispatchKeydown(input, 'Enter');

      expect(relay.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('=== DESIGNER MODE REQUEST'),
      );
      expect(shadow.querySelector('.msg-sent')?.textContent).toBe(
        'Make it blue',
      );
      expect(shadow.querySelector('.agent-working')).not.toBeNull();

      await flushMicrotasks();
      (callbackHolder.current as (r: string) => void)('Done');

      expect(shadow.querySelector('.agent-working')).toBeNull();
      expect(shadow.querySelector('.msg-agent')?.textContent).toBe('Done');
    });

    it('does not send on Enter with shift held', async () => {
      const { controller, relay, shadow } = mountPanel();
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());

      const input = shadow.querySelector('.chat-input') as HTMLTextAreaElement;
      input.value = 'Multi-line';
      dispatchKeydown(input, 'Enter', { shiftKey: true });

      expect(relay.sendMessage).not.toHaveBeenCalled();
    });

    it('does not send an empty message with no pending edits', async () => {
      const { controller, relay, shadow } = mountPanel();
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());

      const input = shadow.querySelector('.chat-input') as HTMLTextAreaElement;
      dispatchKeydown(input, 'Enter');

      expect(relay.sendMessage).not.toHaveBeenCalled();
    });

    it('shows a status message when the relay is unreachable', async () => {
      const { controller, relay, shadow } = mountPanel();
      relay.sendMessage.mockRejectedValue(new Error('offline'));
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());

      const input = shadow.querySelector('.chat-input') as HTMLTextAreaElement;
      input.value = 'Hello agent';
      dispatchKeydown(input, 'Enter');
      await flushMicrotasks();

      expect(shadow.querySelector('.msg-status')?.textContent).toContain(
        'Could not reach the relay',
      );
      expect(shadow.querySelector('.agent-working')).toBeNull();
    });

    it('sends pending edits when the Apply button is clicked', async () => {
      const { controller, relay, shadow } = mountPanel();
      await flushMicrotasks();
      const el = createTargetElement();
      controller.show(createInfo(), el);
      controller.applyEdit('width', '200px', el);

      const applyBtn = shadow.querySelector('.apply-btn') as HTMLButtonElement;
      applyBtn.click();

      expect(relay.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('width'),
      );
      expect(shadow.querySelector('.msg-sent')).toBeNull();
    });

    it('caps the chat thread at 50 messages', async () => {
      const { controller, callbackHolder, shadow } = mountPanel();
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());

      const respond = callbackHolder.current as (r: string) => void;
      for (let i = 0; i < 55; i += 1) {
        respond(`msg-${i}`);
      }

      const bubbles = shadow.querySelectorAll('.msg-agent');
      expect(bubbles).toHaveLength(50);
      expect(bubbles[0].textContent).toBe('msg-5');
      expect(bubbles[49].textContent).toBe('msg-54');
    });
  });

  describe('showHover and hideHover', () => {
    it('renders in hover mode without a lock bar', () => {
      const { controller, shadow } = mountPanel();

      controller.showHover(createInfo(), createTargetElement());

      const panel = shadow.querySelector('.panel') as HTMLElement;
      expect(panel.classList.contains('hover-mode')).toBe(true);
      expect(shadow.querySelector('.lock-bar')).toBeNull();
    });

    it('does not rebuild when hovering the same element again', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.showHover(createInfo(), el);
      const panel = shadow.querySelector('.panel');

      controller.showHover(createInfo(), el);

      expect(shadow.querySelector('.panel')).toBe(panel);
    });

    it('rebuilds when hovering a different element', () => {
      const { controller, shadow } = mountPanel();
      controller.showHover(createInfo(), createTargetElement());
      const panel = shadow.querySelector('.panel');

      controller.showHover(
        createInfo({ componentName: 'Other' }),
        createTargetElement(),
      );

      expect(shadow.querySelector('.panel')).not.toBe(panel);
      expect(shadow.querySelector('.el-name')?.textContent).toContain('Other');
    });

    it('falls back to the empty state on hideHover when not locked', () => {
      const { controller, shadow } = mountPanel();
      controller.showHover(createInfo(), createTargetElement());

      controller.hideHover();

      expect(shadow.querySelector('.empty-state')).not.toBeNull();
      expect(shadow.querySelector('.el-header')).toBeNull();
    });

    it('ignores hover updates while locked', () => {
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());

      controller.showHover(
        createInfo({ componentName: 'Intruder' }),
        createTargetElement(),
      );
      expect(shadow.querySelector('.el-name')?.textContent).toContain(
        'FancyButton',
      );

      controller.hideHover();
      expect(shadow.querySelector('.el-header')).not.toBeNull();
    });
  });

  describe('hide', () => {
    it('removes the panel from the shadow root', () => {
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());
      expect(shadow.querySelector('.panel')).not.toBeNull();

      controller.hide();

      expect(shadow.querySelector('.panel')).toBeNull();
    });
  });

  describe('minimize', () => {
    it('toggles the minimized class via the minimize button', () => {
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());

      const minBtn = Array.from(shadow.querySelectorAll('.icon-btn')).find(
        (b) => b.textContent === '▁',
      ) as HTMLButtonElement;
      minBtn.click();

      let panel = shadow.querySelector('.panel') as HTMLElement;
      expect(panel.classList.contains('minimized')).toBe(true);
      expect(panel.querySelector('.body')).toBeNull();

      const restoreBtn = Array.from(shadow.querySelectorAll('.icon-btn')).find(
        (b) => b.textContent === '▢',
      ) as HTMLButtonElement;
      restoreBtn.click();

      panel = shadow.querySelector('.panel') as HTMLElement;
      expect(panel.classList.contains('minimized')).toBe(false);
      expect(panel.querySelector('.body')).not.toBeNull();
    });
  });

  describe('header buttons', () => {
    it('calls onUnlock when the unlock button is clicked', () => {
      const onUnlock = jest.fn();
      const { controller, shadow } = mountPanel({ onUnlock });
      controller.show(createInfo(), createTargetElement());

      (shadow.querySelector('.unlock-btn') as HTMLButtonElement).click();

      expect(onUnlock).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the close button is clicked', () => {
      const onClose = jest.fn();
      const { controller, shadow } = mountPanel({ onClose });
      controller.show(createInfo(), createTargetElement());

      const closeBtn = Array.from(shadow.querySelectorAll('.icon-btn')).find(
        (b) => b.textContent === '×',
      ) as HTMLButtonElement;
      closeBtn.click();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('copies the component info and reverts the label after 2s', async () => {
      jest.useFakeTimers();
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());

      const copyBtn = shadow.querySelector('.copy-btn') as HTMLButtonElement;
      copyBtn.click();
      await flushMicrotasks();

      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('FancyButton'),
      );
      expect(copyBtn.textContent).toBe('✓ Copied');
      expect(copyBtn.classList.contains('copied')).toBe(true);

      jest.advanceTimersByTime(2000);

      expect(copyBtn.textContent).toBe('Copy for AI');
      expect(copyBtn.classList.contains('copied')).toBe(false);
    });

    it('does nothing on copy when no element is selected', () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      const { controller, shadow } = mountPanel();
      controller.showCompact();

      (shadow.querySelector('.copy-btn') as HTMLButtonElement).click();

      expect(writeText).not.toHaveBeenCalled();
    });

    it('ignores clipboard write failures', async () => {
      const writeText = jest.fn().mockRejectedValue(new Error('denied'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());

      const copyBtn = shadow.querySelector('.copy-btn') as HTMLButtonElement;
      copyBtn.click();
      await flushMicrotasks();

      expect(copyBtn.textContent).toBe('Copy for AI');
    });

    it('clears a pending copy feedback timer on unmount', async () => {
      jest.useFakeTimers();
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());
      (shadow.querySelector('.copy-btn') as HTMLButtonElement).click();
      await flushMicrotasks();

      expect(() => controller.unmount()).not.toThrow();
    });
  });

  describe('section collapse', () => {
    it('toggles the section body on header click', () => {
      const { controller, shadow } = mountPanel();
      controller.show(createInfo(), createTargetElement());

      const layout = findSection(shadow, 'Layout');
      const header = layout.querySelector('.section-header') as HTMLElement;
      const body = layout.querySelector('.section-body') as HTMLElement;
      expect(body.style.display).toBe('block');

      header.click();
      expect(body.style.display).toBe('none');

      header.click();
      expect(body.style.display).toBe('block');
    });

    it('persists the collapsed state across re-renders', () => {
      const { controller, shadow } = mountPanel();
      const el = createTargetElement();
      controller.show(createInfo(), el);

      const layout = findSection(shadow, 'Layout');
      (layout.querySelector('.section-header') as HTMLElement).click();

      controller.applyEdit('width', '200px', el);

      const rerendered = findSection(shadow, 'Layout');
      expect(
        (rerendered.querySelector('.section-body') as HTMLElement).style
          .display,
      ).toBe('none');
    });
  });

  describe('drag', () => {
    it('moves the panel with mousemove and stops after mouseup', () => {
      const { controller, shadow } = mountPanel();
      controller.showCompact();

      const panel = shadow.querySelector('.panel') as HTMLElement;
      const header = panel.querySelector('.header') as HTMLElement;

      dispatchMouse(header, 'mousedown', 200, 200);
      dispatchMouse(document, 'mousemove', 190, 210);

      expect(panel.style.right).toBe('30px');
      expect(panel.style.bottom).toBe('10px');

      dispatchMouse(document, 'mouseup', 190, 210);
      dispatchMouse(document, 'mousemove', 100, 100);

      expect(panel.style.right).toBe('30px');
      expect(panel.style.bottom).toBe('10px');
    });

    it('does not start a drag from a header button', () => {
      const { controller, shadow } = mountPanel();
      controller.showCompact();

      const panel = shadow.querySelector('.panel') as HTMLElement;
      const copyBtn = panel.querySelector('.copy-btn') as HTMLElement;

      dispatchMouse(copyBtn, 'mousedown', 200, 200);
      dispatchMouse(document, 'mousemove', 150, 150);

      expect(panel.style.right).toBe('20px');
      expect(panel.style.bottom).toBe('20px');
    });

    it('applies drag movement exactly once after multiple re-renders', () => {
      const { controller, shadow } = mountPanel();
      controller.showCompact();
      controller.showCompact();
      controller.showCompact();

      const panel = shadow.querySelector('.panel') as HTMLElement;
      const header = panel.querySelector('.header') as HTMLElement;

      dispatchMouse(header, 'mousedown', 100, 100);
      dispatchMouse(document, 'mousemove', 90, 100);

      expect(panel.style.right).toBe('30px');

      dispatchMouse(document, 'mouseup', 90, 100);
    });
  });

  describe('setPosition', () => {
    it('anchors right/bottom when the panel fits', () => {
      const { controller, shadow } = mountPanel();

      controller.setPosition(20, 20);
      controller.showCompact();

      const panel = shadow.querySelector('.panel') as HTMLElement;
      expect(panel.style.right).toBe('20px');
      expect(panel.style.bottom).toBe('20px');
    });

    it('flips to left/top anchors when the panel would overflow', () => {
      const { controller, shadow } = mountPanel();

      controller.setPosition(900, 700);
      controller.showCompact();

      const panel = shadow.querySelector('.panel') as HTMLElement;
      expect(panel.style.left).toBe('80px');
      expect(panel.style.top).toBe('24px');
    });

    it('clamps to the viewport when neither side fits', () => {
      const originalWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        configurable: true,
        writable: true,
      });
      const { controller, shadow } = mountPanel();

      controller.setPosition(290, 100);
      controller.showCompact();

      const panel = shadow.querySelector('.panel') as HTMLElement;
      expect(panel.style.right).toBe('160px');
      expect(panel.style.bottom).toBe('88px');

      Object.defineProperty(window, 'innerWidth', {
        value: originalWidth,
        configurable: true,
        writable: true,
      });
    });
  });

  describe('checkHealth', () => {
    it('re-renders the footer when the relay status changes', async () => {
      jest.useFakeTimers();
      const { controller, relay, shadow } = mountPanel();
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());
      expect(getStatusLabel(shadow)).toBe('Connected');

      relay.checkHealth.mockResolvedValue('disconnected');
      jest.advanceTimersByTime(10000);
      await flushMicrotasks();

      expect(getStatusLabel(shadow)).toBe('Not connected');
      expect(shadow.querySelector('.status-dot.disconnected')).not.toBeNull();
    });

    it('skips the rebuild while an input inside the panel has focus', async () => {
      jest.useFakeTimers();
      const { controller, relay, shadow } = mountPanel();
      await flushMicrotasks();
      controller.show(createInfo(), createTargetElement());

      const panel = shadow.querySelector('.panel');
      const chatInput = shadow.querySelector(
        '.chat-input',
      ) as HTMLTextAreaElement;
      chatInput.focus();

      relay.checkHealth.mockResolvedValue('disconnected');
      jest.advanceTimersByTime(10000);
      await flushMicrotasks();

      expect(shadow.querySelector('.panel')).toBe(panel);
      expect(getStatusLabel(shadow)).toBe('Connected');
    });
  });

  describe('unmount', () => {
    it('removes the host, stops polling and detaches the response callback', async () => {
      jest.useFakeTimers();
      const { controller, relay, callbackHolder, container } = mountPanel();
      await flushMicrotasks();
      const respond = callbackHolder.current as (r: string) => void;

      controller.unmount();

      expect(
        container.querySelector('[data-designer-mode="panel"]'),
      ).toBeNull();
      expect(relay.stopPolling).toHaveBeenCalledTimes(1);
      expect(relay.onResponse).toHaveBeenLastCalledWith(null);
      expect(() => respond('late response')).not.toThrow();

      const callsBefore = relay.checkHealth.mock.calls.length;
      jest.advanceTimersByTime(30000);
      expect(relay.checkHealth.mock.calls).toHaveLength(callsBefore);
    });

    it('ignores an in-flight health check that resolves after unmount', async () => {
      const { controller, relay } = mountPanel();
      let resolveHealth: (status: string) => void = () => undefined;
      relay.checkHealth.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveHealth = resolve;
          }),
      );

      controller.unmount();
      resolveHealth('connected');

      await expect(flushMicrotasks()).resolves.toBeUndefined();
    });
  });
});
