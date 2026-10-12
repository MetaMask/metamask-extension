import {
  nonempty,
  object,
  optional,
  pattern,
  string,
  tuple,
  validate,
  type Infer,
} from '@metamask/superstruct';
import { HexChecksumAddressStruct, type Hex } from '@metamask/utils';
import { walletPayErrors } from './errors';

const AmountStruct = pattern(string(), /^(?!0+(\.0+)?$)\d+(\.\d{1,6})?$/u);

/**
 * `wallet_pay` params. Every supported field is listed; unknown fields are
 * rejected. `amount` is a positive decimal string with up to 6 decimals.
 */
export const WalletPayParamsStruct = tuple([
  object({
    type: nonempty(string()),
    from: HexChecksumAddressStruct,
    amount: optional(AmountStruct),
  }),
]);

export type WalletPayParams = Infer<typeof WalletPayParamsStruct>[0] & {
  from: Hex;
};

/**
 * Validates `wallet_pay` params against {@link WalletPayParamsStruct}.
 *
 * @param params - The raw JSON-RPC params.
 * @returns The validated request.
 */
export function validateWalletPayRequest(params: unknown): WalletPayParams {
  const [error, validated] = validate(params, WalletPayParamsStruct);

  if (error) {
    throw walletPayErrors.invalidParams(
      error
        .failures()
        .map(
          ({ path, message }) =>
            `${path.join(' > ')}${path.length ? ' - ' : ''}${message}`,
        )
        .join('\n'),
    );
  }

  return validated[0] as WalletPayParams;
}
