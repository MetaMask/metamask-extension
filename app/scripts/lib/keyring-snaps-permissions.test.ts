import {
  SubjectMetadataController,
  SubjectType,
} from '@metamask/permission-controller';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import {
  isProtocolAllowed,
  keyringSnapPermissionsBuilder,
} from './keyring-snaps-permissions';

describe('keyringSnapPermissionsBuilder', () => {
  const mockController = new SubjectMetadataController({
    subjectCacheLimit: 100,
    messenger: {
      registerActionHandler: jest.fn(),
      registerInitialEventPayload: jest.fn(),
      publish: jest.fn(),
    } as any,
    state: {},
  });
  mockController.addSubjectMetadata({
    origin: 'https://some-dapp.com',
    subjectType: SubjectType.Website,
  });

  it('returns the methods metamask can call', () => {
    const permissions = keyringSnapPermissionsBuilder(
      mockController,
      'metamask',
    );
    expect(permissions()).toStrictEqual([
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
    const permissions = keyringSnapPermissionsBuilder(
      mockController,
      'https://some-dapp.com',
    );
    expect(permissions()).toStrictEqual([
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
      KeyringRpcMethod.SubmitRequest,
    ]);
  });

  it('returns the methods an unknown origin can call', () => {
    const permissions = keyringSnapPermissionsBuilder(
      mockController,
      'https://some-other-dapp.com',
    );
    expect(permissions()).toStrictEqual([]);
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
    const permissions = keyringSnapPermissionsBuilder(
      mockController,
      origin as any,
    );
    expect(permissions()).toStrictEqual([]);
  });
});

describe('isProtocolAllowed', () => {
  it.each([
    ['http://some-dapp.com', true],
    ['https://some-dapp.com', true],
    ['sftp://some-dapp.com', false],
    ['', false],
    ['null', false],
    ['0', false],
    [undefined, false],
    [null, false],
    [true, false],
    [false, false],
    [1, false],
    [0, false],
    [-1, false],
  ])('"%s" cannot call any methods', (origin: any, expected: boolean) => {
    expect(isProtocolAllowed(origin)).toBe(expected);
  });
});
