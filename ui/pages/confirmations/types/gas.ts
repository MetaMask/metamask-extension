export interface GasOption {
  emoji: string;
  estimatedTime?: string;
  isSelected: boolean;
  key: string;
  name: string;
  onSelect: () => void;
  value: string;
  valueInFiat?: string;
}
