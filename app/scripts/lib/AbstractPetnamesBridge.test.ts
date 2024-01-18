import {
  FALLBACK_VARIATION,
  NameController,
  NameControllerState,
  NameOrigin,
  NameType,
} from '@metamask/name-controller';
import {
  AbstractPetnamesBridge,
  ChangeType,
  PetnameEntry,
  PetnamesBridgeMessenger,
} from './AbstractPetnamesBridge';

const ADDRESS_MOCK = '0xabc';
const NAME1_MOCK = 'name1';
const NAME2_MOCK = 'name2';
const CHAIN_ID_MOCK = '0x1';
const ORIGIN_MOCK = NameOrigin.ADDRESS_BOOK;
// Petnames with this origin participate in synchronization.
const PARTICIPANT_ORIGIN_MOCK = NameOrigin.ACCOUNT_IDENTITY;
// Petnames with this origin do not participate in synchronization.
const NON_PARTICIPANT_ORIGIN_MOCK = NameOrigin.API;

// Target only entries with origin === PARTICIPANT_ORIGIN_MOCK.
const isSyncParticipantMock = (targetEntry: PetnameEntry) =>
  targetEntry.origin === PARTICIPANT_ORIGIN_MOCK;

const NO_SOURCE_ENTRIES: PetnameEntry[] = [];

/**
 * Creates a PetnameEntry with the given name and address.
 *
 * @param address
 * @param name
 */
function createPetnameEntry(address: string, name: string): PetnameEntry {
  return {
    value: address,
    name,
    type: NameType.ETHEREUM_ADDRESS,
    sourceId: undefined,
    variation: CHAIN_ID_MOCK,
    origin: ORIGIN_MOCK,
  };
}

const EMPTY_NAME_STATE: NameControllerState = {
  names: {
    [NameType.ETHEREUM_ADDRESS]: {},
  },
  nameSources: {},
};

/**
 * Creates NameControllerState containing a single Petname with the given name and address.
 * This is used to simulate a NameController state where a Petname has been set
 * with a call to NameController.setName(createPetnameEntry(name) as SetNameRequest).
 *
 * @param address
 * @param name
 */
function createNameState(address: string, name: string): NameControllerState {
  return {
    ...EMPTY_NAME_STATE,
    names: {
      [NameType.ETHEREUM_ADDRESS]: {
        [address]: {
          [CHAIN_ID_MOCK]: {
            name,
            sourceId: null,
            proposedNames: {},
            origin: ORIGIN_MOCK,
          },
        },
      },
    },
  };
}

class TestPetnamesBridge extends AbstractPetnamesBridge {
  getSourceEntries = jest.fn();

  updateSourceEntry = jest.fn();

  onSourceChange = jest.fn();

  isSyncParticipant = jest.fn().mockReturnValue(true);
}

function createNameControllerMock(state: NameControllerState) {
  return {
    state,
    setName: jest.fn(),
  } as unknown as jest.Mocked<NameController>;
}

function createMessengerMock(): jest.Mocked<PetnamesBridgeMessenger> {
  return {
    subscribe: jest.fn(),
  } as any;
}

describe('AbstractPetnamesBridge', () => {
  let messenger: jest.Mocked<PetnamesBridgeMessenger>;

  beforeEach(() => {
    jest.resetAllMocks();
    messenger = createMessengerMock();
  });

  describe('init', () => {
    it('should subscribe to name controller and source changes when two-way bridge', () => {
      const nameController = createNameControllerMock(EMPTY_NAME_STATE);
      const bridge = new TestPetnamesBridge({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      expect(messenger.subscribe).toHaveBeenCalledWith(
        'NameController:stateChange',
        expect.any(Function),
      );
    });

    it('should not subscribe to name controller changes when one-way bridge', () => {
      const nameController = createNameControllerMock(EMPTY_NAME_STATE);
      const bridge = new TestPetnamesBridge({
        isTwoWay: false,
        nameController,
        messenger,
      });
      bridge.init();

      expect(messenger.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('synchronize Source->Petnames', () => {
    describe('default isSyncParticipant – all petname entries participate', () => {
      it('adds entry when Source entry is added', () => {
        const nameController = createNameControllerMock(EMPTY_NAME_STATE);
        const bridge = new TestPetnamesBridge({
          isTwoWay: true,
          nameController,
          messenger,
        });
        bridge.init();

        const PETNAME_ENTRY = createPetnameEntry(ADDRESS_MOCK, NAME1_MOCK);
        bridge.getSourceEntries.mockReturnValue([PETNAME_ENTRY]);

        const sourceListener = bridge.onSourceChange.mock.calls[0][0];
        sourceListener();

        expect(nameController.setName).toHaveBeenCalledTimes(1);
        expect(nameController.setName).toHaveBeenCalledWith(PETNAME_ENTRY);
      });

      it('updates entry when Source entry is updated', () => {
        const nameController = createNameControllerMock(
          createNameState(ADDRESS_MOCK, NAME1_MOCK),
        );
        const bridge = new TestPetnamesBridge({
          isTwoWay: true,
          nameController,
          messenger,
        });
        bridge.init();

        const UPDATED_PETNAME_ENTRY = createPetnameEntry(
          ADDRESS_MOCK,
          'updatedName',
        );
        bridge.getSourceEntries.mockReturnValue([UPDATED_PETNAME_ENTRY]);

        const sourceListener = bridge.onSourceChange.mock.calls[0][0];
        sourceListener();

        expect(nameController.setName).toHaveBeenCalledTimes(1);
        expect(nameController.setName).toHaveBeenCalledWith(
          UPDATED_PETNAME_ENTRY,
        );
      });

      it('deletes entry when Source entry is deleted', () => {
        const nameController = createNameControllerMock(
          createNameState(ADDRESS_MOCK, NAME1_MOCK),
        );
        const bridge = new TestPetnamesBridge({
          isTwoWay: true,
          nameController,
          messenger,
        });
        bridge.init();

        bridge.getSourceEntries.mockReturnValue(NO_SOURCE_ENTRIES);

        const sourceListener = bridge.onSourceChange.mock.calls[0][0];
        sourceListener();

        expect(nameController.setName).toHaveBeenCalledTimes(1);
        expect(nameController.setName).toHaveBeenCalledWith({
          value: ADDRESS_MOCK,
          variation: CHAIN_ID_MOCK,
          type: NameType.ETHEREUM_ADDRESS,
          // Name is set to null. sourceId and origin should not be set.
          name: null,
        });
      });
    });

    describe('isSyncParticipant override – a subset of petname entries participate', () => {
      // NOTE: isSyncParticipant override does not behave differently that the default for ADD and EDIT cases.
      it('deletes participant entry when source entry is deleted', () => {
        const nameController = createNameControllerMock({
          ...EMPTY_NAME_STATE,
          names: {
            [NameType.ETHEREUM_ADDRESS]: {
              [ADDRESS_MOCK]: {
                [CHAIN_ID_MOCK]: {
                  origin: NON_PARTICIPANT_ORIGIN_MOCK,
                  name: NAME1_MOCK,
                  sourceId: null,
                  proposedNames: {},
                },
                [FALLBACK_VARIATION]: {
                  origin: PARTICIPANT_ORIGIN_MOCK,
                  name: NAME2_MOCK,
                  sourceId: null,
                  proposedNames: {},
                },
              },
            },
          },
        });
        const bridge = new TestPetnamesBridge({
          isTwoWay: true,
          nameController,
          messenger,
        });
        bridge.isSyncParticipant.mockImplementation(isSyncParticipantMock);
        bridge.init();

        bridge.getSourceEntries.mockReturnValue(NO_SOURCE_ENTRIES);

        const sourceListener = bridge.onSourceChange.mock.calls[0][0];
        sourceListener();

        expect(nameController.setName).toHaveBeenCalledTimes(1);
        expect(nameController.setName).toHaveBeenCalledWith({
          // The ent
          value: ADDRESS_MOCK,
          variation: FALLBACK_VARIATION,
          type: NameType.ETHEREUM_ADDRESS,
          // Name is set to null. sourceId and origin should not be set.
          name: null,
        });
      });
    });
  });

  describe('synchronize Petnames->Source (two-way bridge only)', () => {
    it('should throw an error when updateSourceEntry is not overridden', () => {
      const nameController = createNameControllerMock(
        createNameState(ADDRESS_MOCK, NAME1_MOCK),
      );
      const bridge = new (class extends AbstractPetnamesBridge {
        // NOTE: updateSourceEntry is not overridden for this test class.
        getSourceEntries = jest.fn();

        onSourceChange = jest.fn();
      })({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      bridge.getSourceEntries.mockReturnValue(NO_SOURCE_ENTRIES);

      expect(() => {
        const petnamesListener = messenger.subscribe.mock
          .calls[0][1] as () => void;
        petnamesListener();
      }).toThrowError(
        'updateSourceEntry must be overridden for two-way bridges',
      );
    });

    it('calls updateSourceEntry with ADDED entry when Petnames entry is added', () => {
      const nameController = createNameControllerMock(
        createNameState(ADDRESS_MOCK, NAME1_MOCK),
      );
      const bridge = new TestPetnamesBridge({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      bridge.getSourceEntries.mockReturnValue(NO_SOURCE_ENTRIES);

      const petnamesListener = messenger.subscribe.mock
        .calls[0][1] as () => void;
      petnamesListener();

      expect(bridge.updateSourceEntry).toHaveBeenCalledTimes(1);
      expect(bridge.updateSourceEntry).toHaveBeenCalledWith(
        ChangeType.ADDED,
        createPetnameEntry(ADDRESS_MOCK, NAME1_MOCK),
      );
    });

    it('calls updateSourceEntry with UPDATED entry when Petnames entry is updated', () => {
      const nameController = createNameControllerMock(
        createNameState(ADDRESS_MOCK, NAME1_MOCK),
      );
      const bridge = new TestPetnamesBridge({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      bridge.getSourceEntries.mockReturnValue([
        createPetnameEntry(ADDRESS_MOCK, NAME1_MOCK),
      ]);

      const UPDATED_NAME = 'updatedName';
      nameController.state = createNameState(ADDRESS_MOCK, UPDATED_NAME);

      const petnamesListener = messenger.subscribe.mock
        .calls[0][1] as () => void;
      petnamesListener();

      expect(bridge.updateSourceEntry).toHaveBeenCalledTimes(1);
      expect(bridge.updateSourceEntry).toHaveBeenCalledWith(
        ChangeType.UPDATED,
        createPetnameEntry(ADDRESS_MOCK, UPDATED_NAME),
      );
    });

    it('calls updateSourceEntry with DELETED entry when Petnames entry is deleted', () => {
      const nameController = createNameControllerMock(EMPTY_NAME_STATE);
      const bridge = new TestPetnamesBridge({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      const PETNAME_ENTRY_WITH_NAME_1 = createPetnameEntry(
        ADDRESS_MOCK,
        NAME1_MOCK,
      );
      bridge.getSourceEntries.mockReturnValue([PETNAME_ENTRY_WITH_NAME_1]);

      const petnamesListener = messenger.subscribe.mock
        .calls[0][1] as () => void;
      petnamesListener();

      expect(bridge.updateSourceEntry).toHaveBeenCalledTimes(1);
      expect(bridge.updateSourceEntry).toHaveBeenCalledWith(
        ChangeType.DELETED,
        PETNAME_ENTRY_WITH_NAME_1,
      );
    });
  });
});
