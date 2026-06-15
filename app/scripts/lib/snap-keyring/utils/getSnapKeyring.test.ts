import {
  KeyringControllerAddNewKeyringAction,
  KeyringControllerGetKeyringsByTypeAction,
  KeyringTypes,
} from '@metamask/keyring-controller';
import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { getSnapKeyring } from './getSnapKeyring';

describe('getSnapKeyring', () => {
  let messenger: Messenger<
    MockAnyNamespace,
    | KeyringControllerGetKeyringsByTypeAction
    | KeyringControllerAddNewKeyringAction
  >;

  beforeEach(() => {
    messenger = new Messenger({
      namespace: MOCK_ANY_NAMESPACE,
    });
  });

  it('should initialize the snap keyring if it is not present', async () => {
    const getKeyringByTypeMock = jest
      .fn()
      .mockReturnValueOnce([undefined])
      .mockReturnValueOnce([{ id: 'foo', type: KeyringTypes.snap }]);
    messenger.registerActionHandler(
      'KeyringController:getKeyringsByType',
      getKeyringByTypeMock,
    );

    const addNewKeyringMock = jest.fn().mockResolvedValue(undefined);
    messenger.registerActionHandler(
      'KeyringController:addNewKeyring',
      addNewKeyringMock,
    );

    const snapKeyring = await getSnapKeyring(messenger);

    expect(addNewKeyringMock).toHaveBeenCalledWith(KeyringTypes.snap);
    expect(snapKeyring).toStrictEqual({ id: 'foo', type: KeyringTypes.snap });
  });

  it('should return the snap keyring if it is already initialized', async () => {
    const getKeyringByTypeMock = jest
      .fn()
      .mockReturnValue([{ id: 'foo', type: KeyringTypes.snap }]);
    messenger.registerActionHandler(
      'KeyringController:getKeyringsByType',
      getKeyringByTypeMock,
    );

    const addNewKeyringMock = jest.fn().mockResolvedValue(undefined);
    messenger.registerActionHandler(
      'KeyringController:addNewKeyring',
      addNewKeyringMock,
    );

    const snapKeyring = await getSnapKeyring(messenger);

    expect(addNewKeyringMock).not.toHaveBeenCalled();
    expect(snapKeyring).toStrictEqual({ id: 'foo', type: KeyringTypes.snap });
  });
});
