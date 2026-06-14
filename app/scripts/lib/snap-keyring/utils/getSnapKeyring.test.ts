import { SnapKeyring } from '@metamask/eth-snap-keyring';
import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { SnapAccountServiceGetLegacySnapKeyringAction } from '@metamask/snap-account-service';
import { getSnapKeyring } from './getSnapKeyring';

describe('getSnapKeyring', () => {
  let messenger: Messenger<
    MockAnyNamespace,
    SnapAccountServiceGetLegacySnapKeyringAction
  >;

  beforeEach(() => {
    messenger = new Messenger({
      namespace: MOCK_ANY_NAMESPACE,
    });
  });

  it('should return the snap keyring from SnapAccountService', async () => {
    const mockSnapKeyring = { type: 'Snap Keyring' } as unknown as SnapKeyring;
    const getLegacySnapKeyringMock = jest
      .fn()
      .mockResolvedValue(mockSnapKeyring);
    messenger.registerActionHandler(
      'SnapAccountService:getLegacySnapKeyring',
      getLegacySnapKeyringMock,
    );

    const snapKeyring = await getSnapKeyring(messenger);

    expect(getLegacySnapKeyringMock).toHaveBeenCalledTimes(1);
    expect(snapKeyring).toBe(mockSnapKeyring);
  });
});
