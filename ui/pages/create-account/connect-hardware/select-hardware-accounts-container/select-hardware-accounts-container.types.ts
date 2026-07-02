import type {
  AsyncVoidCallback,
  HardwareHdPathOptionData,
  RawHardwareAccount,
} from '../types';

/** Available views in the redesigned hardware account selection flow. */
export const HARDWARE_ACCOUNTS_FLOW_VIEWS = ['accounts', 'hd-path'] as const;

/** View state for the redesigned hardware account selection flow. */
export type HardwareAccountsFlowView =
  (typeof HARDWARE_ACCOUNTS_FLOW_VIEWS)[number];

/** Props for SelectHardwareAccountsContainer. */
export type SelectHardwareAccountsContainerProps = {
  device: string;
  accounts: RawHardwareAccount[];
  connectedAccounts: string[];
  selectedAccountIndices: number[];
  onSelectedAccountIndicesChange: (indices: number[]) => void;
  selectedPath: string;
  hdPaths: HardwareHdPathOptionData[];
  showHdPathSettings: boolean;
  onPathChange: (path: string) => void;
  onBack: () => void;
  onShowMore: () => void;
  onContinue: AsyncVoidCallback;
  onForgetDevice: AsyncVoidCallback;
  hasMoreAccounts: boolean;
  isLoadingMore: boolean;
};
