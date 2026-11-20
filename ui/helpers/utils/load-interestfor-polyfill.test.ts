import { loadInterestForPolyfill } from './load-interestfor-polyfill';

const mockLoaded = jest.fn();

jest.mock('interestfor', () => {
  mockLoaded();
  return {};
});

describe('loadInterestForPolyfill', () => {
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

    delete HTMLButtonElement.prototype.interestForElement;
  });

  it('skips the polyfill when interestForElement is native', async () => {
    Object.defineProperty(HTMLButtonElement.prototype, 'interestForElement', {
      configurable: true,
      value: null,
    });

    await loadInterestForPolyfill();

    expect(mockLoaded).not.toHaveBeenCalled();
  });

  it('loads the polyfill when interestForElement is missing', async () => {
    delete HTMLButtonElement.prototype.interestForElement;

    await loadInterestForPolyfill();

    expect(mockLoaded).toHaveBeenCalledTimes(1);
  });
});
