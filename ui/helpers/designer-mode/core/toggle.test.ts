import { ToggleController } from './toggle';

function mouseAt(type: string, x: number, y: number): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
}

describe('ToggleController', () => {
  let container: HTMLDivElement;
  let toggle: ToggleController;

  const getButton = () =>
    container.querySelector('.dm-toggle') as HTMLButtonElement;
  const getLabel = () =>
    getButton().querySelectorAll('span')[1] as HTMLSpanElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    toggle = new ToggleController();
  });

  afterEach(() => {
    toggle.unmount();
  });

  describe('mount', () => {
    it('renders the fab button with emoji and a hidden label', () => {
      toggle.mount(container);

      const btn = getButton();
      expect(btn).not.toBeNull();
      expect(btn.getAttribute('data-designer-mode')).toBe('toggle');
      expect(btn.textContent).toContain('🎨');
      expect(getLabel().textContent).toBe('Designer Mode');
      expect(getLabel().style.display).toBe('none');
    });

    it('expands the label on mouseenter and collapses it on mouseleave', () => {
      toggle.mount(container);
      const btn = getButton();

      btn.dispatchEvent(new MouseEvent('mouseenter'));
      expect(getLabel().style.display).toBe('inline');
      expect(btn.style.padding).toBe('0px 16px');

      btn.dispatchEvent(new MouseEvent('mouseleave'));
      expect(getLabel().style.display).toBe('none');
      expect(btn.style.width).toBe('44px');
    });
  });

  describe('click vs drag', () => {
    it('fires onToggle on a click without movement', () => {
      const onToggle = jest.fn();
      toggle.mount(container);
      toggle.setOnToggle(onToggle);

      getButton().dispatchEvent(mouseAt('mousedown', 100, 100));
      document.dispatchEvent(mouseAt('mouseup', 100, 100));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('fires onToggle when the pointer moves less than the drag threshold', () => {
      const onToggle = jest.fn();
      toggle.mount(container);
      toggle.setOnToggle(onToggle);

      getButton().dispatchEvent(mouseAt('mousedown', 100, 100));
      document.dispatchEvent(mouseAt('mousemove', 102, 101));
      document.dispatchEvent(mouseAt('mouseup', 102, 101));

      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(toggle.getPosition()).toEqual({ right: 20, bottom: 20 });
    });

    it('moves the button instead of toggling when dragged', () => {
      const onToggle = jest.fn();
      toggle.mount(container);
      toggle.setOnToggle(onToggle);
      const btn = getButton();

      btn.dispatchEvent(mouseAt('mousedown', 100, 100));
      document.dispatchEvent(mouseAt('mousemove', 110, 90));
      document.dispatchEvent(mouseAt('mouseup', 110, 90));

      expect(onToggle).not.toHaveBeenCalled();
      expect(toggle.getPosition()).toEqual({ right: 10, bottom: 30 });
      expect(btn.style.right).toBe('10px');
      expect(btn.style.bottom).toBe('30px');
      expect(btn.style.cursor).toBe('grab');
    });

    it('clamps the position so the button stays on screen', () => {
      toggle.mount(container);
      const btn = getButton();

      btn.dispatchEvent(mouseAt('mousedown', 100, 100));
      document.dispatchEvent(mouseAt('mousemove', 400, 400));
      document.dispatchEvent(mouseAt('mouseup', 400, 400));

      expect(toggle.getPosition()).toEqual({ right: 0, bottom: 0 });
    });

    it('removes the drag listeners after mouseup', () => {
      toggle.mount(container);
      const btn = getButton();
      btn.dispatchEvent(mouseAt('mousedown', 100, 100));
      document.dispatchEvent(mouseAt('mousemove', 110, 90));
      document.dispatchEvent(mouseAt('mouseup', 110, 90));
      const positionAfterDrag = { ...toggle.getPosition() };

      document.dispatchEvent(mouseAt('mousemove', 200, 200));

      expect(toggle.getPosition()).toEqual(positionAfterDrag);
    });
  });

  describe('setActive', () => {
    it('hides the button while active and shows it again when inactive', () => {
      toggle.mount(container);

      toggle.setActive(true);
      expect(getButton().style.display).toBe('none');

      toggle.setActive(false);
      expect(getButton().style.display).toBe('flex');
    });

    it('is safe to call before mount', () => {
      expect(() => toggle.setActive(true)).not.toThrow();
    });
  });

  describe('unmount', () => {
    it('removes the button from the container', () => {
      toggle.mount(container);

      toggle.unmount();

      expect(container.querySelector('.dm-toggle')).toBeNull();
    });

    it('cleans up an in-progress drag so document events are harmless', () => {
      toggle.mount(container);
      getButton().dispatchEvent(mouseAt('mousedown', 100, 100));

      toggle.unmount();

      expect(() => {
        document.dispatchEvent(mouseAt('mousemove', 200, 200));
        document.dispatchEvent(mouseAt('mouseup', 200, 200));
      }).not.toThrow();
      expect(toggle.getPosition()).toEqual({ right: 20, bottom: 20 });
    });

    it('is safe to call twice', () => {
      toggle.mount(container);

      toggle.unmount();

      expect(() => toggle.unmount()).not.toThrow();
    });
  });
});
