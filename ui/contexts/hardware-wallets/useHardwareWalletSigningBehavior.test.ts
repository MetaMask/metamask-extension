import { HardwareWalletType } from './types';
import { getHardwareWalletSigningBehavior } from './useHardwareWalletSigningBehavior';

describe('getHardwareWalletSigningBehavior', () => {
  it.each([
    undefined,
    null,
    HardwareWalletType.Unknown,
    HardwareWalletType.Ledger,
    HardwareWalletType.Trezor,
    HardwareWalletType.OneKey,
    HardwareWalletType.Qr,
  ])(
    'does not keep the confirmation open during signing for %s',
    (walletType) => {
      expect(getHardwareWalletSigningBehavior(walletType)).toStrictEqual({
        keepConfirmationOpenDuringSigning: false,
      });
    },
  );

  it('keeps the confirmation open during signing for configured wallet types', () => {
    expect(
      getHardwareWalletSigningBehavior(HardwareWalletType.Lattice),
    ).toStrictEqual({
      keepConfirmationOpenDuringSigning: true,
    });
  });
});
