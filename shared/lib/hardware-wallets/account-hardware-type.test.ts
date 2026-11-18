import { HardwareKeyringType } from '../../constants/hardware-wallets';
import { InternalKeyringType, SnapKeyringType } from '../../constants/keyring';
import {
  getAccountHardwareType,
  type HardwareTypeLookupMessenger,
} from './account-hardware-type';

describe('getAccountHardwareType', () => {
  const buildMessenger = (call = jest.fn()): HardwareTypeLookupMessenger => ({
    call,
  });

  it('maps known hardware keyring types case-insensitively', () => {
    const cases: [HardwareKeyringType, string][] = [
      [HardwareKeyringType.ledger, 'Ledger'],
      [HardwareKeyringType.trezor, 'Trezor'],
      [HardwareKeyringType.oneKey, 'OneKey'],
      [HardwareKeyringType.lattice, 'Lattice'],
      [HardwareKeyringType.qr, 'QR Hardware'],
    ];

    for (const [keyringType, expected] of cases) {
      const call = jest.fn().mockReturnValue({
        keyrings: [
          { type: InternalKeyringType.hdKeyTree, accounts: ['0x111'] },
          { type: keyringType, accounts: ['0xabc'] },
        ],
      });
      const messenger = buildMessenger(call);

      const result = getAccountHardwareType(messenger, '0xABC');

      expect(call).toHaveBeenCalledWith('KeyringController:getState');
      expect(result).toBe(expected);
    }
  });

  it('returns undefined for non-hardware, missing, or unknown keyrings', () => {
    const states = [
      {
        keyrings: [
          { type: InternalKeyringType.hdKeyTree, accounts: ['0xabc'] },
        ],
      },
      {
        keyrings: [{ type: InternalKeyringType.imported, accounts: ['0xabc'] }],
      },
      { keyrings: [{ type: SnapKeyringType.snap, accounts: ['0xabc'] }] },
      { keyrings: [{ type: 'Unknown Keyring', accounts: ['0xabc'] }] },
      { keyrings: [{ type: HardwareKeyringType.ledger, accounts: ['0xdef'] }] },
      { keyrings: [] },
      {},
      null,
      undefined,
    ];

    for (const state of states) {
      const messenger = buildMessenger(jest.fn().mockReturnValue(state));

      expect(getAccountHardwareType(messenger, '0xabc')).toBeUndefined();
    }
  });

  it('returns undefined without calling messenger when address is missing', () => {
    const call = jest.fn();
    const messenger = buildMessenger(call);

    expect(getAccountHardwareType(messenger, undefined)).toBeUndefined();
    expect(getAccountHardwareType(messenger, '')).toBeUndefined();
    expect(call).not.toHaveBeenCalled();
  });

  it('returns undefined when keyring state lookup throws', () => {
    const messenger = buildMessenger(
      jest.fn().mockImplementation(() => {
        throw new Error('keyring down');
      }),
    );

    expect(getAccountHardwareType(messenger, '0xabc')).toBeUndefined();
  });
});
