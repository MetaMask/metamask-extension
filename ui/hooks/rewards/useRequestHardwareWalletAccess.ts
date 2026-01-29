import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import { isHardwareWallet, getHardwareWalletType } from '../../selectors';
import {
  HardwareKeyringType,
  LEDGER_USB_VENDOR_ID,
  LedgerTransportTypes,
} from '../../../shared/constants/hardware-wallets';
import { getLedgerTransportType } from '../../ducks/metamask/metamask';

export type UseRequestHardwareWalletAccessResult = {
  /**
   * Request USB/HID device access for certain types of hardware wallets.
   * This must be called in a user gesture context (onClick handler).
   * Returns true if device access was granted or not needed, false otherwise.
   */
  requestHardwareWalletAccess: () => Promise<boolean>;
  /**
   * Whether the current account is a hardware wallet account.
   */
  isHardwareWalletAccount: boolean;
};

/**
 * Hook that provides a function to request hardware wallet USB/HID device access.
 * Encapsulates all hardware wallet detection and access request logic.
 *
 * @returns An object containing the requestHardwareWalletAccess function and isHardwareWalletAccount flag.
 */
export const useRequestHardwareWalletAccess =
  (): UseRequestHardwareWalletAccessResult => {
    const isHardwareWalletAccount = useSelector(isHardwareWallet);
    const hardwareWalletType = useSelector(getHardwareWalletType);
    const ledgerTransportType = useSelector(getLedgerTransportType);

    const requestHardwareWalletAccess =
      useCallback(async (): Promise<boolean> => {
        if (!isHardwareWalletAccount) {
          return true; // Not a hardware wallet, proceed normally
        }

        try {
          // Handle Ledger with WebHID
          if (
            hardwareWalletType === HardwareKeyringType.ledger &&
            ledgerTransportType === LedgerTransportTypes.webhid
          ) {
            const connectedDevices = await window.navigator.hid.requestDevice({
              filters: [{ vendorId: Number(LEDGER_USB_VENDOR_ID) }],
            });
            return connectedDevices.some(
              (device) => device.vendorId === Number(LEDGER_USB_VENDOR_ID),
            );
          }

          // Handle Trezor with WebUSB
          if (
            hardwareWalletType === HardwareKeyringType.trezor &&
            window.navigator.usb
          ) {
            await window.navigator.usb.requestDevice({
              filters: [
                { vendorId: 0x534c, productId: 0x0001 }, // Trezor One
                { vendorId: 0x1209, productId: 0x53c0 }, // Trezor Model T
                { vendorId: 0x1209, productId: 0x53c1 }, // Trezor Safe 3
              ],
            });
            return true;
          }

          // Lattice uses HTTP/WebSocket to communicate with the device.
          // QR code hardware wallets use a popover signing modal, so we don't need to request device access.
          return (
            hardwareWalletType === HardwareKeyringType.lattice ||
            hardwareWalletType === HardwareKeyringType.qr
          );
        } catch (error) {
          // User cancelled the device selection or no device found
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('No device selected')) {
            log.error('Hardware wallet access request failed:', error);
          }
          return false;
        }
      }, [isHardwareWalletAccount, hardwareWalletType, ledgerTransportType]);

    return {
      requestHardwareWalletAccess,
      isHardwareWalletAccount,
    };
  };
