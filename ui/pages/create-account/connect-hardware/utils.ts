import { formatBalance } from '../../../helpers/utils/util';

type StateAccounts = {
  [wallet: string]: {
    address?: string;
    balance: string;
  };
};

type HardwareAccount = {
  address: string;
  balance: null;
  index: number;
};

type FormattedHardwareAccount = Omit<HardwareAccount, 'balance'> & {
  balance: string;
};

export const formatAccounts = (
  hardwareAccounts: HardwareAccount[],
  stateAccounts: StateAccounts,
): FormattedHardwareAccount[] => {
  console.log('hardwareAccounts', hardwareAccounts);
  console.log('stateAccounts', stateAccounts);

  return hardwareAccounts.map((a) => {
    const normalizedAddress = a.address.toLowerCase();
    // We rely on the prop accounts data for balances, instead of the state
    const _balance = stateAccounts[normalizedAddress]?.balance || null;
    const balance = _balance ? formatBalance(_balance, 6) : '...';

    return {
      ...a,
      balance,
    };
  });
};
