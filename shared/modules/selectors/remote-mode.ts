import { getManifestFlags } from '../../lib/manifestFlags';
import merge from 'lodash/merge';
import { ControllerFlatState } from '../../../app/scripts/controller-init/controller-list';
import { REMOTE_MODES } from '../../lib/remote-mode';
import { Hex, isHexEqual } from '../../lib/delegation/utils';

export const getRemoteModeEnabled = (state: ControllerFlatState) => {
  const manifestFlags = getManifestFlags().remoteFeatureFlags;
  const stateFlags = state.remoteFeatureFlags;
  const flags = merge({}, stateFlags, manifestFlags);
  return Boolean(flags.vaultRemoteMode);
};

export const isExistingAccount = ({
  state,
  address,
}: {
  state: ControllerFlatState;
  address: string;
}) => {
  const { accounts } = state.internalAccounts;
  return Object.values(accounts).some((account) => account.address === address);
};

export const getDailyAllowance = ({
  state,
  address,
  chainId,
}: {
  state: ControllerFlatState;
  address: Hex;
  chainId: Hex;
}) => {
  const entries = Object.values(state.delegations);
  const dailyAllowance = entries.find(
    (e) =>
      isHexEqual(address, e.delegation.delegator) &&
      isHexEqual(chainId, e.chainId) &&
      e.tags.includes(REMOTE_MODES.DAILY_ALLOWANCE),
  );

  return dailyAllowance;
};
