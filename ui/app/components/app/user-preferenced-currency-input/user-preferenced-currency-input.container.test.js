/* eslint-disable import/unambiguous */
let mapStateToProps;

jest.mock('react-redux', () => ({
  connect: (ms) => {
    mapStateToProps = ms;
    return () => ({});
  },
}));

require('./user-preferenced-currency-input.container.js');

describe('UserPreferencedCurrencyInput container', () => {
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
