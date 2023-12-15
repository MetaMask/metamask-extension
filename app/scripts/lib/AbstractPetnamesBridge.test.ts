import {
  NameController,
  NameControllerState,
  NameType,
} from '@metamask/name-controller';
import {
  AbstractPetnamesBridge,
  ChangeType,
  PetnameEntry,
  PetnamesBridgeMessenger,
} from './AbstractPetnamesBridge';

const ADDRESS_A = '0xabc';
const NAME_1 = 'name1';
const NAME_2 = 'name2';
const CHAIN_ID_MOCK = '0x1';

const NO_SOURCE_ENTRIES: PetnameEntry[] = [];

const EMPTY_NAME_STATE: NameControllerState = {
  names: {
    ethereumAddress: {},
  },
  nameSources: {},
};

const PETNAME_ENTRY_WITH_NAME_1: PetnameEntry = {
  value: ADDRESS_A,
  type: NameType.ETHEREUM_ADDRESS,
  name: NAME_1,
  sourceId: null,
  variation: CHAIN_ID_MOCK,
};

// PETNAME_ENTRY_WITH_NAME_1 above is the only entry in this NameController state.
const NAME_STATE_WITH_PETNAME_NAME_1: NameControllerState = {
  ...EMPTY_NAME_STATE,
  names: {
    ethereumAddress: {
      [ADDRESS_A]: {
        [CHAIN_ID_MOCK]: {
          name: NAME_1,
          sourceId: null,
          proposedNames: {},
        },
      },
    },
  },
};

class TestPetnamesBridge extends AbstractPetnamesBridge {
  getSourceEntries = jest.fn();

  updateSourceEntry = jest.fn();

  onSourceChange = jest.fn();
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

      expect(bridge.onSourceChange).toHaveBeenCalledWith(expect.any(Function));
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
      expect(bridge.onSourceChange).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('synchronize Source->Petnames', () => {
    it('adds entry when Source entry is added', () => {
      const nameController = createNameControllerMock(EMPTY_NAME_STATE);
      const bridge = new TestPetnamesBridge({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      bridge.getSourceEntries.mockReturnValue([PETNAME_ENTRY_WITH_NAME_1]);

      const sourceListener = bridge.onSourceChange.mock.calls[0][0];
      sourceListener();

      expect(nameController.setName).toHaveBeenCalledTimes(1);
      expect(nameController.setName).toHaveBeenCalledWith(
        PETNAME_ENTRY_WITH_NAME_1,
      );
    });

    it('updates entry when Source entry is updated', () => {
      const nameController = createNameControllerMock(
        NAME_STATE_WITH_PETNAME_NAME_1,
      );
      const bridge = new TestPetnamesBridge({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      const UPDATED_PETNAME_ENTRY_MOCK: PetnameEntry = {
        ...PETNAME_ENTRY_WITH_NAME_1,
        name: NAME_2,
      };

      bridge.getSourceEntries.mockReturnValue([UPDATED_PETNAME_ENTRY_MOCK]);

      const sourceListener = bridge.onSourceChange.mock.calls[0][0];
      sourceListener();

      expect(nameController.setName).toHaveBeenCalledTimes(1);
      expect(nameController.setName).toHaveBeenCalledWith(
        UPDATED_PETNAME_ENTRY_MOCK,
      );
    });

    it('deletes entry when Source entry is deleted if two-way bridge', () => {
      const nameController = createNameControllerMock(
        NAME_STATE_WITH_PETNAME_NAME_1,
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
        ...PETNAME_ENTRY_WITH_NAME_1,
        name: null,
      });
    });

    it('should not delete Petname entries when Source entry is deleted if not two-way bridge', () => {
      const nameController = createNameControllerMock(
        NAME_STATE_WITH_PETNAME_NAME_1,
      );
      const bridge = new TestPetnamesBridge({
        isTwoWay: false,
        nameController,
        messenger,
      });
      bridge.init();

      bridge.getSourceEntries.mockReturnValue(NO_SOURCE_ENTRIES);

      const sourceListener = bridge.onSourceChange.mock.calls[0][0];
      sourceListener();

      expect(nameController.setName).not.toHaveBeenCalled();
    });
  });

  describe('synchronize Petnames->Source (two-way bridge only)', () => {
    it('should throw an error when updateSourceEntry is not overridden', () => {
      const nameController = createNameControllerMock(
        NAME_STATE_WITH_PETNAME_NAME_1,
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
        const petnamesListener = messenger.subscribe.mock.calls[0][1];
        petnamesListener(NAME_STATE_WITH_PETNAME_NAME_1, EMPTY_NAME_STATE);
      }).toThrowError(
        'updateSourceEntry must be overridden for two-way bridges',
      );
    });

    it('calls updateSourceEntry with ADDED entry when Petnames entry is added', () => {
      const nameController = createNameControllerMock(
        NAME_STATE_WITH_PETNAME_NAME_1,
      );
      const bridge = new TestPetnamesBridge({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      bridge.getSourceEntries.mockReturnValue(NO_SOURCE_ENTRIES);

      const petnamesListener = messenger.subscribe.mock.calls[0][1];
      petnamesListener(EMPTY_NAME_STATE, NAME_STATE_WITH_PETNAME_NAME_1);

      expect(bridge.updateSourceEntry).toHaveBeenCalledTimes(1);
      expect(bridge.updateSourceEntry).toHaveBeenCalledWith(
        ChangeType.ADDED,
        PETNAME_ENTRY_WITH_NAME_1,
      );
    });

    it('calls updateSourceEntry with UPDATED entry when Petnames entry is updated', () => {
      const nameController = createNameControllerMock(
        NAME_STATE_WITH_PETNAME_NAME_1,
      );
      const bridge = new TestPetnamesBridge({
        isTwoWay: true,
        nameController,
        messenger,
      });
      bridge.init();

      bridge.getSourceEntries.mockReturnValue([
        { ...PETNAME_ENTRY_WITH_NAME_1, name: NAME_2 },
      ]);

      const petnamesListener = messenger.subscribe.mock.calls[0][1];
      petnamesListener(EMPTY_NAME_STATE, NAME_STATE_WITH_PETNAME_NAME_1);

      expect(bridge.updateSourceEntry).toHaveBeenCalledTimes(1);
      expect(bridge.updateSourceEntry).toHaveBeenCalledWith(
        ChangeType.UPDATED,
        PETNAME_ENTRY_WITH_NAME_1,
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

      bridge.getSourceEntries.mockReturnValue([PETNAME_ENTRY_WITH_NAME_1]);

      const petnamesListener = messenger.subscribe.mock.calls[0][1];
      petnamesListener(EMPTY_NAME_STATE, NAME_STATE_WITH_PETNAME_NAME_1);

      expect(bridge.updateSourceEntry).toHaveBeenCalledTimes(1);
      expect(bridge.updateSourceEntry).toHaveBeenCalledWith(
        ChangeType.DELETED,
        PETNAME_ENTRY_WITH_NAME_1,
      );
    });
  });
});
