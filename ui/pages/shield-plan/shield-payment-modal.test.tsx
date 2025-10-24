import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { PAYMENT_TYPES } from '@metamask/subscription-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { AssetType } from '../../../shared/constants/transaction';
import { TokenWithApprovalAmount } from '../../hooks/subscription/useSubscriptionPricing';
import { ShieldPaymentModal } from './shield-payment-modal';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  selectedPaymentMethod: PAYMENT_TYPES.byCrypto,
  setSelectedPaymentMethod: jest.fn(),
  selectedToken: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'USDC',
    image:
      'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
    type: AssetType.token,
    chainId: '0x1',
    balance: '100',
    string: '100',
    decimals: 18,
    approvalAmount: {
      approveAmount: '100',
      chainId: '0x1',
      paymentAddress: '0x0000000000000000000000000000000000000001',
      paymentTokenAddress: '0x0000000000000000000000000000000000000002',
    },
  } as TokenWithApprovalAmount,
  onAssetChange: jest.fn(),
};

const mockAvailableTokenBalances = [
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'USDC',
    image:
      'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
    type: AssetType.token,
    chainId: '0x1',
    balance: '100',
    string: '100',
    decimals: 18,
    approvalAmount: {
      approveAmount: '100',
      chainId: '0x1',
      paymentAddress: '0x0000000000000000000000000000000000000001',
      paymentTokenAddress: '0x0000000000000000000000000000000000000002',
    },
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'USDT',
    image:
      'https://assets.coingecko.com/coins/images/325/large/Tether.png?1598003707',
    type: AssetType.token,
    chainId: '0x1',
    balance: '100',
    string: '100',
    decimals: 18,
    approvalAmount: {
      approveAmount: '100',
      chainId: '0x1',
      paymentAddress: '0x0000000000000000000000000000000000000001',
      paymentTokenAddress: '0x0000000000000000000000000000000000000002',
    },
  },
] as TokenWithApprovalAmount[];

describe('Change payment method', () => {
  const onCloseStub = jest.fn();
  const setSelectedPaymentMethodStub = jest.fn();

  it('should show change payment method modal', async () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByTestId } = renderWithProvider(
      <ShieldPaymentModal
        {...defaultProps}
        hasStableTokenWithBalance={true}
        availableTokenBalances={[]}
        tokensSupported={['USDC', 'USDT', 'mUSD']}
      />,
      mockStore,
    );

    expect(getByTestId('shield-payment-modal')).toBeInTheDocument();
  });

  it('should show asset picker modal when token payment method is selected', async () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByTestId } = renderWithProvider(
      <ShieldPaymentModal
        {...defaultProps}
        onClose={onCloseStub}
        hasStableTokenWithBalance={true}
        availableTokenBalances={mockAvailableTokenBalances}
        tokensSupported={['USDC', 'USDT', 'mUSD']}
      />,
      mockStore,
    );

    const tokenButton = getByTestId('shield-payment-method-token-button');
    fireEvent.click(tokenButton);

    expect(getByTestId('asset-picker-modal')).toBeInTheDocument();

    expect(onCloseStub).not.toHaveBeenCalled();
  });

  it('should set card payment method when card payment method is selected', async () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByTestId } = renderWithProvider(
      <ShieldPaymentModal
        {...defaultProps}
        onClose={onCloseStub}
        setSelectedPaymentMethod={setSelectedPaymentMethodStub}
        hasStableTokenWithBalance={true}
        availableTokenBalances={[]}
        tokensSupported={['USDC', 'USDT', 'mUSD']}
      />,
      mockStore,
    );

    const cardButton = getByTestId('shield-payment-method-card-button');
    fireEvent.click(cardButton);

    expect(setSelectedPaymentMethodStub).toHaveBeenCalledWith(
      PAYMENT_TYPES.byCard,
    );
    expect(onCloseStub).toHaveBeenCalled();
  });
});
