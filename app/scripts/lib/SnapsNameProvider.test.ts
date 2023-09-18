import { NameType } from '@metamask/name-controller';
import { HandlerType } from '@metamask/snaps-utils';
import { SnapsNameProvider } from './SnapsNameProvider';

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

const OPTIONS_MOCK = {
  getPermissionSubjects: () => ({
    [SNAP_MOCK.id]: { permissions: { 'endowment:name-lookup': true } },
    [SNAP_MOCK_2.id]: { permissions: { 'endowment:name-lookup': true } },
    [SNAP_MOCK_3.id]: { permissions: {} },
  }),
  getSnaps: () => [SNAP_MOCK, SNAP_MOCK_2, SNAP_MOCK_3],
  handleSnapRequest: () => Promise.resolve(),
} as any;

describe('SnapsNameProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getMetadata', () => {
    it('returns metadata for installed snap with permissions', () => {
      const provider = new SnapsNameProvider(OPTIONS_MOCK);
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
      const handleSnapRequest = jest.fn();

      const provider = new SnapsNameProvider({
        ...OPTIONS_MOCK,
        handleSnapRequest,
      });

      handleSnapRequest.mockResolvedValueOnce({
        resolvedDomain: NAME_MOCK,
      });

      handleSnapRequest.mockResolvedValueOnce({
        resolvedDomain: NAME_MOCK_2,
      });

      const response = await provider.getProposedNames({
        value: VALUE_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        chainId: CHAIN_ID_MOCK,
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
      const handleSnapRequest = jest.fn();
      const errorMock = new Error('TestError');

      const provider = new SnapsNameProvider({
        ...OPTIONS_MOCK,
        handleSnapRequest,
      });

      handleSnapRequest.mockImplementationOnce(() => {
        throw new Error(ERROR_MOCK);
      });

      handleSnapRequest.mockResolvedValueOnce({
        resolvedDomain: NAME_MOCK_2,
      });

      const response = await provider.getProposedNames({
        value: VALUE_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        chainId: CHAIN_ID_MOCK,
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
      const handleSnapRequest = jest.fn();

      const provider = new SnapsNameProvider({
        ...OPTIONS_MOCK,
        getSnaps: () => [SNAP_MOCK],
        handleSnapRequest,
      });

      handleSnapRequest.mockResolvedValueOnce({
        resolvedName: undefined,
      });

      const response = await provider.getProposedNames({
        value: VALUE_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        chainId: CHAIN_ID_MOCK,
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
