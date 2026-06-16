import {
  getAddressBookByNetwork,
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
  it('finds address entries case-insensitively', () => {
    expect(getAddressBookEntryByNetwork(state, '0xabc', '0x1')).toStrictEqual({
      address: '0xAbC',
      name: 'Alice',
      chainId: '0x1',
      memo: '',
      isEns: false,
    });
    expect(getAddressBookEntryByNetwork(state, '0x999', '0x1')).toBeUndefined();
  });
});
