import { useHardwareWalletConfig } from './HardwareWalletContext';
import { HardwareWalletType } from './types';

export type HardwareWalletSigningBehavior = {
  keepConfirmationOpenDuringSigning: boolean;
};

const DEFAULT_SIGNING_BEHAVIOR: HardwareWalletSigningBehavior = {
  keepConfirmationOpenDuringSigning: false,
};

const SIGNING_BEHAVIOR_BY_WALLET_TYPE: Partial<
  Record<HardwareWalletType, HardwareWalletSigningBehavior>
> = {
  [HardwareWalletType.Lattice]: {
    keepConfirmationOpenDuringSigning: true,
  },
};

export function getHardwareWalletSigningBehavior(
  walletType?: HardwareWalletType | null,
): HardwareWalletSigningBehavior {
  return walletType
    ? (SIGNING_BEHAVIOR_BY_WALLET_TYPE[walletType] ?? DEFAULT_SIGNING_BEHAVIOR)
    : DEFAULT_SIGNING_BEHAVIOR;
}

export function useHardwareWalletSigningBehavior(): HardwareWalletSigningBehavior {
  const { walletType } = useHardwareWalletConfig();

  return getHardwareWalletSigningBehavior(walletType);
}
