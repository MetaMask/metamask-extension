import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { AssetType } from '../../../shared/constants/transaction';
import {
  AssetWithDisplayData,
  ERC20Asset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { AssetPickerModal } from '../../components/multichain/asset-picker-amount/asset-picker-modal';
import { PAYMENT_METHODS } from './types';
import { ShieldPaymentModal } from './shield-payment-modal';

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  selectedPaymentMethod: PAYMENT_METHODS.TOKEN,
  setSelectedPaymentMethod: jest.fn(),
  selectedToken: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'USDC',
    image:
      'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
    type: AssetType.token,
    chainId: '0x1',
  } as unknown as AssetWithDisplayData<ERC20Asset>,
  onAssetChange: jest.fn(),
  paymentTokens: [
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'USDC',
      image:
        'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
      type: AssetType.token,
      chainId: '0x1',
    },
    {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'USDT',
      image:
        'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194',
      type: AssetType.token,
      chainId: '0x1',
    },
  ] as unknown as (keyof typeof AssetPickerModal)['customTokenListGenerator'],
};

describe('Change payment method', () => {
  const onCloseStub = jest.fn();
  const setSelectedPaymentMethodStub = jest.fn();

  it('should show change payment method modal', async () => {
    const mockStore = configureMockStore([])(mockState);
    const { getByTestId } = renderWithProvider(
      <ShieldPaymentModal {...defaultProps} hasStableTokenWithBalance={true} />,
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
      />,
      mockStore,
    );

    const cardButton = getByTestId('shield-payment-method-card-button');
    fireEvent.click(cardButton);

    expect(setSelectedPaymentMethodStub).toHaveBeenCalledWith(
      PAYMENT_METHODS.CARD,
    );
    expect(onCloseStub).toHaveBeenCalled();
  });
});
