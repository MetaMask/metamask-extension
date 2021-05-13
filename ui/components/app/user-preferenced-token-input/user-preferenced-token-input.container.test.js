// eslint-disable-next-line import/unambiguous
let mapStateToProps;

jest.mock('react-redux', () => ({
  connect: (ms) => {
    mapStateToProps = ms;
    return () => ({});
  },
}));

require('./user-preferenced-token-input.container.js');

describe('UserPreferencedTokenInput container', () => {
  describe('mapStateToProps()', () => {
    it('should return the correct props', () => {
      const mockState = {
        metamask: {
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
          },
        },
      };

      expect(mapStateToProps(mockState)).toStrictEqual({
        useNativeCurrencyAsPrimaryCurrency: true,
      });
    });
  });
});
