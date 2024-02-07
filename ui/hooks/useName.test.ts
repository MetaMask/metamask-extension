import {
  FALLBACK_VARIATION,
  NameControllerState,
  NameEntry,
  NameOrigin,
  NameType,
} from '@metamask/name-controller';
import { getCurrentChainId, getNames } from '../selectors';
import { useName } from './useName';

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => selector(),
}));

jest.mock('../selectors', () => ({
  getCurrentChainId: jest.fn(),
  getNames: jest.fn(),
}));

const CHAIN_ID_MOCK = '0x1';
const CHAIN_ID_2_MOCK = '0x2';
const VALUE_MOCK = '0xabc123';
const TYPE_MOCK = NameType.ETHEREUM_ADDRESS;
const NAME_MOCK = 'TestName';
const SOURCE_ID_MOCK = 'TestSourceId';
const ORIGIN_MOCK = NameOrigin.API;
const PROPOSED_NAMES_MOCK = {
  [SOURCE_ID_MOCK]: {
    proposedNames: ['TestProposedName', 'TestProposedName2'],
    lastRequestTime: null,
    updateDelay: null,
  },
};

describe('useName', () => {
  const getCurrentChainIdMock = jest.mocked(getCurrentChainId);
  const getNamesMock =
    jest.mocked<(state: any) => NameControllerState['names']>(getNames);

  beforeEach(() => {
    jest.resetAllMocks();

    getCurrentChainIdMock.mockReturnValue(CHAIN_ID_MOCK);
  });

  it('returns default values if no state', () => {
    getNamesMock.mockReturnValue({} as NameControllerState['names']);

    const nameEntry = useName(VALUE_MOCK, TYPE_MOCK);

    expect(nameEntry).toStrictEqual<NameEntry>({
      name: null,
      sourceId: null,
      origin: null,
      proposedNames: {},
    });
  });

  it('returns default values if no entry', () => {
    getNamesMock.mockReturnValue({
      [TYPE_MOCK]: {
        [VALUE_MOCK]: {
          [CHAIN_ID_2_MOCK]: {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName(VALUE_MOCK, TYPE_MOCK);

    expect(nameEntry).toStrictEqual<NameEntry>({
      name: null,
      sourceId: null,
      origin: null,
      proposedNames: {},
    });
  });

  it('returns entry if found', () => {
    getNamesMock.mockReturnValue({
      [TYPE_MOCK]: {
        [VALUE_MOCK]: {
          [CHAIN_ID_MOCK]: {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName(VALUE_MOCK, TYPE_MOCK);

    expect(nameEntry).toStrictEqual<NameEntry>({
      name: NAME_MOCK,
      sourceId: SOURCE_ID_MOCK,
      proposedNames: PROPOSED_NAMES_MOCK,
      origin: ORIGIN_MOCK,
    });
  });

  it('uses variation if specified', () => {
    getNamesMock.mockReturnValue({
      [TYPE_MOCK]: {
        [VALUE_MOCK]: {
          [CHAIN_ID_2_MOCK]: {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, CHAIN_ID_2_MOCK);

    expect(nameEntry).toStrictEqual<NameEntry>({
      name: NAME_MOCK,
      sourceId: SOURCE_ID_MOCK,
      proposedNames: PROPOSED_NAMES_MOCK,
      origin: ORIGIN_MOCK,
    });
  });

  describe('fallback variation', () => {
    it('is used if specified variation has no entry.', () => {
      getNamesMock.mockReturnValue({
        [TYPE_MOCK]: {
          [VALUE_MOCK]: {
            [FALLBACK_VARIATION]: {
              name: NAME_MOCK,
              proposedNames: PROPOSED_NAMES_MOCK,
              sourceId: SOURCE_ID_MOCK,
              origin: ORIGIN_MOCK,
            },
          },
        },
      });

      const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, CHAIN_ID_2_MOCK);

      expect(nameEntry).toStrictEqual<NameEntry>({
        name: NAME_MOCK,
        sourceId: SOURCE_ID_MOCK,
        proposedNames: PROPOSED_NAMES_MOCK,
        origin: ORIGIN_MOCK,
      });
    });

    it('is used if specified variation has entry with cleared name', () => {
      getNamesMock.mockReturnValue({
        [TYPE_MOCK]: {
          [VALUE_MOCK]: {
            [CHAIN_ID_2_MOCK]: {
              name: null,
              proposedNames: PROPOSED_NAMES_MOCK,
              sourceId: null,
              origin: null,
            },
            [FALLBACK_VARIATION]: {
              name: NAME_MOCK,
              proposedNames: {},
              sourceId: SOURCE_ID_MOCK,
              origin: ORIGIN_MOCK,
            },
          },
        },
      });

      const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, CHAIN_ID_2_MOCK);

      expect(nameEntry).toStrictEqual<NameEntry>({
        name: NAME_MOCK,
        proposedNames: {},
        sourceId: SOURCE_ID_MOCK,
        origin: ORIGIN_MOCK,
      });
    });
  });

  it('uses empty string as variation if not specified and type is not address', () => {
    const alternateType = 'alternateType' as NameType;

    getNamesMock.mockReturnValue({
      [alternateType]: {
        [VALUE_MOCK]: {
          '': {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName(VALUE_MOCK, alternateType);

    expect(nameEntry).toStrictEqual<NameEntry>({
      name: NAME_MOCK,
      sourceId: SOURCE_ID_MOCK,
      proposedNames: PROPOSED_NAMES_MOCK,
      origin: ORIGIN_MOCK,
    });
  });

  it('normalizes addresses to lowercase', () => {
    getNamesMock.mockReturnValue({
      [TYPE_MOCK]: {
        [VALUE_MOCK]: {
          [CHAIN_ID_MOCK]: {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName('0xAbC123', TYPE_MOCK);

    expect(nameEntry).toStrictEqual<NameEntry>({
      name: NAME_MOCK,
      sourceId: SOURCE_ID_MOCK,
      proposedNames: PROPOSED_NAMES_MOCK,
      origin: ORIGIN_MOCK,
    });
  });
});
