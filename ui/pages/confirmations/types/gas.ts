export type GasOptionTooltipProps = {
  priorityLevel: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasLimit?: number;
  transaction?: Record<string, unknown>;
};

export type GasOption = {
  emoji: string;
  estimatedTime?: string;
  isSelected: boolean;
  key: string;
  name: string;
  onSelect: () => void;
  value: string;
  valueInFiat?: string;
  tooltipProps?: GasOptionTooltipProps;
};
