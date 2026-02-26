import { Hex } from '@metamask/utils';
import {
  getMockConfirmStateForTransaction,
  getMockConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { HardwareDeviceNames } from '../../../../../../shared/constants/hardware-wallets';
import { usePayHardwareAccountAlert } from './usePayHardwareAccountAlert';

const HARDWARE_ACCOUNT_ID = 'hardware-account-id';

function createHardwareAccountState(keyringType: string) {
  return {
    metamask: {
      internalAccounts: {
        accounts: {
          [HARDWARE_ACCOUNT_ID]: {
            address: CONTRACT_INTERACTION_SENDER_ADDRESS,
            id: HARDWARE_ACCOUNT_ID,
            metadata: {
              importTime: 0,
              name: 'Hardware Account',
              keyring: {
                type: keyringType,
              },
              lastSelected: 0,
            },
            options: {},
            methods: [
              'personal_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            scopes: ['eip155:0'],
            type: 'eip155:eoa',
          },
        },
        selectedAccount: HARDWARE_ACCOUNT_ID,
      },
    },
  };
}

function runHookWithTransaction(keyringType: string = 'HD Key Tree') {
  const transaction = genUnapprovedContractInteractionConfirmation({
    address: CONTRACT_INTERACTION_SENDER_ADDRESS as Hex,
  });

  const state = getMockConfirmStateForTransaction(
    transaction,
    createHardwareAccountState(keyringType),
  );

  return renderHookWithConfirmContextProvider(
    () => usePayHardwareAccountAlert(),
    state,
  );
}

function runHookWithoutTransaction() {
  const state = getMockConfirmState();

  return renderHookWithConfirmContextProvider(
    () => usePayHardwareAccountAlert(),
    state,
  );
}

describe('usePayHardwareAccountAlert', () => {
  it('returns alert if from address is a Ledger hardware wallet account', () => {
    const { result } = runHookWithTransaction(HardwareDeviceNames.ledger);

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.PayHardwareAccount,
        field: RowAlertKey.PayWith,
        reason: 'Wallet not supported',
        message:
          "Hardware wallets aren't supported.\nSwitch wallets to continue.",
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('returns alert if from address is a Trezor hardware wallet account', () => {
    const { result } = runHookWithTransaction(HardwareDeviceNames.trezor);

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.PayHardwareAccount,
        field: RowAlertKey.PayWith,
        reason: 'Wallet not supported',
        message:
          "Hardware wallets aren't supported.\nSwitch wallets to continue.",
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('returns alert if from address is a Lattice hardware wallet account', () => {
    const { result } = runHookWithTransaction(HardwareDeviceNames.lattice);

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.PayHardwareAccount,
        field: RowAlertKey.PayWith,
        reason: 'Wallet not supported',
        message:
          "Hardware wallets aren't supported.\nSwitch wallets to continue.",
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('returns no alert if from address is not a hardware wallet account', () => {
    const { result } = runHookWithTransaction('HD Key Tree');

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert if there is no current confirmation', () => {
    const { result } = runHookWithoutTransaction();

    expect(result.current).toStrictEqual([]);
  });
});
