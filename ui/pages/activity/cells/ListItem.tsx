import React from 'react';
import type { ActivityType } from '../../../../shared/lib/activity/types';
import { ClaimActivityCell } from './ClaimActivityCell';
import { ContractInteractionActivityCell } from './ContractInteractionActivityCell';
import { FundingActivityCell } from './FundingActivityCell';
import { SpendingCapActivityCell } from './SpendingCapActivityCell';
import { StandardActivityCell } from './StandardActivityCell';
import { SwapActivityCell } from './SwapActivityCell';
import { TransferActivityCell } from './TransferActivityCell';
import type { ActivityCellComponent, ActivityCellProps } from './types';

const activityCellRegistry: Partial<Record<ActivityType, ActivityCellComponent>> =
  {
    receive: TransferActivityCell,
    send: TransferActivityCell,
    swap: SwapActivityCell,
    swapIncomplete: SwapActivityCell,
    approveSpendingCap: SpendingCapActivityCell,
    increaseSpendingCap: SpendingCapActivityCell,
    revokeSpendingCap: SpendingCapActivityCell,
    claim: ClaimActivityCell,
    claimMusdBonus: ClaimActivityCell,
    lendingDeposit: FundingActivityCell,
    contractInteraction: ContractInteractionActivityCell,
  };

export function ListItem({ data }: ActivityCellProps) {
  const Cell = activityCellRegistry[data.type] ?? StandardActivityCell;

  return <Cell data={data} />;
}
