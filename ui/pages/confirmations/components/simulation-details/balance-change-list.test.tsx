import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { BalanceChangeList } from './balance-change-list';
import { BalanceChangeRow } from './balance-change-row';
import { TotalFiatDisplay } from './fiat-display';
import { BalanceChange } from './types';
import { sortBalanceChanges } from './sortBalanceChanges';

const HEADING_MOCK = 'Mock Heading';

jest.mock('./balance-change-row', () => ({
  BalanceChangeRow: jest.fn(() => null),
}));

jest.mock('./fiat-display', () => ({
  TotalFiatDisplay: jest.fn(() => null),
}));

jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(() => ({
    currentConfirmation: {
      id: 'testTransactionId',
    },
  })),
}));

describe('BalanceChangeList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when there are no balance changes', () => {
    const { container } = render(
      <BalanceChangeList heading={HEADING_MOCK} balanceChanges={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  describe('multiple balance changes', () => {
    const balanceChanges = [
      { asset: { address: '0x123' }, fiatAmount: 100 },
      { asset: { address: '0x456' }, fiatAmount: 200 },
    ] as unknown as BalanceChange[];

    it('renders BalanceChangeRow components without fiat', () => {
      render(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={balanceChanges}
        />,
      );

      expect(BalanceChangeRow).toHaveBeenCalledTimes(balanceChanges.length);

      sortBalanceChanges(balanceChanges).forEach((balanceChange, index) => {
        expect(BalanceChangeRow).toHaveBeenCalledWith(
          expect.objectContaining({
            label: index === 0 ? HEADING_MOCK : undefined,
            balanceChange,
            showFiat: false,
          }),
          {},
        );
      });
    });

    it('renders TotalFiatDisplay component', () => {
      render(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={balanceChanges}
        />,
      );

      expect(TotalFiatDisplay).toHaveBeenCalledWith(
        expect.objectContaining({ fiatAmounts: [200, 100] }),
        {},
      );
    });

    it('does not render TotalFiatDisplay when there is an unlimited approval in balance changes', () => {
      const balanceChangesWithUnlimitedApproval = [
        { asset: { address: '0x123' }, fiatAmount: 100 },
        {
          asset: { address: '0x456' },
          fiatAmount: 200,
          isUnlimitedApproval: true,
        },
      ] as unknown as BalanceChange[];

      render(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={balanceChangesWithUnlimitedApproval}
        />,
      );

      expect(TotalFiatDisplay).not.toHaveBeenCalled();

      expect(BalanceChangeRow).toHaveBeenCalledTimes(
        balanceChangesWithUnlimitedApproval.length,
      );
      expect(BalanceChangeRow).toHaveBeenCalledWith(
        expect.objectContaining({
          balanceChange: expect.objectContaining({ isUnlimitedApproval: true }),
          showFiat: false,
        }),
        {},
      );
    });
  });

  describe('when balance changes update', () => {
    const tokenA = {
      asset: { chainId: '0x1', standard: 'ERC20', address: '0xaaa' },
      fiatAmount: 100,
    } as unknown as BalanceChange;
    const tokenB = {
      asset: { chainId: '0x1', standard: 'ERC20', address: '0xbbb' },
      fiatAmount: 50,
    } as unknown as BalanceChange;
    const tokenC = {
      asset: { chainId: '0x1', standard: 'ERC20', address: '0xccc' },
      fiatAmount: 500,
    } as unknown as BalanceChange;

    beforeEach(() => {
      // Renders the address seen at mount next to the current one, so a row
      // that React reused for a different asset shows a mismatch.
      jest.mocked(BalanceChangeRow).mockImplementation(({ balanceChange }) => {
        const [mountedAddress] = useState(balanceChange.asset.address);
        return (
          <div data-testid="balance-change-row">
            {`${mountedAddress}:${balanceChange.asset.address}`}
          </div>
        );
      });
    });

    afterEach(() => {
      jest.mocked(BalanceChangeRow).mockImplementation(() => <></>);
    });

    const getRowTexts = () =>
      screen.getAllByTestId('balance-change-row').map((row) => row.textContent);

    it('keeps each row with its asset when the sort order changes', () => {
      const { rerender } = render(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={[tokenA, tokenB]}
        />,
      );
      expect(getRowTexts()).toStrictEqual(['0xaaa:0xaaa', '0xbbb:0xbbb']);

      rerender(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={[tokenA, { ...tokenB, fiatAmount: 200 }]}
        />,
      );

      expect(getRowTexts()).toStrictEqual(['0xbbb:0xbbb', '0xaaa:0xaaa']);
    });

    it('keeps each row with its asset when a balance change is inserted', () => {
      const { rerender } = render(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={[tokenA, tokenB]}
        />,
      );

      rerender(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={[tokenA, tokenB, tokenC]}
        />,
      );

      expect(getRowTexts()).toStrictEqual([
        '0xccc:0xccc',
        '0xaaa:0xaaa',
        '0xbbb:0xbbb',
      ]);
    });
  });

  describe('single balance change', () => {
    const balanceChanges = [
      { asset: { address: '0x123' } },
    ] as unknown as BalanceChange[];

    it('renders BalanceChangeRow components with fiat', () => {
      render(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={balanceChanges}
        />,
      );

      expect(BalanceChangeRow).toHaveBeenCalledTimes(balanceChanges.length);

      balanceChanges.forEach((balanceChange) => {
        expect(BalanceChangeRow).toHaveBeenCalledWith(
          expect.objectContaining({
            label: HEADING_MOCK,
            balanceChange,
            showFiat: true,
          }),
          {},
        );
      });
    });

    it('does not render TotalFiatDisplay component when there is only one balance change', () => {
      render(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={balanceChanges}
        />,
      );

      expect(TotalFiatDisplay).not.toHaveBeenCalled();
    });

    it('does not show fiat when balance change has unlimited approval', () => {
      const balanceChangeWithUnlimitedApproval = [
        { asset: { address: '0x123' }, isUnlimitedApproval: true },
      ] as unknown as BalanceChange[];

      render(
        <BalanceChangeList
          heading={HEADING_MOCK}
          balanceChanges={balanceChangeWithUnlimitedApproval}
        />,
      );

      expect(BalanceChangeRow).toHaveBeenCalledWith(
        expect.objectContaining({
          label: HEADING_MOCK,
          balanceChange: expect.objectContaining({ isUnlimitedApproval: true }),
          showFiat: false,
        }),
        {},
      );
    });
  });
});
