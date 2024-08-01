import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSelectedInternalAccount } from '../../../selectors';
import {
  getCurrentDraftTransaction,
  getIsNativeSendPossible,
  getSendMaxModeState,
} from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import { AssetPickerAmount } from './asset-picker-amount';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('./max-clear-button', () => jest.fn(() => <div>MaxClearButton</div>));
jest.mock('./asset-picker/asset-picker', () => ({
  AssetPicker: jest.fn(() => <div>AssetPicker</div>),
}));
jest.mock('./swappable-currency-input/swappable-currency-input', () => ({
  SwappableCurrencyInput: jest.fn(() => <div>SwappableCurrencyInput</div>),
}));
jest.mock('./asset-balance/asset-balance', () => ({
  AssetBalance: jest.fn(() => <div>AssetBalance</div>),
}));

describe('AssetPickerAmount', () => {
  const useSelectorMock = useSelector as jest.Mock;
  const useI18nContextMock = useI18nContext as jest.Mock;

  const onAmountChangeMock = jest.fn();

  const defaultProps = {
    header: 'testHeader',
    asset: {
      type: AssetType.token,
      details: { address: '0xToken', symbol: 'TOKEN', decimals: 18 },
      balance: '0',
    },
    amount: { value: '100' },
    onAmountChange: onAmountChangeMock,
    isAmountLoading: false,
    onAssetChange: jest.fn(),
  };

  beforeEach(() => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getSelectedInternalAccount) {
        return { address: '0xAddress' };
      }
      if (selector === getCurrentDraftTransaction) {
        return {
          swapQuotesError: null,
          sendAsset: { type: AssetType.token },
          receiveAsset: { type: AssetType.token },
        };
      }
      if (selector === getIsNativeSendPossible) {
        return true;
      }
      if (selector === getSendMaxModeState) {
        return false;
      }
      return undefined;
    });

    useI18nContextMock.mockReturnValue((key: string) => key);
    onAmountChangeMock.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders AssetPickerAmount with correct components', () => {
    render(<AssetPickerAmount {...defaultProps} />);

    expect(screen.getByText('AssetPicker')).toBeInTheDocument();
    expect(screen.getByText('SwappableCurrencyInput')).toBeInTheDocument();
    expect(screen.getByText('AssetBalance')).toBeInTheDocument();
    expect(screen.getByText('MaxClearButton')).toBeInTheDocument();
  });

  it('renders AssetPickerAmount does not show max button when srcAsset type is native and destAsset type is ERC20', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getSelectedInternalAccount) {
        return { address: '0xAddress' };
      }
      if (selector === getCurrentDraftTransaction) {
        return {
          swapQuotesError: null,
          sendAsset: { type: AssetType.native },
          receiveAsset: { type: AssetType.token },
        };
      }
      if (selector === getIsNativeSendPossible) {
        return true;
      }
      if (selector === getSendMaxModeState) {
        return false;
      }
      return undefined;
    });
    render(<AssetPickerAmount {...defaultProps} />);

    expect(screen.getByText('AssetPicker')).toBeInTheDocument();
    expect(screen.getByText('SwappableCurrencyInput')).toBeInTheDocument();
    expect(screen.getByText('AssetBalance')).toBeInTheDocument();
    expect(screen.queryByText('MaxClearButton')).toBeNull();
  });

  it('renders AssetPickerAmount does shows max button when srcAsset type is ERC20 and destAsset type is native', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getSelectedInternalAccount) {
        return { address: '0xAddress' };
      }
      if (selector === getCurrentDraftTransaction) {
        return {
          swapQuotesError: null,
          sendAsset: { type: AssetType.token },
          receiveAsset: { type: AssetType.native },
        };
      }
      if (selector === getIsNativeSendPossible) {
        return true;
      }
      if (selector === getSendMaxModeState) {
        return false;
      }
      return undefined;
    });
    render(<AssetPickerAmount {...defaultProps} />);

    expect(screen.getByText('AssetPicker')).toBeInTheDocument();
    expect(screen.getByText('SwappableCurrencyInput')).toBeInTheDocument();
    expect(screen.getByText('AssetBalance')).toBeInTheDocument();
    expect(screen.getByText('MaxClearButton')).toBeInTheDocument();
  });

  it('shows swaps error message when there is an error', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getSelectedInternalAccount) {
        return { address: '0xAddress' };
      }
      if (selector === getCurrentDraftTransaction) {
        return {
          swapQuotesError: 'error',
          sendAsset: { type: AssetType.native },
          receiveAsset: { type: AssetType.token },
        };
      }
      if (selector === getIsNativeSendPossible) {
        return true;
      }
      if (selector === getSendMaxModeState) {
        return false;
      }
      return undefined;
    });

    const propsWithError = {
      ...defaultProps,
    };

    render(
      <AssetPickerAmount {...propsWithError} onAmountChange={undefined} />,
    );

    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('calls onAmountChange with "0x0" when native send is not possible and max is enabled', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getSelectedInternalAccount) {
        return { address: '0xAddress' };
      }
      if (selector === getCurrentDraftTransaction) {
        return {
          sendAsset: { type: AssetType.native },
          receiveAsset: { type: AssetType.token },
        };
      }
      if (selector === getIsNativeSendPossible) {
        return false;
      }
      if (selector === getSendMaxModeState) {
        return true;
      }
      return undefined;
    });

    render(<AssetPickerAmount {...defaultProps} />);

    expect(onAmountChangeMock).toHaveBeenCalledWith('0x0');
  });

  it('renders AssetPickerAmount without MaxClearButton when onAmountChange is not provided', () => {
    const propsWithoutOnAmountChange = {
      ...defaultProps,
      onAmountChange: undefined,
    };

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCurrentDraftTransaction) {
        return {
          sendAsset: { type: AssetType.native },
          receiveAsset: { type: AssetType.token },
        };
      }
      return undefined;
    });

    render(<AssetPickerAmount {...propsWithoutOnAmountChange} />);

    expect(screen.queryByText('MaxClearButton')).not.toBeInTheDocument();
  });
});
