import { loadPolyfills } from './load-polyfills';

const mockLoaded = jest.fn();

jest.mock('interestfor', () => {
  mockLoaded();
  return {};
});

describe('loadPolyfills', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLButtonElement.prototype,
    'interestForElement',
  );

  afterEach(() => {
    mockLoaded.mockClear();
    if (descriptor) {
      Object.defineProperty(
        HTMLButtonElement.prototype,
        'interestForElement',
        descriptor,
      );
      return;
    }

    delete (
      HTMLButtonElement.prototype as typeof HTMLButtonElement.prototype & {
        interestForElement?: unknown;
      }
    ).interestForElement;
  });

  it('skips the interestfor polyfill when interestForElement is native', async () => {
    Object.defineProperty(HTMLButtonElement.prototype, 'interestForElement', {
      configurable: true,
      value: null,
    });

    await loadPolyfills();

    expect(mockLoaded).not.toHaveBeenCalled();
  });

  it('loads the interestfor polyfill when interestForElement is missing', async () => {
    delete (
      HTMLButtonElement.prototype as typeof HTMLButtonElement.prototype & {
        interestForElement?: unknown;
      }
    ).interestForElement;

    await loadPolyfills();

    expect(mockLoaded).toHaveBeenCalledTimes(1);
  });

  it('does not reject when a polyfill fails to load', async () => {
    jest.resetModules();
    jest.doMock('interestfor', () => {
      throw new Error('load failed');
    });
    delete (
      HTMLButtonElement.prototype as typeof HTMLButtonElement.prototype & {
        interestForElement?: unknown;
      }
    ).interestForElement;

    const { loadPolyfills: isolatedLoadPolyfills } =
      await import('./load-polyfills');

    await expect(isolatedLoadPolyfills()).resolves.toBeUndefined();
  });
});
