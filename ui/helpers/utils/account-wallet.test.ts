import { AccountWalletType } from '@metamask/account-api';
import type { AccountWalletObject } from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { isPrimaryWallet, isPrivateKeyWallet } from './account-wallet';

const createKeyringWallet = (keyringType: KeyringTypes) =>
  ({
    id: `keyring:${keyringType}`,
    type: AccountWalletType.Keyring,
    metadata: { name: keyringType, keyring: { type: keyringType } },
    groups: {},
  }) as unknown as AccountWalletObject;

describe('isPrivateKeyWallet', () => {
  it('identifies an imported private key wallet', () => {
    expect(isPrivateKeyWallet(createKeyringWallet(KeyringTypes.simple))).toBe(
      true,
    );
  });

  it('rejects other keyring wallets, such as hardware wallets', () => {
    expect(isPrivateKeyWallet(createKeyringWallet(KeyringTypes.ledger))).toBe(
      false,
    );
  });

  it('rejects wallets that are not keyring wallets', () => {
    const entropyWallet = {
      id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ',
      type: AccountWalletType.Entropy,
      metadata: { name: 'Wallet 1', entropy: { id: '01JKAF3DSGM3AB87EM9' } },
      groups: {},
    } as unknown as AccountWalletObject;

    expect(isPrivateKeyWallet(entropyWallet)).toBe(false);
  });
});

describe('isPrimaryWallet', () => {
  const primaryHdKeyringId = '01JKAF3DSGM3AB87EM9N0K41AJ';

  const createEntropyWallet = (entropyId: string) =>
    ({
      id: `entropy:${entropyId}`,
      type: AccountWalletType.Entropy,
      metadata: { name: 'Wallet', entropy: { id: entropyId } },
      groups: {},
    }) as unknown as AccountWalletObject;

  it('identifies the entropy wallet that matches the first HD keyring', () => {
    expect(
      isPrimaryWallet(
        createEntropyWallet(primaryHdKeyringId),
        primaryHdKeyringId,
      ),
    ).toBe(true);
  });

  it('rejects other entropy wallets', () => {
    expect(
      isPrimaryWallet(
        createEntropyWallet('other-entropy-id'),
        primaryHdKeyringId,
      ),
    ).toBe(false);
  });

  it('rejects non-entropy wallets even when ids would otherwise match', () => {
    expect(
      isPrimaryWallet(
        createKeyringWallet(KeyringTypes.simple),
        primaryHdKeyringId,
      ),
    ).toBe(false);
  });

  it('rejects every wallet when there is no primary HD keyring', () => {
    expect(
      isPrimaryWallet(createEntropyWallet(primaryHdKeyringId), undefined),
    ).toBe(false);
  });
});
