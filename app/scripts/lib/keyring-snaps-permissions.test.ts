import {
  SubjectMetadataController,
  SubjectType,
} from '@metamask/permission-controller';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import { keyringSnapPermissionsBuilder } from './keyring-snaps-permissions';

describe('keyringSnapPermissionsBuilder', () => {
  const mockController = new SubjectMetadataController({
    subjectCacheLimit: 100,
    messenger: {
      registerActionHandler: jest.fn(),
      publish: jest.fn(),
    } as any,
    state: {},
  });
  mockController.addSubjectMetadata({
    origin: 'https://some-dapp.com',
    subjectType: SubjectType.Website,
  });

  it('returns the methods metamask can call', () => {
    const permissions = keyringSnapPermissionsBuilder(mockController);
    expect(permissions('metamask')).toStrictEqual([
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.GetRequest,
      KeyringRpcMethod.SubmitRequest,
      KeyringRpcMethod.RejectRequest,
    ]);
  });

  it('returns the methods a known origin can call', () => {
    const permissions = keyringSnapPermissionsBuilder(mockController);
    expect(permissions('https://some-dapp.com')).toStrictEqual([
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.CreateAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethod.UpdateAccount,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.ExportAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.GetRequest,
      KeyringRpcMethod.ApproveRequest,
      KeyringRpcMethod.RejectRequest,
    ]);
  });

  it('returns the methods an unknown origin can call', () => {
    const permissions = keyringSnapPermissionsBuilder(mockController);
    expect(permissions('https://some-other-dapp.com')).toStrictEqual([]);
  });

  it.each([
    '',
    'null',
    'sftp://some-dapp.com',
    'http://some-dapp.com',
    '0',
    undefined,
    null,
    true,
    false,
    1,
    0,
    -1,
  ])('"%s" cannot call any methods', (origin) => {
    const permissions = keyringSnapPermissionsBuilder(mockController);
    expect(permissions(origin as any)).toStrictEqual([]);
  });
});
