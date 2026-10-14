import { TransactionStatus } from '@metamask/transaction-controller';
import { selectAddressPoisoningKnownAddresses } from './address-poisoning-known-addresses';

describe('selectAddressPoisoningKnownAddresses', () => {
  it('includes address book entries and confirmed send recipients', () => {
    const contact = '0xdbfa1702f1721580507c2f2c3d961e5c5fc780da';
    const recipient = '0x111122223333444455556666777788889999aaaa';

    const state = {
      metamask: {
        addressBook: {
          '0x1': {
            [contact]: {
              address: contact,
              name: 'Alice',
              chainId: '0x1',
              memo: '',
              isEns: false,
            },
          },
        },
        transactions: [
          {
            id: '1',
            status: TransactionStatus.confirmed,
            txParams: {
              to: recipient,
            },
          },
        ],
      },
    } as never;

    expect(selectAddressPoisoningKnownAddresses(state)).toEqual(
      expect.arrayContaining([contact, recipient]),
    );
  });

  it('ignores unconfirmed transactions', () => {
    const recipient = '0x111122223333444455556666777788889999aaaa';

    const state = {
      metamask: {
        addressBook: {},
        transactions: [
          {
            id: '1',
            status: TransactionStatus.unapproved,
            txParams: {
              to: recipient,
            },
          },
        ],
      },
    } as never;

    expect(selectAddressPoisoningKnownAddresses(state)).toEqual([]);
  });
});
