import { createAdapter, detectFramework } from './detect';

describe('createAdapter', () => {
  it('builds fallback component info from the DOM element', () => {
    const adapter = createAdapter();
    const el = document.createElement('button');
    el.className = 'primary';
    document.body.appendChild(el);

    const info = adapter.getComponentInfo(el);

    expect(info?.componentName).toBe('button');
    expect(info?.classes).toEqual(['primary']);
    expect(info?.filePath).toBeNull();

    el.remove();
  });

  it('exposes callable activation no-ops', () => {
    const adapter = createAdapter();

    expect(() => adapter.onActivate()).not.toThrow();
    expect(() => adapter.onDeactivate()).not.toThrow();
  });
});

describe('detectFramework', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves vanilla when no framework markers are present', async () => {
    jest.useFakeTimers();

    const promise = detectFramework();
    jest.advanceTimersByTime(150);

    await expect(promise).resolves.toBe('vanilla');

    jest.useRealTimers();
  });

  it('resolves react when the first body child carries a fiber key', async () => {
    const child = document.createElement('div');
    const fiberKey = '__reactFiber$test123';
    (child as unknown as Record<string, unknown>)[fiberKey] = {};
    document.body.appendChild(child);
    jest.useFakeTimers();

    const promise = detectFramework();
    jest.advanceTimersByTime(150);

    await expect(promise).resolves.toBe('react');

    jest.useRealTimers();
    child.remove();
  });
});
