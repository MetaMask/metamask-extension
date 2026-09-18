import { TREZOR_DEVICE_OPERATION_TIMEOUT_MS } from '../../../../shared/constants/hardware-wallets';

/**
 * Reject a Trezor device operation if it does not settle within
 * {@link TREZOR_DEVICE_OPERATION_TIMEOUT_MS}. Prevents requests from hanging
 * indefinitely when the device never responds (e.g. it is disconnected
 * mid-operation).
 *
 * @param promise - The device operation to guard with a timeout.
 * @returns The result of the operation, or a rejection when it times out.
 */
export function withTrezorDeviceTimeout<PayloadType>(
  promise: Promise<PayloadType>,
): Promise<PayloadType> {
  return new Promise<PayloadType>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Operation cancelled by timeout after ${TREZOR_DEVICE_OPERATION_TIMEOUT_MS} ms`,
        ),
      );
    }, TREZOR_DEVICE_OPERATION_TIMEOUT_MS);

    promise.then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}
