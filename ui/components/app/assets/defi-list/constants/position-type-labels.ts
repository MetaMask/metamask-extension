export const PositionTypeLabels = {
  supply: 'supplied',
  stake: 'staked',
  borrow: 'borrowed',
  reward: 'rewards',
} as const;

export type PositionTypeLabelKey = keyof typeof PositionTypeLabels;
