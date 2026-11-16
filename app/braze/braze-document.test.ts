import { it } from '@jest/globals';
import { createBrazeDocument } from './braze-document';

describe('createBrazeDocument', () => {
  it('parses the endpoint without creating a real element', () => {
    const createElement = jest.spyOn(document, 'createElement');
    const facade = createBrazeDocument(
      'chrome-extension://example/braze-worker.js',
    );
    const anchor = facade.createElement('a');

    anchor.href = 'https://sdk.example.com/';

    expect(anchor.href).toBe('https://sdk.example.com/');
    expect(anchor.pathname).toBe('/');
    expect(String(anchor)).toBe('https://sdk.example.com/');
    expect(createElement).not.toHaveBeenCalled();
  });

  it.each(['script', 'iframe', 'div', 'span', 'link', 'SCRIPT'])(
    'rejects creation of %s',
    (tagName) => {
      const facade = createBrazeDocument('https://example.test/worker.js');

      expect(() => facade.createElement(tagName)).toThrow(
        'Braze cannot create DOM elements',
      );
    },
  );

  it('exposes no node or document traversal through the URL adapter', () => {
    const facade = createBrazeDocument('https://example.test/worker.js');
    const anchor = facade.createElement('a');

    for (const key of [
      'ownerDocument',
      'defaultView',
      'parentNode',
      'appendChild',
      'innerHTML',
      'nodeType',
    ]) {
      expect(anchor).not.toHaveProperty(key);
      expect(facade).not.toHaveProperty(key);
    }
    expect(facade.location).not.toHaveProperty('assign');
    expect(Object.isFrozen(anchor)).toBe(true);
    expect(Object.isFrozen(facade)).toBe(true);
  });

  it('returns no real nodes from message cleanup queries', () => {
    const facade = createBrazeDocument('https://example.test/worker.js');

    expect(facade.querySelectorAll()).toStrictEqual([]);
    expect(facade.getElementsByClassName()).toStrictEqual([]);
    expect(facade.getElementById()).toBeNull();
    expect(Object.isFrozen(facade.querySelectorAll())).toBe(true);
  });

  it('discards cookie writes without accessing the real cookie jar', () => {
    const cookie = jest.spyOn(document, 'cookie', 'set');
    const facade = createBrazeDocument('https://example.test/worker.js');

    facade.cookie = 'ab._gd=ab._gd';

    expect(facade.cookie).toBe('');
    expect(cookie).not.toHaveBeenCalled();
  });
});
