import React from 'react';
import { act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  FeatureId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { MetaMetricsSwapsEventSource } from '../../../../shared/constants/metametrics';
import { BridgeQueryParams } from '../../../../shared/lib/deep-links/routes/swap';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import configureStore from '../../../store/store';
import * as bridgeActions from '../../../ducks/bridge/actions';
import { SwapAgainButton } from './swap-again-button';

const mockNavigateToBridgePage = jest.fn();

jest.mock('../../../hooks/bridge/useBridgeNavigation', () => ({
  useBridgeNavigation: () => ({
    navigateToBridgePage: mockNavigateToBridgePage,
  }),
}));

jest.mock('../../../components/ui/transition', () => ({
  transitionForward: (callback: () => void) => {
    callback();
  },
}));

const mockDispatch = jest.fn((...args: unknown[]) => jest.fn()(...args));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const ethMainnetNative: TokenAmount = {
  assetId: 'eip155:1/slip44:60',
  symbol: 'ETH',
  direction: 'out',
};

const usdcMainnet: TokenAmount = {
  assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  direction: 'in',
};

const usdcOptimism: TokenAmount = {
  assetId: 'eip155:10/erc20:0x0b2c639c533813ac4d8e6d604837f9d2794ec634',
  symbol: 'USDC',
  direction: 'in',
};

const renderSwapAgainButton = (
  sourceToken: TokenAmount | undefined,
  destinationToken: TokenAmount | undefined,
) =>
  renderWithProvider(
    <SwapAgainButton
      sourceToken={sourceToken}
      destinationToken={destinationToken}
    />,
    configureStore(createBridgeMockStore({})),
  );

describe('SwapAgainButton', () => {
  let trackUnifiedSwapBridgeEventSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    trackUnifiedSwapBridgeEventSpy = jest
      .spyOn(bridgeActions, 'trackUnifiedSwapBridgeEvent')
      .mockImplementation((...args: unknown[]) => jest.fn()(...args));
  });

  afterEach(() => {
    trackUnifiedSwapBridgeEventSpy.mockRestore();
  });

  it('renders nothing when source token asset id is missing', () => {
    const { container } = renderSwapAgainButton(
      { ...ethMainnetNative, assetId: undefined },
      usdcMainnet,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when destination token asset id is missing', () => {
    const { container } = renderSwapAgainButton(ethMainnetNative, {
      ...usdcMainnet,
      assetId: undefined,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders swap again label for same-chain tokens', () => {
    const { getByRole } = renderSwapAgainButton(ethMainnetNative, usdcMainnet);

    expect(getByRole('button')).toHaveTextContent(messages.swapAgain.message);
  });

  it('renders bridge again label for cross-chain tokens', () => {
    const { getByRole } = renderSwapAgainButton(ethMainnetNative, usdcOptimism);

    expect(getByRole('button')).toHaveTextContent(messages.bridgeAgain.message);
  });

  it('tracks button click and navigates to swap flow', async () => {
    const { getByRole } = renderSwapAgainButton(ethMainnetNative, usdcMainnet);

    await act(async () => {
      await userEvent.click(getByRole('button'));
    });

    expect(trackUnifiedSwapBridgeEventSpy).toHaveBeenCalledWith(
      UnifiedSwapBridgeEventName.ButtonClicked,
      {
        location: MetaMetricsSwapsEventSource.ActivityDetails,
        /* eslint-disable @typescript-eslint/naming-convention */
        token_symbol_source: 'ETH',
        token_symbol_destination: 'USDC',
        feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    );
    const expectedSearchParams = new URLSearchParams();
    expectedSearchParams.set(
      BridgeQueryParams.From,
      ethMainnetNative.assetId as string,
    );
    expectedSearchParams.set(
      BridgeQueryParams.To,
      usdcMainnet.assetId as string,
    );

    expect(mockNavigateToBridgePage).toHaveBeenCalledWith({
      token: null,
      search: expectedSearchParams,
      isEntrypoint: true,
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
