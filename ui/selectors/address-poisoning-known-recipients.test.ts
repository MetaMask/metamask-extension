import { TransactionStatus } from '@metamask/transaction-controller';
import { selectAddressPoisoningKnownRecipients } from './address-poisoning-known-recipients';

describe('selectAddressPoisoningKnownRecipients', () => {
  it('includes address book entries and confirmed send recipients only', () => {
    const state = {
      metamask: {
        addressBook: {
          '0x1': {
            '0x111122223333444455556666777788889999aaaa': {
              address: '0x111122223333444455556666777788889999aaaa',
              name: 'Alice',
            },
          },
        },
        transactions: [
          {
            status: TransactionStatus.confirmed,
            txParams: {
              to: '0x22223333444455556666777788889999aaaabbbb',
            },
          },
          {
            status: TransactionStatus.submitted,
            txParams: {
              to: '0x3333444455556666777788889999aaaabbbbcccc',
            },
          },
        ],
      },
    } as Parameters<typeof selectAddressPoisoningKnownRecipients>[0];

    const { recipients } = selectAddressPoisoningKnownRecipients(state);

    expect(recipients).toEqual([
      '0x111122223333444455556666777788889999aaaa',
      '0x22223333444455556666777788889999aaaabbbb',
    ]);
  });
});
