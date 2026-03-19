import React from 'react';
import { render } from '@testing-library/react';
import { useTransactionMetadataRequestOptional } from '../../hooks/useTransactionMetadataRequest';
import { useSignatureRequestOptional } from '../../hooks/useSignatureRequest';
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

jest.mock('../../hooks/useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequestOptional: jest.fn(() => ({
    id: 'testTransactionId',
  })),
}));

jest.mock('../../hooks/useSignatureRequest', () => ({
  useSignatureRequestOptional: jest.fn(() => undefined),
}));

describe('BalanceChangeList', () => {
  const useTransactionMetadataRequestOptionalMock = jest.mocked(
    useTransactionMetadataRequestOptional,
  );
  const useSignatureRequestOptionalMock = jest.mocked(
    useSignatureRequestOptional,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    useTransactionMetadataRequestOptionalMock.mockReturnValue({
      id: 'testTransactionId',
    } as ReturnType<typeof useTransactionMetadataRequestOptional>);
    useSignatureRequestOptionalMock.mockReturnValue(undefined);
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
