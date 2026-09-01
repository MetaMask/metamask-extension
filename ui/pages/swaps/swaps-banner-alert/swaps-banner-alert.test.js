import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createSwapsMockStore } from '../../../../test/jest';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  OFFLINE_FOR_MAINTENANCE,
  SLIPPAGE_VERY_HIGH_ERROR,
  SLIPPAGE_HIGH_ERROR,
  SLIPPAGE_LOW_ERROR,
  SLIPPAGE_NEGATIVE_ERROR,
} from '../../../../shared/constants/swaps';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import SwapsBannerAlert from './swaps-banner-alert';

const middleware = [thunk];

describe('SwapsBannerAlert', () => {
  it('renders the component with the SLIPPAGE_VERY_HIGH_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert
        swapsErrorKey={SLIPPAGE_VERY_HIGH_ERROR}
        currentSlippage={16}
      />,
      store,
    );
    expect(
      getByText(messages.swapSlippageOverLimitTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapSlippageOverLimitDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.swapAdjustSlippage.message)).toBeInTheDocument();
  });

  it('renders the component with the SLIPPAGE_HIGH_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert
        swapsErrorKey={SLIPPAGE_HIGH_ERROR}
        currentSlippage={5}
      />,
      store,
    );
    expect(
      getByText(messages.swapSlippageHighTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(
        messages.swapSlippageHighDescription.message.replace('$1', '5'),
      ),
    ).toBeInTheDocument();
  });

  it('renders the component with the SLIPPAGE_HIGH_ERROR with the "Adjust slippage" link', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert
        swapsErrorKey={SLIPPAGE_HIGH_ERROR}
        showTransactionSettingsLink
        currentSlippage={10}
      />,
      store,
    );
    expect(
      getByText(messages.swapSlippageHighTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(
        messages.swapSlippageHighDescription.message.replace('$1', '10'),
      ),
    ).toBeInTheDocument();
    expect(getByText(messages.swapAdjustSlippage.message)).toBeInTheDocument();
  });

  it('renders the component with the SLIPPAGE_LOW_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert
        swapsErrorKey={SLIPPAGE_LOW_ERROR}
        currentSlippage={1}
      />,
      store,
    );
    expect(
      getByText(messages.swapSlippageLowTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapSlippageLowDescription.message.replace('$1', '1')),
    ).toBeInTheDocument();
  });

  it('renders the component with the SLIPPAGE_LOW_ERROR with the "Adjust slippage" link', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert
        swapsErrorKey={SLIPPAGE_LOW_ERROR}
        showTransactionSettingsLink
        currentSlippage={1}
      />,
      store,
    );
    expect(
      getByText(messages.swapSlippageLowTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapSlippageLowDescription.message.replace('$1', '1')),
    ).toBeInTheDocument();
    expect(getByText(messages.swapAdjustSlippage.message)).toBeInTheDocument();
  });

  it('renders the component with the SLIPPAGE_NEGATIVE_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert swapsErrorKey={SLIPPAGE_NEGATIVE_ERROR} />,
      store,
    );
    expect(
      getByText(messages.swapSlippageNegativeTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapSlippageNegativeDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.swapAdjustSlippage.message)).toBeInTheDocument();
  });

  it('renders the component with the QUOTES_NOT_AVAILABLE_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert swapsErrorKey={QUOTES_NOT_AVAILABLE_ERROR} />,
      store,
    );
    expect(
      getByText(messages.swapQuotesNotAvailableErrorTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapQuotesNotAvailableDescription.message),
    ).toBeInTheDocument();
    expect(getByText(messages.swapLearnMore.message)).toBeInTheDocument();
  });

  it('renders the component with the ERROR_FETCHING_QUOTES', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert swapsErrorKey={ERROR_FETCHING_QUOTES} />,
      store,
    );
    expect(
      getByText(messages.swapFetchingQuotesErrorTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapFetchingQuotesErrorDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the component with the CONTRACT_DATA_DISABLED_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert swapsErrorKey={CONTRACT_DATA_DISABLED_ERROR} />,
      store,
    );
    expect(
      getByText(messages.swapContractDataDisabledErrorTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapContractDataDisabledErrorDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the component with the QUOTES_EXPIRED_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert swapsErrorKey={QUOTES_EXPIRED_ERROR} />,
      store,
    );
    expect(
      getByText(messages.swapQuotesExpiredErrorTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.swapQuotesExpiredErrorDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the component with the OFFLINE_FOR_MAINTENANCE', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert swapsErrorKey={OFFLINE_FOR_MAINTENANCE} />,
      store,
    );
    expect(
      getByText(messages.offlineForMaintenance.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.metamaskSwapsOfflineDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the component with the SWAP_FAILED_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <SwapsBannerAlert swapsErrorKey={SWAP_FAILED_ERROR} />,
      store,
    );
    expect(
      getByText(messages.swapFailedErrorTitle.message),
    ).toBeInTheDocument();
  });
});
