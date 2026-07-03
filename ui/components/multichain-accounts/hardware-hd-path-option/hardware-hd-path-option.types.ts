/**
 * Props for HardwareHdPathOption.
 *
 * @property label - Display label for the HD path.
 * @property isSelected - Whether this path is selected.
 * @property onSelect - Called when the user selects this path.
 */
export type HardwareHdPathOptionProps = {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
};
