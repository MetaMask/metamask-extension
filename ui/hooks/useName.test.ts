import {
  FALLBACK_VARIATION,
  NameControllerState,
  NameEntry,
  NameOrigin,
  NameType,
} from '@metamask/name-controller';
import { getNames } from '../selectors';
import { useName } from './useName';

jest.mock('react-redux', () => ({
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: any) => selector(),
}));

jest.mock('../selectors', () => ({
  getNames: jest.fn(),
}));

const VARIATION_MOCK = '0x1';
const VARIATION_2_MOCK = '0x2';
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
  const getNamesMock =
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.mocked<(state: any) => NameControllerState['names']>(getNames);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns default values if no state', () => {
    getNamesMock.mockReturnValue({} as NameControllerState['names']);

    const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, VARIATION_MOCK);

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
          [VARIATION_2_MOCK]: {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, VARIATION_MOCK);

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
          [VARIATION_MOCK]: {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, VARIATION_MOCK);

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
          [VARIATION_2_MOCK]: {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, VARIATION_2_MOCK);

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

      const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, VARIATION_2_MOCK);

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
            [VARIATION_2_MOCK]: {
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

      const nameEntry = useName(VALUE_MOCK, TYPE_MOCK, VARIATION_2_MOCK);

      expect(nameEntry).toStrictEqual<NameEntry>({
        name: NAME_MOCK,
        proposedNames: {},
        sourceId: SOURCE_ID_MOCK,
        origin: ORIGIN_MOCK,
      });
    });
  });

  it('normalizes addresses to lowercase', () => {
    getNamesMock.mockReturnValue({
      [TYPE_MOCK]: {
        [VALUE_MOCK]: {
          [VARIATION_MOCK]: {
            name: NAME_MOCK,
            proposedNames: PROPOSED_NAMES_MOCK,
            sourceId: SOURCE_ID_MOCK,
            origin: ORIGIN_MOCK,
          },
        },
      },
    });

    const nameEntry = useName('0xAbC123', TYPE_MOCK, VARIATION_MOCK);

    expect(nameEntry).toStrictEqual<NameEntry>({
      name: NAME_MOCK,
      sourceId: SOURCE_ID_MOCK,
      proposedNames: PROPOSED_NAMES_MOCK,
      origin: ORIGIN_MOCK,
    });
  });
});
