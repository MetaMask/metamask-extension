import { BaseError } from './base';

export type InvalidAddressErrorType = InvalidAddressError & {
  name: 'InvalidAddressError';
};
export class InvalidAddressError extends BaseError {
  constructor({ address }: { address: string }) {
    super(`Address "${address}" is invalid.`, {
      metaMessages: [
        '- Address must be a hex value of 20 bytes (40 hex characters).',
        '- Address must match its checksum counterpart.',
      ],
      name: 'InvalidAddressError',
    });
  }
}
