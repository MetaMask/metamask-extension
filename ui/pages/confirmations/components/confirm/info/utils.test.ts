import { DecodedTransactionDataSource } from '../../../../../../shared/types/transaction-decode';
import { getIsRevokeSetApprovalForAll } from './utils';

describe('getIsRevokeSetApprovalForAll', () => {
  it('returns false if no data is passed as an argument', () => {
    const testValue = {
      data: [],
      source: DecodedTransactionDataSource.FourByte,
    };
    const actual = getIsRevokeSetApprovalForAll(testValue);

    expect(actual).toEqual(false);
  });

  it('returns true if no setApprovalForAll decoded tx is passed as an argument', () => {
    const testValue = {
      data: [
        {
          name: 'setApprovalForAll',
          params: [
            {
              type: 'address',
              value: '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B',
            },
            {
              type: 'boolean',
              value: false,
            },
          ],
        },
      ],
      source: DecodedTransactionDataSource.FourByte,
    };
    const actual = getIsRevokeSetApprovalForAll(testValue);

    expect(actual).toEqual(true);
  });
});
