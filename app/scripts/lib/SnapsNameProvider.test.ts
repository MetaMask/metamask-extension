import { NameType } from '@metamask/name-controller';
import { HandlerType } from '@metamask/snaps-utils';
import {
  GetAllSnaps,
  GetSnap,
  HandleSnapRequest,
} from '@metamask/snaps-controllers';
import { GetPermissionControllerState } from '@metamask/permission-controller';
import {
  SnapsNameProvider,
  SnapsNameProviderMessenger,
} from './SnapsNameProvider';

const VALUE_MOCK = 'TestValue';
const CHAIN_ID_MOCK = '0x1';
const NAME_MOCK = 'TestName';
const NAME_MOCK_2 = 'TestName2';
const ERROR_MOCK = 'TestError';

const SNAP_MOCK = {
  id: 'testSnap1',
  manifest: {
    proposedName: 'Test Snap 1',
  },
};

const SNAP_MOCK_2 = {
  id: 'testSnap2',
  manifest: {
    proposedName: 'Test Snap 2',
  },
};

const SNAP_MOCK_3 = {
  id: 'testSnap3',
  manifest: {
    proposedName: 'Test Snap 3',
  },
};

function createMockMessenger({
  getAllSnaps,
  getSnap,
  handleSnapRequest,
  getPermissionControllerState,
}: {
  getAllSnaps?: jest.Mocked<GetAllSnaps['handler']>;
  getSnap?: jest.Mocked<GetSnap['handler']>;
  handleSnapRequest?: jest.Mocked<HandleSnapRequest['handler']>;
  getPermissionControllerState?: jest.Mocked<
    GetPermissionControllerState['handler']
  >;
} = {}): SnapsNameProviderMessenger {
  const getAllSnapsMock =
    getAllSnaps ||
    jest.fn().mockReturnValue([SNAP_MOCK, SNAP_MOCK_2, SNAP_MOCK_3]);

  const getSnapMock =
    getSnap ||
    jest
      .fn()
      .mockImplementation((snapId) =>
        [SNAP_MOCK, SNAP_MOCK_2, SNAP_MOCK_3].find(({ id }) => id === snapId),
      );

  const handleSnapRequestMock =
    handleSnapRequest || jest.fn().mockResolvedValue(Promise.resolve());

  const getPermissionControllerStateMock =
    getPermissionControllerState ||
    jest.fn().mockReturnValue({
      subjects: {
        [SNAP_MOCK.id]: { permissions: { 'endowment:name-lookup': true } },
        [SNAP_MOCK_2.id]: { permissions: { 'endowment:name-lookup': true } },
        [SNAP_MOCK_3.id]: { permissions: {} },
      },
    });

  const callMock = jest.fn().mockImplementation((method, ...args) => {
    switch (method) {
      case 'SnapController:getAll':
        return getAllSnapsMock();
      case 'SnapController:get':
        return getSnapMock(args[0]);
      case 'SnapController:handleRequest':
        return handleSnapRequestMock(args[0]);
      case 'PermissionController:getState':
        return getPermissionControllerStateMock();
      default:
        return undefined;
    }
  });

  return {
    call: callMock,
  } as any;
}

describe('SnapsNameProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getMetadata', () => {
    it('returns metadata for installed snap with permissions', () => {
      const provider = new SnapsNameProvider({
        messenger: createMockMessenger(),
      });

      const metadata = provider.getMetadata();
      const { sourceIds, sourceLabels } = metadata;

      expect(sourceIds).toStrictEqual({
        [NameType.ETHEREUM_ADDRESS]: [SNAP_MOCK.id, SNAP_MOCK_2.id],
      });

      expect(sourceLabels).toStrictEqual({
        [SNAP_MOCK.id]: SNAP_MOCK.manifest.proposedName,
        [SNAP_MOCK_2.id]: SNAP_MOCK_2.manifest.proposedName,
      });
    });
  });

  describe('getProposedNames', () => {
    it('returns the resolved names from name lookup requests to snaps with permissions', async () => {
      const handleSnapRequest = jest
        .fn()
        .mockResolvedValueOnce({
          resolvedDomain: NAME_MOCK,
        })
        .mockResolvedValueOnce({
          resolvedDomain: NAME_MOCK_2,
        });

      const provider = new SnapsNameProvider({
        messenger: createMockMessenger({ handleSnapRequest }),
      });

      const response = await provider.getProposedNames({
        value: VALUE_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        variation: CHAIN_ID_MOCK,
      });

      expect(response).toStrictEqual({
        results: {
          [SNAP_MOCK.id]: {
            proposedNames: [NAME_MOCK],
            error: undefined,
          },
          [SNAP_MOCK_2.id]: {
            proposedNames: [NAME_MOCK_2],
            error: undefined,
          },
        },
      });

      expect(handleSnapRequest).toHaveBeenCalledTimes(2);

      for (const snapId of [SNAP_MOCK.id, SNAP_MOCK_2.id]) {
        expect(handleSnapRequest).toHaveBeenCalledWith({
          snapId,
          origin: '',
          handler: HandlerType.OnNameLookup,
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              chainId: `eip155:1`,
              address: VALUE_MOCK,
            },
          },
        });
      }
    });

    it('returns errors if name lookup requests fail', async () => {
      const handleSnapRequest = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error(ERROR_MOCK);
        })
        .mockResolvedValueOnce({
          resolvedDomain: NAME_MOCK_2,
        });

      const errorMock = new Error('TestError');

      const provider = new SnapsNameProvider({
        messenger: createMockMessenger({ handleSnapRequest }),
      });

      const response = await provider.getProposedNames({
        value: VALUE_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        variation: CHAIN_ID_MOCK,
      });

      expect(response).toStrictEqual({
        results: {
          [SNAP_MOCK.id]: {
            proposedNames: undefined,
            error: errorMock,
          },
          [SNAP_MOCK_2.id]: {
            proposedNames: [NAME_MOCK_2],
            error: undefined,
          },
        },
      });
    });

    it('returns empty array if name lookup request returns undefined', async () => {
      const getAllSnaps = jest.fn().mockReturnValue([SNAP_MOCK]);

      const handleSnapRequest = jest.fn().mockResolvedValueOnce({
        resolvedName: undefined,
      });

      const provider = new SnapsNameProvider({
        messenger: createMockMessenger({ getAllSnaps, handleSnapRequest }),
      });

      const response = await provider.getProposedNames({
        value: VALUE_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        variation: CHAIN_ID_MOCK,
      });

      expect(response).toStrictEqual({
        results: {
          [SNAP_MOCK.id]: {
            proposedNames: [],
            error: undefined,
          },
        },
      });
    });
  });
});
