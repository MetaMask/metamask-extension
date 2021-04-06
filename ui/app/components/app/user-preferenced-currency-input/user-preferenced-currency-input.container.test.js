import assert from 'assert';
import proxyquire from 'proxyquire';

let mapStateToProps;

proxyquire('./user-preferenced-currency-input.container.js', {
  'react-redux': {
    connect: (ms) => {
      mapStateToProps = ms;
      return () => ({});
    },
  },
});

describe('UserPreferencedCurrencyInput container', function () {
  describe('mapStateToProps()', function () {
    it('should return the correct props', function () {
      const mockState = {
        metamask: {
          preferences: {
            useNativeCurrencyAsPrimaryCurrency: true,
          },
        },
      };

      assert.deepStrictEqual(mapStateToProps(mockState), {
        useNativeCurrencyAsPrimaryCurrency: true,
      });
    });
  });
});
