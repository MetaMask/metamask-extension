import {
  getAddressBookByNetwork,
  getAddressBookMapByNetwork,
  getAddressBookEntryByNetwork,
} from './address-book';

describe('address-book selectors', () => {
  const state = {
    metamask: {
      addressBook: {
        '0x1': {
          '0xabc': {
            address: '0xAbC',
            name: 'Alice',
            chainId: '0x1' as const,
            memo: '',
            isEns: false,
          },
          '0xdef': {
            address: '0xDef',
            name: 'Bob',
            chainId: '0x1' as const,
            memo: '',
            isEns: false,
          },
        },
      },
    },
  };

  it('gets network entries and memoizes by chain ID', () => {
    const entries = getAddressBookByNetwork(state, '0x1');
    const sameEntries = getAddressBookByNetwork(state, '0x1');

    expect(entries).toHaveLength(2);
    expect(sameEntries).toBe(entries);
    expect(getAddressBookByNetwork(state, '0x2')).toStrictEqual([]);
  });
  describe('getAddressBookMapByNetwork', () => {
    it('builds a map keyed by lowercased address', () => {
      const map = getAddressBookMapByNetwork(state, '0x1');
      expect(map.size).toBe(2);
      expect(map.get('0xabc')).toStrictEqual({
        address: '0xAbC',
        name: 'Alice',
        chainId: '0x1',
        memo: '',
        isEns: false,
      });
      expect(map.get('0xdef')).toStrictEqual({
        address: '0xDef',
        name: 'Bob',
        chainId: '0x1',
        memo: '',
        isEns: false,
      });
    });

    it('returns an empty map for an unknown chain', () => {
      expect(getAddressBookMapByNetwork(state, '0x2').size).toBe(0);
    });

    it('memoizes the map by chain ID', () => {
      const map1 = getAddressBookMapByNetwork(state, '0x1');
      const map2 = getAddressBookMapByNetwork(state, '0x1');
      expect(map1).toBe(map2);
    });
  });

  describe('getAddressBookEntryByNetwork', () => {
    it('finds entries case-insensitively via O(1) map lookup', () => {
      expect(getAddressBookEntryByNetwork(state, '0xabc', '0x1')).toStrictEqual(
        {
          address: '0xAbC',
          name: 'Alice',
          chainId: '0x1',
          memo: '',
          isEns: false,
        },
      );
      expect(getAddressBookEntryByNetwork(state, '0xABC', '0x1')).toStrictEqual(
        {
          address: '0xAbC',
          name: 'Alice',
          chainId: '0x1',
          memo: '',
          isEns: false,
        },
      );
    });

    it('returns undefined for an unknown address', () => {
      expect(
        getAddressBookEntryByNetwork(state, '0x999', '0x1'),
      ).toBeUndefined();
    });

    it('returns undefined for an unknown chain', () => {
      expect(
        getAddressBookEntryByNetwork(state, '0xabc', '0x2'),
      ).toBeUndefined();
    });
  });
});
