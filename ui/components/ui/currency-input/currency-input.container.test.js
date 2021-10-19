// eslint-disable-next-line import/unambiguous
let mapStateToProps, mergeProps;

jest.mock('react-redux', () => ({
  connect: (ms, _, mp) => {
    mapStateToProps = ms;
    mergeProps = mp;
    return () => ({});
  },
}));

require('./currency-input.container.js');

describe('CurrencyInput container', () => {
  describe('mapStateToProps()', () => {
    const tests = [
      // Test # 1
      {
        comment: 'should return correct props in mainnet',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
              chainId: '0x1',
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          hideFiat: false,
        },
      },
      // Test # 2
      {
        comment:
          'should return correct props when not in mainnet and showFiatInTestnets is false',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'rinkeby',
              chainId: '0x4',
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          hideFiat: true,
        },
      },
      // Test # 3
      {
        comment:
          'should return correct props when not in mainnet and showFiatInTestnets is true',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
            preferences: {
              showFiatInTestnets: true,
            },
            provider: {
              type: 'rinkeby',
              chainId: '0x4',
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          hideFiat: false,
        },
      },
      // Test # 4
      {
        comment:
          'should return correct props when in mainnet and showFiatInTestnets is true',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'mainnet',
              chainId: '0x1',
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          hideFiat: false,
        },
      },
      {
        comment:
          'should return correct props when on custom network (not mainnet or known testnet) and showFiatInTestnets is false',
        mockState: {
          metamask: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'BSC',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'custom',
              chainId: '0x38',
            },
          },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'BSC',
          hideFiat: false,
        },
      },
      {
        comment:
          'should return correct props when on custom network (not mainnet or known testnet) and showFiatInTestnets is false and conversionRate is null',
        mockState: {
          metamask: {
            conversionRate: null,
            currentCurrency: 'usd',
            nativeCurrency: 'BSC',
            preferences: {
              showFiatInTestnets: false,
            },
            provider: {
              type: 'custom',
              chainId: '0x38',
            },
          },
        },
        expected: {
          conversionRate: null,
          currentCurrency: 'usd',
          nativeCurrency: 'BSC',
          hideFiat: true,
        },
      },
    ];

    tests.forEach(({ mockState, expected, comment }) => {
      it(`${comment}`, () => {
        expect(mapStateToProps(mockState)).toStrictEqual(expected);
      });
    });
  });

  describe('mergeProps()', () => {
    const tests = [
      // Test # 1
      {
        comment: 'should return the correct props',
        mock: {
          stateProps: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
          },
          dispatchProps: {},
          ownProps: {},
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          // useFiat: true,
          nativeSuffix: 'ETH',
          fiatSuffix: 'USD',
        },
      },
      // Test # 1
      {
        comment: 'should return the correct props when useFiat is true',
        mock: {
          stateProps: {
            conversionRate: 280.45,
            currentCurrency: 'usd',
            nativeCurrency: 'ETH',
          },
          dispatchProps: {},
          ownProps: { useFiat: true },
        },
        expected: {
          conversionRate: 280.45,
          currentCurrency: 'usd',
          nativeCurrency: 'ETH',
          useFiat: true,
          nativeSuffix: 'ETH',
          fiatSuffix: 'USD',
        },
      },
    ];

    tests.forEach(
      ({
        mock: { stateProps, dispatchProps, ownProps },
        expected,
        comment,
      }) => {
        it(`${comment}`, () => {
          expect(mergeProps(stateProps, dispatchProps, ownProps)).toStrictEqual(
            expected,
          );
        });
      },
    );
  });
});
