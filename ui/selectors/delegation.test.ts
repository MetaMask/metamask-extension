import { DelegationEntry } from '@metamask/delegation-controller';
import {
  createDelegation,
  getDelegationHashOffchain,
} from '../../shared/lib/delegation';
import {
  listDelegationEntries,
  getDelegationEntry,
  type DelegationState,
} from './delegation';

const MOCK_CHAIN_ID = '0x1';

const ALICE = '0x44c7E1cbD5a7402bC31Bf637E57d27ff559c66c9';
const BOB = '0x2f6fC5E27628158758ae4688BbA809c62713d152';
const CHARLIE = '0xD51891b00847cB1497399c34F6F9Ab9a952a6704';

const ENTRY_1: DelegationEntry = {
  delegation: createDelegation({
    from: ALICE,
    to: BOB,
    caveats: [],
  }),
  tags: ['send', 'swap'],
  chainId: MOCK_CHAIN_ID,
};

const HASH_1 = getDelegationHashOffchain(ENTRY_1.delegation);

const ENTRY_2: DelegationEntry = {
  delegation: createDelegation({
    from: BOB,
    to: CHARLIE,
    parentDelegation: ENTRY_1.delegation,
    caveats: [],
  }),
  tags: ['send'],
  chainId: MOCK_CHAIN_ID,
};

const HASH_2 = getDelegationHashOffchain(ENTRY_2.delegation);

const ENTRY_3: DelegationEntry = {
  delegation: createDelegation({
    from: ALICE,
    to: CHARLIE,
    caveats: [],
  }),
  tags: ['swap'],
  chainId: MOCK_CHAIN_ID,
};

const HASH_3 = getDelegationHashOffchain(ENTRY_3.delegation);

function getMockState(): DelegationState {
  return {
    metamask: {
      delegations: {
        [HASH_1]: ENTRY_1,
        [HASH_2]: ENTRY_2,
        [HASH_3]: ENTRY_3,
      },
    },
  };
}

describe('Delegation Selectors', () => {
  describe('#listDelegationEntries', () => {
    it('returns an empty array if no delegations are present', () => {
      expect(
        listDelegationEntries(
          {
            metamask: {
              delegations: {},
            },
          },
          {},
        ),
      ).toStrictEqual([]);
    });

    it('returns all entries if no filter provided', () => {
      expect(
        listDelegationEntries(getMockState(), {
          filter: undefined,
        }),
      ).toStrictEqual([ENTRY_1, ENTRY_2, ENTRY_3]);
    });

    it('returns entries that match `from` filter', () => {
      expect(
        listDelegationEntries(getMockState(), {
          filter: {
            from: ALICE,
          },
        }),
      ).toStrictEqual([ENTRY_1, ENTRY_3]);
    });

    it('returns entries that match `to` filter', () => {
      expect(
        listDelegationEntries(getMockState(), {
          filter: {
            to: CHARLIE,
          },
        }),
      ).toStrictEqual([ENTRY_2, ENTRY_3]);
    });

    it('returns entries that match `chainId` filter', () => {
      expect(
        listDelegationEntries(getMockState(), {
          filter: {
            chainId: MOCK_CHAIN_ID,
          },
        }),
      ).toStrictEqual([ENTRY_1, ENTRY_2, ENTRY_3]);

      expect(
        listDelegationEntries(getMockState(), {
          filter: {
            chainId: '0xdeadbeef',
          },
        }),
      ).toStrictEqual([]);
    });

    it('returns entries that match `tags` filter', () => {
      expect(
        listDelegationEntries(getMockState(), {
          filter: {
            tags: ['send'],
          },
        }),
      ).toStrictEqual([ENTRY_1, ENTRY_2]);

      expect(
        listDelegationEntries(getMockState(), {
          filter: {
            tags: ['swap'],
          },
        }),
      ).toStrictEqual([ENTRY_1, ENTRY_3]);

      expect(
        listDelegationEntries(getMockState(), {
          filter: {
            tags: ['0xdeadbeef'],
          },
        }),
      ).toStrictEqual([]);
    });
  });

  describe('#getDelegationEntry', () => {
    it('returns the correct entry for a valid hash', () => {
      expect(getDelegationEntry(getMockState(), HASH_1)).toStrictEqual(ENTRY_1);
      expect(getDelegationEntry(getMockState(), HASH_2)).toStrictEqual(ENTRY_2);
      expect(getDelegationEntry(getMockState(), HASH_3)).toStrictEqual(ENTRY_3);
    });

    it('returns undefined for a non-existent hash', () => {
      expect(getDelegationEntry(getMockState(), '0xdeadbeef')).toBeUndefined();
    });

    it('returns undefined if delegations object is empty', () => {
      expect(
        getDelegationEntry({ metamask: { delegations: {} } }, HASH_1),
      ).toBeUndefined();
    });
  });
});
