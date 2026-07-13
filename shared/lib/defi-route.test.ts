import { buildDefiRoutePath, decodeDefiRouteParam } from './defi-route';

describe('defi-route', () => {
  describe('buildDefiRoutePath', () => {
    it('builds a defi details route path', () => {
      expect(buildDefiRoutePath('eip155:1', 'curve')).toBe(
        '/defi/eip155%3A1/curve',
      );
    });

    it('encodes hex chain ids without changing them', () => {
      expect(buildDefiRoutePath('0x1', 'aave')).toBe('/defi/0x1/aave');
    });

    it('encodes the protocol id', () => {
      expect(buildDefiRoutePath('0x1', 'aave v3')).toBe(
        '/defi/0x1/aave%20v3',
      );
    });
  });

  describe('decodeDefiRouteParam', () => {
    it('decodes encoded route params', () => {
      expect(decodeDefiRouteParam('aave%20v3')).toBe('aave v3');
    });
  });
});
