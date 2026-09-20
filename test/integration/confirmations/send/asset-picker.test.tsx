import { screen } from '@testing-library/react';
import * as backgroundConnection from '../../../../ui/store/background-connection';
import { integrationTestRender } from '../../../lib/render-helpers';
import mockMetaMaskState from '../../data/integration-init-state.json';
import { createMockImplementation } from '../../helpers';

jest.mock('../../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

describe('Send asset picker', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.location.hash = '#/send/asset';
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
      createMockImplementation({}),
    );
  });

  it('hides Sepolia fiat prices when testnet fiat is disabled', async () => {
    await integrationTestRender({
      preloadedState: {
        ...mockMetaMaskState,
        currencyRates: {
          ...mockMetaMaskState.currencyRates,
          SepoliaETH: {
            conversionRate: 1000,
          },
        },
        preferences: {
          ...mockMetaMaskState.preferences,
          showFiatInTestnets: false,
        },
      },
      backgroundConnection: {
        onNotification: jest.fn(),
      },
    });

    const sepoliaAsset = await screen.findByTestId(
      'token-asset-0xaa36a7-SepoliaETH',
    );

    expect(sepoliaAsset).toHaveTextContent('SepoliaETH');
    expect(sepoliaAsset).not.toHaveTextContent(/\$/u);
  });
});
