import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import type { TokenWithFiatAmount } from '../types';
import {
  DUST_REDEEM_BALANCE_FILTER_TEST_ID,
  DUST_REDEEM_CONFIRM_TEST_ID,
  DUST_REDEEM_INCLUDE_GAS_TEST_ID,
  DUST_REDEEM_MODAL_TEST_ID,
  DUST_REDEEM_SELECT_ALL_TEST_ID,
  DustRedeemModal,
} from './dust-redeem-modal';

const createToken = (
  symbol: string,
  tokenFiatAmount: number,
  address: string,
): TokenWithFiatAmount =>
  ({
    chainId: '0x1',
    address,
    symbol,
    title: symbol,
    decimals: 18,
    image: '',
    balance: '1',
    secondary: null,
    tokenFiatAmount,
  }) as TokenWithFiatAmount;

const tokens = [
  createToken('USDC', 0.5, '0x0000000000000000000000000000000000000001'),
  createToken('DUST', 0.25, '0x0000000000000000000000000000000000000002'),
  createToken('MID', 3, '0x0000000000000000000000000000000000000003'),
  createToken('HIGH', 8, '0x0000000000000000000000000000000000000004'),
  createToken('BIG', 20, '0x0000000000000000000000000000000000000005'),
  {
    ...createToken('ETH', 3, '0x0000000000000000000000000000000000000000'),
    isNative: true,
    chainId: '0xa4b1',
  } as TokenWithFiatAmount,
];

describe('DustRedeemModal', () => {
  const renderModal = (privacyMode = false) => {
    const onClose = jest.fn();
    const view = renderWithProvider(
      <DustRedeemModal
        isOpen
        tokens={tokens}
        privacyMode={privacyMode}
        onClose={onClose}
      />,
      configureStore({
        metamask: mockState.metamask,
      }),
    );

    return { ...view, onClose };
  };

  it('starts with every token under $1 selected', () => {
    const { getByTestId, queryByTestId } = renderModal();

    expect(getByTestId(DUST_REDEEM_MODAL_TEST_ID)).toBeInTheDocument();
    expect(getByTestId(DUST_REDEEM_MODAL_TEST_ID)).toHaveTextContent(
      'Consolidate your dust into mUSD',
    );
    expect(getByTestId('dust-redeem-network-USDC')).toBeInTheDocument();
    expect(getByTestId('dust-redeem-network-DUST')).toBeInTheDocument();
    expect(getByTestId(DUST_REDEEM_BALANCE_FILTER_TEST_ID)).toHaveValue('1');
    expect(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID)).toHaveTextContent(
      'Redeem for $0.75 mUSD',
    );
    expect(getByTestId(DUST_REDEEM_SELECT_ALL_TEST_ID)).toBeChecked();
    expect(queryByTestId('dust-redeem-token-MID')).not.toBeInTheDocument();
  });

  it('widens the token list when the balance ceiling changes', () => {
    const { getByTestId, queryByTestId } = renderModal();
    const filter = getByTestId(DUST_REDEEM_BALANCE_FILTER_TEST_ID);

    fireEvent.change(filter, { target: { value: '5' } });

    expect(getByTestId('dust-redeem-token-MID')).toBeInTheDocument();
    expect(queryByTestId('dust-redeem-token-HIGH')).not.toBeInTheDocument();
    expect(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID)).toHaveTextContent(
      'Redeem for $3.75 mUSD',
    );

    fireEvent.change(filter, { target: { value: '10' } });

    expect(getByTestId('dust-redeem-token-HIGH')).toBeInTheDocument();
    expect(queryByTestId('dust-redeem-token-BIG')).not.toBeInTheDocument();
    expect(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID)).toHaveTextContent(
      'Redeem for $11.75 mUSD',
    );
    expect(queryByTestId('dust-redeem-token-ETH')).not.toBeInTheDocument();
  });

  it('includes EVM gas tokens under the ceiling when requested', () => {
    const { getByTestId, queryByTestId } = renderModal();

    fireEvent.change(getByTestId(DUST_REDEEM_BALANCE_FILTER_TEST_ID), {
      target: { value: '5' },
    });
    expect(queryByTestId('dust-redeem-token-ETH')).not.toBeInTheDocument();
    expect(getByTestId(DUST_REDEEM_INCLUDE_GAS_TEST_ID)).toHaveTextContent(
      'Include gas tokens',
    );

    fireEvent.click(getByTestId(DUST_REDEEM_INCLUDE_GAS_TEST_ID));

    expect(getByTestId(DUST_REDEEM_INCLUDE_GAS_TEST_ID)).toHaveTextContent(
      'Exclude gas tokens',
    );
    expect(getByTestId('dust-redeem-token-ETH')).toBeInTheDocument();
    expect(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID)).toHaveTextContent(
      'Redeem for $6.75 mUSD',
    );
  });

  it('updates the redeem amount as tokens are selected', () => {
    const { getByTestId } = renderModal();

    fireEvent.click(getByTestId('dust-redeem-token-DUST'));

    expect(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID)).toHaveTextContent(
      'Redeem for $0.50 mUSD',
    );
    expect(getByTestId(DUST_REDEEM_SELECT_ALL_TEST_ID)).not.toBeChecked();

    fireEvent.click(getByTestId('dust-redeem-token-USDC'));

    expect(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID)).toBeDisabled();

    fireEvent.click(getByTestId(DUST_REDEEM_SELECT_ALL_TEST_ID));

    expect(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID)).toHaveTextContent(
      'Redeem for $0.75 mUSD',
    );
  });

  it('closes without submitting when redeem is confirmed', () => {
    const { getByTestId, onClose } = renderModal();

    fireEvent.click(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('masks amounts in privacy mode', () => {
    const { getByTestId, queryByText } = renderModal(true);

    expect(getByTestId(DUST_REDEEM_CONFIRM_TEST_ID)).toHaveTextContent(
      'Redeem for •••••• mUSD',
    );
    expect(queryByText('$0.50')).not.toBeInTheDocument();
    expect(queryByText('$0.25')).not.toBeInTheDocument();
  });
});
