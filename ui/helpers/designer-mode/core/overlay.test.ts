import { OverlayController } from './overlay';
import type { ComponentInfo, InspectorAdapter } from './types';

const EMPTY_STYLES = {
  layout: {},
  typography: {},
  color: {},
  spacing: {},
  border: {},
  effects: {},
};

function makeInfo(
  componentName: string,
  testId: string | null = null,
): ComponentInfo {
  return {
    componentName,
    filePath: null,
    lineNumber: null,
    props: null,
    testId,
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

function mouse(type: string): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true });
}

function key(name: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: name, bubbles: true });
}

describe('OverlayController', () => {
  let container: HTMLDivElement;
  let pageEl: HTMLDivElement;
  let adapter: {
    getComponentInfo: jest.Mock;
    onActivate: jest.Mock;
    onDeactivate: jest.Mock;
  };
  let overlay: OverlayController;
  let writeText: jest.Mock;

  const getHighlight = () =>
    container.querySelector('.dm-highlight') as HTMLDivElement;
  const getTooltip = () =>
    container.querySelector('.dm-tooltip') as HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    pageEl = document.createElement('div');
    document.body.appendChild(pageEl);

    adapter = {
      getComponentInfo: jest.fn(() => makeInfo('SendButton', 'send-btn')),
      onActivate: jest.fn(),
      onDeactivate: jest.fn(),
    };
    overlay = new OverlayController(adapter as InspectorAdapter);

    writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    overlay.deactivate();
  });

  describe('mount', () => {
    it('creates hidden highlight and tooltip elements in the container', () => {
      overlay.mount(container);

      expect(getHighlight()).not.toBeNull();
      expect(getTooltip()).not.toBeNull();
      expect(getHighlight().style.display).toBe('none');
      expect(getTooltip().style.display).toBe('none');
    });
  });

  describe('activate / hover', () => {
    it('notifies the adapter on activate', () => {
      overlay.mount(container);
      overlay.activate();

      expect(adapter.onActivate).toHaveBeenCalledTimes(1);
    });

    it('shows highlight and tooltip on mousemove over a page element', () => {
      const onHover = jest.fn();
      overlay.mount(container);
      overlay.setOnHover(onHover);
      overlay.activate();

      pageEl.dispatchEvent(mouse('mousemove'));

      expect(getHighlight().style.display).toBe('block');
      expect(getHighlight().style.border).toContain('dashed');
      expect(getTooltip().style.display).toBe('block');
      expect(getTooltip().textContent).toBe('SendButton [send-btn]');
      expect(onHover).toHaveBeenCalledWith(
        expect.objectContaining({ componentName: 'SendButton' }),
        pageEl,
      );
      expect(overlay.getHoveredElement()).toBe(pageEl);
    });

    it('omits the testId suffix when the info has none', () => {
      adapter.getComponentInfo.mockReturnValue(makeInfo('Plain'));
      overlay.mount(container);
      overlay.activate();

      pageEl.dispatchEvent(mouse('mousemove'));

      expect(getTooltip().textContent).toBe('Plain');
    });

    it('still fires onHover with the element when the adapter returns null', () => {
      const onHover = jest.fn();
      adapter.getComponentInfo.mockReturnValue(null);
      overlay.mount(container);
      overlay.setOnHover(onHover);
      overlay.activate();

      pageEl.dispatchEvent(mouse('mousemove'));

      expect(onHover).toHaveBeenCalledWith(null, pageEl);
      expect(getTooltip().style.display).toBe('none');
    });

    it('ignores elements inside the designer UI', () => {
      const onHover = jest.fn();
      const dmRoot = document.createElement('div');
      dmRoot.setAttribute('data-designer-mode', 'root');
      const inner = document.createElement('button');
      dmRoot.appendChild(inner);
      document.body.appendChild(dmRoot);
      overlay.mount(container);
      overlay.setOnHover(onHover);
      overlay.activate();

      inner.dispatchEvent(mouse('mousemove'));

      expect(onHover).not.toHaveBeenCalled();
      expect(getHighlight().style.display).toBe('none');
    });

    it('clears the hover state on document mouseleave', () => {
      const onHover = jest.fn();
      overlay.mount(container);
      overlay.setOnHover(onHover);
      overlay.activate();
      pageEl.dispatchEvent(mouse('mousemove'));

      document.dispatchEvent(new Event('mouseleave'));

      expect(getHighlight().style.display).toBe('none');
      expect(getTooltip().style.display).toBe('none');
      expect(onHover).toHaveBeenLastCalledWith(null, null);
      expect(overlay.getHoveredElement()).toBeNull();
    });
  });

  describe('click locking', () => {
    it('locks the selection on click and fires onSelect', () => {
      const onSelect = jest.fn();
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();

      pageEl.dispatchEvent(mouse('click'));

      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ componentName: 'SendButton' }),
        pageEl,
      );
      expect(getTooltip().textContent).toContain('locked');
      expect(getHighlight().style.border).toContain('solid');
    });

    it('unlocks when the same element is clicked again', () => {
      const onSelect = jest.fn();
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();
      pageEl.dispatchEvent(mouse('click'));

      pageEl.dispatchEvent(mouse('click'));

      expect(onSelect).toHaveBeenLastCalledWith(null, null);
      expect(getHighlight().style.display).toBe('none');
      expect(getTooltip().style.display).toBe('none');
    });

    it('does not lock when the adapter returns no info', () => {
      const onSelect = jest.fn();
      adapter.getComponentInfo.mockReturnValue(null);
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();

      pageEl.dispatchEvent(mouse('click'));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores clicks on the designer UI', () => {
      const onSelect = jest.fn();
      const dmRoot = document.createElement('div');
      dmRoot.setAttribute('data-designer-mode', 'panel');
      document.body.appendChild(dmRoot);
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();

      dmRoot.dispatchEvent(mouse('click'));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores hover updates while locked', () => {
      const onHover = jest.fn();
      overlay.mount(container);
      overlay.setOnHover(onHover);
      overlay.activate();
      pageEl.dispatchEvent(mouse('mousemove'));
      pageEl.dispatchEvent(mouse('click'));
      const hoverCalls = onHover.mock.calls.length;
      const other = document.createElement('span');
      document.body.appendChild(other);

      other.dispatchEvent(mouse('mousemove'));

      expect(onHover).toHaveBeenCalledTimes(hoverCalls);
      expect(overlay.getHoveredElement()).toBe(pageEl);
    });

    it('ignores mouseleave while locked', () => {
      overlay.mount(container);
      overlay.activate();
      pageEl.dispatchEvent(mouse('click'));

      document.dispatchEvent(new Event('mouseleave'));

      expect(getHighlight().style.display).toBe('block');
    });
  });

  describe('keyboard shortcuts', () => {
    it('unlocks on Escape', () => {
      const onSelect = jest.fn();
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();
      pageEl.dispatchEvent(mouse('click'));

      document.body.dispatchEvent(key('Escape'));

      expect(onSelect).toHaveBeenLastCalledWith(null, null);
      expect(getHighlight().style.display).toBe('none');
    });

    it('copies the selected component info on "c"', () => {
      overlay.mount(container);
      overlay.activate();
      pageEl.dispatchEvent(mouse('click'));

      document.body.dispatchEvent(key('c'));

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('SendButton'),
      );
    });

    it('copies the hovered component info on "C" when nothing is locked', () => {
      overlay.mount(container);
      overlay.activate();
      pageEl.dispatchEvent(mouse('mousemove'));

      document.body.dispatchEvent(key('C'));

      expect(writeText).toHaveBeenCalledTimes(1);
    });

    it('does nothing on "c" without a hovered or selected element', () => {
      overlay.mount(container);
      overlay.activate();

      document.body.dispatchEvent(key('c'));

      expect(writeText).not.toHaveBeenCalled();
    });

    it('ignores keydown events originating from an input', () => {
      const onSelect = jest.fn();
      const input = document.createElement('input');
      document.body.appendChild(input);
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();
      pageEl.dispatchEvent(mouse('click'));
      onSelect.mockClear();

      input.dispatchEvent(key('Escape'));
      input.dispatchEvent(key('c'));

      expect(onSelect).not.toHaveBeenCalled();
      expect(writeText).not.toHaveBeenCalled();
      expect(getHighlight().style.display).toBe('block');
    });

    it('ignores keydown events originating from a textarea', () => {
      const onSelect = jest.fn();
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();
      pageEl.dispatchEvent(mouse('click'));
      onSelect.mockClear();

      textarea.dispatchEvent(key('Escape'));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores keydown events from a contenteditable element', () => {
      const onSelect = jest.fn();
      const editable = document.createElement('div');
      Object.defineProperty(editable, 'isContentEditable', { value: true });
      document.body.appendChild(editable);
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();
      pageEl.dispatchEvent(mouse('click'));
      onSelect.mockClear();

      editable.dispatchEvent(key('Escape'));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('ignores keydown events from inside the designer UI', () => {
      const onSelect = jest.fn();
      const dmRoot = document.createElement('div');
      dmRoot.setAttribute('data-designer-mode', 'panel');
      const inner = document.createElement('button');
      dmRoot.appendChild(inner);
      document.body.appendChild(dmRoot);
      overlay.mount(container);
      overlay.setOnSelect(onSelect);
      overlay.activate();
      pageEl.dispatchEvent(mouse('click'));
      onSelect.mockClear();

      inner.dispatchEvent(key('Escape'));

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('notifies the adapter, hides the overlay and removes listeners', () => {
      const onHover = jest.fn();
      overlay.mount(container);
      overlay.setOnHover(onHover);
      overlay.activate();
      pageEl.dispatchEvent(mouse('mousemove'));

      overlay.deactivate();

      expect(adapter.onDeactivate).toHaveBeenCalled();
      expect(getHighlight().style.display).toBe('none');
      expect(getTooltip().style.display).toBe('none');

      onHover.mockClear();
      pageEl.dispatchEvent(mouse('mousemove'));
      expect(onHover).not.toHaveBeenCalled();
    });
  });
});
