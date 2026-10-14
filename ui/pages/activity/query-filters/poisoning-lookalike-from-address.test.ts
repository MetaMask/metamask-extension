import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { isPoisoningLookalikeFromAddress } from './poisoning-lookalike-from-address';

const subjectAddress = '0x9bed78535d6a03a955f1504aadba974d9a29e292';
const knownAddress = '0xdbfa1702f1721580507c2f2c3d961e5c5fc780da';
const lookalikeAddress = '0xdbfaa66be7a1463304caa72d3f1d7025000580da';

function transaction(overrides = {}) {
  return {
    hash: '0xhash',
    from: lookalikeAddress,
    to: subjectAddress,
    ...overrides,
  } as unknown as V1TransactionByHashResponse;
}

describe('isPoisoningLookalikeFromAddress', () => {
  it('returns false when the sender is the subject address', () => {
    expect(
      isPoisoningLookalikeFromAddress(
        transaction({ from: subjectAddress }),
        subjectAddress,
        [knownAddress],
      ),
    ).toBe(false);
  });

  it('returns true when the sender is a lookalike of a known address', () => {
    expect(
      isPoisoningLookalikeFromAddress(transaction(), subjectAddress, [
        knownAddress,
      ]),
    ).toBe(true);
  });

  it('returns false when the sender is unrelated to known addresses', () => {
    expect(
      isPoisoningLookalikeFromAddress(
        transaction({
          from: '0x111122223333444455556666777788889999aaaa',
        }),
        subjectAddress,
        [knownAddress],
      ),
    ).toBe(false);
  });
});
