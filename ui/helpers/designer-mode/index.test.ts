import { initDesignerMode } from '.';

describe('initDesignerMode', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('relay offline'));
  });

  it('mounts the designer-mode host and returns a cleanup function', () => {
    const cleanup = initDesignerMode();

    expect(
      document.body.querySelector('[data-designer-mode="root"]'),
    ).not.toBeNull();

    cleanup();

    expect(
      document.body.querySelector('[data-designer-mode="root"]'),
    ).toBeNull();
  });

  it('forwards options to the core', () => {
    const cleanup = initDesignerMode({ defaultActive: false });

    const host = document.body.querySelector('[data-designer-mode="root"]');
    expect(host).not.toBeNull();
    expect(host?.querySelector('.dm-toggle')).toBeNull();

    cleanup();
  });
});
