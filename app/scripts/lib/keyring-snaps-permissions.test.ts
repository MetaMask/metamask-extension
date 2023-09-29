import {
  SubjectMetadataController,
  SubjectType,
} from '@metamask/subject-metadata-controller';
import { KeyringRpcMethod } from '@metamask/keyring-api';
import { keyringSnapPermissionsBuilder } from './keyring-snaps-permissions';

describe('keyringSnapPermissionsBuilder', () => {
  const mockController = {
    getSubjectMetadata: jest.fn((origin: string) => {
      if (origin.startsWith('https://') || origin.startsWith('http://')) {
        return { subjectType: SubjectType.Website };
      }
      return { subjectType: SubjectType.Unknown };
    }),
  } as unknown as SubjectMetadataController;

  it.each([
    // MetaMask
    ['metamask', KeyringRpcMethod.ListAccounts, true],
    ['metamask', KeyringRpcMethod.GetAccount, true],
    ['metamask', KeyringRpcMethod.CreateAccount, false],
    ['metamask', KeyringRpcMethod.FilterAccountChains, true],
    ['metamask', KeyringRpcMethod.UpdateAccount, false],
    ['metamask', KeyringRpcMethod.DeleteAccount, true],
    ['metamask', KeyringRpcMethod.ExportAccount, false],
    ['metamask', KeyringRpcMethod.ListRequests, true],
    ['metamask', KeyringRpcMethod.GetRequest, true],
    ['metamask', KeyringRpcMethod.SubmitRequest, true],
    ['metamask', KeyringRpcMethod.ApproveRequest, false],
    ['metamask', KeyringRpcMethod.RejectRequest, true],
    // Dapp
    ['https://some-dapp-url', KeyringRpcMethod.ListAccounts, true],
    ['https://some-dapp-url', KeyringRpcMethod.GetAccount, true],
    ['https://some-dapp-url', KeyringRpcMethod.CreateAccount, true],
    ['https://some-dapp-url', KeyringRpcMethod.FilterAccountChains, true],
    ['https://some-dapp-url', KeyringRpcMethod.UpdateAccount, true],
    ['https://some-dapp-url', KeyringRpcMethod.DeleteAccount, true],
    ['https://some-dapp-url', KeyringRpcMethod.ExportAccount, true],
    ['https://some-dapp-url', KeyringRpcMethod.ListRequests, true],
    ['https://some-dapp-url', KeyringRpcMethod.GetRequest, true],
    ['https://some-dapp-url', KeyringRpcMethod.SubmitRequest, false],
    ['https://some-dapp-url', KeyringRpcMethod.ApproveRequest, true],
    ['https://some-dapp-url', KeyringRpcMethod.RejectRequest, true],
  ])('"%s" is allowed to call "%s": %s', (origin, method, expected) => {
    const permissions = keyringSnapPermissionsBuilder(mockController);
    expect(permissions(origin).includes(method)).toBe(expected);
  });
});
