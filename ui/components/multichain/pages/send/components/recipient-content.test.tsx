import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector, useDispatch } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getCurrentDraftTransaction,
  getBestQuote,
  getSendAsset,
  getSwapsBlockedTokens,
  acknowledgeRecipientWarning,
} from '../../../../../ducks/send';
import {
  getIsSwapsChain,
  getUseExternalServices,
} from '../../../../../selectors';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { getSendHexDataFeatureFlagState } from '../../../../../ducks/metamask/metamask';
import { SendPageRecipientContent } from './recipient-content';

jest.mock('reselect', () => ({
  createSelector: jest.fn(),
}));

jest.mock('../../../../../selectors/util', () => ({
  createDeepEqualSelector: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../../../../ducks/send', () => ({
  getCurrentDraftTransaction: jest.fn(),
  getBestQuote: jest.fn(),
  getSendAsset: jest.fn(),
  getSwapsBlockedTokens: jest.fn(),
  acknowledgeRecipientWarning: jest.fn(),
}));

jest.mock('../../../../../ducks/metamask/metamask', () => ({
  getSendHexDataFeatureFlagState: jest.fn(),
}));

jest.mock('../../../../../selectors', () => ({
  getIsSwapsChain: jest.fn(),
  getUseExternalServices: jest.fn(),
}));

jest.mock('../../..', () => ({
  AssetPickerAmount: jest.fn(() => <div>AssetPickerAmount</div>),
}));

jest.mock('.', () => ({
  SendHexData: jest.fn(() => <div>SendHexData</div>),
  SendPageRow: jest.fn(({ children }) => <div>{children}</div>),
  QuoteCard: jest.fn(() => <div>QuoteCard</div>),
}));

describe('SendPageRecipientContent', () => {
  const useSelectorMock = useSelector as jest.Mock;
  const useDispatchMock = useDispatch as jest.Mock;
  const useI18nContextMock = useI18nContext as jest.Mock;

  const mockDispatch = jest.fn();

  const onAssetChangeMock = jest.fn();

  const defaultProps = {
    requireContractAddressAcknowledgement: false,
    onAssetChange: onAssetChangeMock,
    onClick: jest.fn(),
  };

  beforeEach(() => {
    useDispatchMock.mockReturnValue(mockDispatch);

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCurrentDraftTransaction) {
        return {
          receiveAsset: {
            type: AssetType.token,
            details: { address: '0xToken' },
          },
          sendAsset: { type: AssetType.token, details: { address: '0xToken' } },
          amount: { value: '100' },
          isSwapQuoteLoading: false,
        };
      }
      if (selector === getSendHexDataFeatureFlagState) {
        return false;
      }
      if (selector === getBestQuote) {
        return { destinationAmount: '200' };
      }
      if (selector === getSendAsset) {
        return { type: AssetType.token };
      }
      if (selector === getSwapsBlockedTokens) {
        return [];
      }
      if (selector === getIsSwapsChain) {
        return true;
      }
      if (selector === getUseExternalServices) {
        return true;
      }
      return undefined;
    });

    useI18nContextMock.mockReturnValue((key: string) => key);

    jest.clearAllMocks();
  });

  it('renders AssetPickerAmount with correct props', () => {
    render(<SendPageRecipientContent {...defaultProps} />);

    expect(screen.getByText('AssetPickerAmount')).toBeInTheDocument();
    expect(screen.getByText('QuoteCard')).toBeInTheDocument();
  });

  it('renders SendHexData if showHexDataFlag is true', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCurrentDraftTransaction) {
        return {
          receiveAsset: {
            type: AssetType.native,
          },
          sendAsset: { type: AssetType.native },
          amount: { value: '100' },
          isSwapQuoteLoading: false,
        };
      }
      if (selector === getSendHexDataFeatureFlagState) {
        return true;
      }
      if (selector === getBestQuote) {
        return { destinationAmount: '200' };
      }
      if (selector === getSendAsset) {
        return { type: AssetType.native };
      }
      if (selector === getSwapsBlockedTokens) {
        return [];
      }
      if (selector === getIsSwapsChain) {
        return true;
      }
      if (selector === getUseExternalServices) {
        return true;
      }
      return undefined;
    });

    render(<SendPageRecipientContent {...defaultProps} />);

    expect(screen.getByText('SendHexData')).toBeInTheDocument();
  });

  it('renders warning banner if requireContractAddressAcknowledgement is true', () => {
    render(
      <SendPageRecipientContent
        {...defaultProps}
        requireContractAddressAcknowledgement
      />,
    );

    expect(screen.getByTestId('send-warning')).toBeInTheDocument();
  });

  it('dispatches acknowledgeRecipientWarning when warning button is clicked', () => {
    render(
      <SendPageRecipientContent
        {...defaultProps}
        requireContractAddressAcknowledgement
      />,
    );

    fireEvent.click(screen.getByText('tooltipApproveButton'));
    expect(mockDispatch).toHaveBeenCalledWith(acknowledgeRecipientWarning());
  });
});
