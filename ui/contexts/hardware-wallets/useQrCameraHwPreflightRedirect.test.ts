import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
  SWAP_PATH,
} from '../../helpers/constants/routes';
import {
  isConfirmationPath,
  resolveQrCameraPreflightRoute,
} from './useQrCameraHwPreflightRedirect';

const HW_SIGNATURES_PATH = `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`;

describe('isConfirmationPath', () => {
  it('returns true for confirmation detail paths', () => {
    expect(isConfirmationPath(`${CONFIRMATION_V_NEXT_ROUTE}/tx-1`)).toBe(true);
    expect(isConfirmationPath(`${CONFIRM_TRANSACTION_ROUTE}/tx-1`)).toBe(true);
  });

  it('returns false for confirmation roots and unrelated paths', () => {
    expect(isConfirmationPath(CONFIRMATION_V_NEXT_ROUTE)).toBe(false);
    expect(isConfirmationPath('/send')).toBe(false);
  });
});

describe('resolveQrCameraPreflightRoute', () => {
  it('returns SWAP_PATH for cross-chain routes', () => {
    expect(resolveQrCameraPreflightRoute(SWAP_PATH)).toBe(SWAP_PATH);
    expect(resolveQrCameraPreflightRoute(HW_SIGNATURES_PATH)).toBe(SWAP_PATH);
  });

  it('returns the confirmation pathname for confirmation routes', () => {
    const confirmationPath = `${CONFIRMATION_V_NEXT_ROUTE}/plain-send-tx`;
    expect(resolveQrCameraPreflightRoute(confirmationPath)).toBe(
      confirmationPath,
    );
  });

  it('returns null for unrelated paths', () => {
    expect(resolveQrCameraPreflightRoute('/send')).toBeNull();
  });
});
