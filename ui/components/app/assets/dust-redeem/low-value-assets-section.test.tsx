import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import type { TokenWithFiatAmount } from '../types';
import { DUST_REDEEM_CTA_TEST_ID } from './dust-redeem-cta';
import { LowValueAssetsSection } from './low-value-assets-section';

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

describe('LowValueAssetsSection', () => {
  const renderSection = (
    props: Partial<React.ComponentProps<typeof LowValueAssetsSection>> = {},
  ) => {
    const onToggle = jest.fn();
    const onRedeemClick = jest.fn();
    const view = renderWithProvider(
      <LowValueAssetsSection
        count={2}
        isExpanded={false}
        onToggle={onToggle}
        onRedeemClick={onRedeemClick}
        privacyMode={false}
        tokens={[
          createToken(
            'USDC',
            0.5,
            '0x0000000000000000000000000000000000000001',
          ),
          createToken(
            'DUST',
            0.25,
            '0x0000000000000000000000000000000000000002',
          ),
        ]}
        {...props}
      />,
      configureStore({
        metamask: mockState.metamask,
      }),
    );

    return { ...view, onToggle, onRedeemClick };
  };

  it('shows the redeem amount for the low balance tokens', () => {
    const { getByTestId } = renderSection();

    expect(getByTestId(DUST_REDEEM_CTA_TEST_ID)).toHaveTextContent(
      'Redeem for $0.75 mUSD',
    );
  });

  it('opens redeem without expanding the section', () => {
    const { getByTestId, onRedeemClick, onToggle } = renderSection();

    fireEvent.click(getByTestId(DUST_REDEEM_CTA_TEST_ID));

    expect(onRedeemClick).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('still expands the section from the low balance label', () => {
    const { getByTestId, onToggle, onRedeemClick } = renderSection();

    fireEvent.click(getByTestId('low-value-assets-toggle'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onRedeemClick).not.toHaveBeenCalled();
  });

  it('masks the redeem amount in privacy mode', () => {
    const { getByTestId } = renderSection({ privacyMode: true });

    expect(getByTestId(DUST_REDEEM_CTA_TEST_ID)).toHaveTextContent(
      'Redeem for •••••• mUSD',
    );
    expect(getByTestId(DUST_REDEEM_CTA_TEST_ID)).not.toHaveTextContent('$0.75');
  });
});
