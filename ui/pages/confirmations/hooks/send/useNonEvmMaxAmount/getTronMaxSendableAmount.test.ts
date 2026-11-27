import { InternalAccount } from '@metamask/keyring-internal-api';

import { Numeric } from '../../../../../../shared/lib/Numeric';
import { getMaxSendableAmountMultichain } from '../../../utils/multichain-snaps';
import { getTronMaxSendableAmount } from './getTronMaxSendableAmount';
import type { MaxSendableAmountRequest } from './types';

jest.mock('../../../utils/multichain-snaps', () => ({
  getMaxSendableAmountMultichain: jest.fn(),
}));

const TRON_ACCOUNT = {
  id: 'tron-account-id',
  address: 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
} as unknown as InternalAccount;

const ASSET_ID = 'tron:728126428/slip44:195';
const TO_ADDRESS = 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq';

const mockGetMaxSendableAmount = jest.mocked(getMaxSendableAmountMultichain);

const getRequest = (
  overrides: Partial<MaxSendableAmountRequest> = {},
): MaxSendableAmountRequest => ({
  fromAccount: TRON_ACCOUNT,
  assetId: ASSET_ID,
  balance: {
    rawBalanceNumeric: new Numeric('10000000', 10),
    decimals: 6,
    isNative: true,
  },
  ...overrides,
});

describe('getTronMaxSendableAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the amount quoted by the Snap', async () => {
    mockGetMaxSendableAmount.mockResolvedValue({ amount: '9.5' });

    const result = await getTronMaxSendableAmount(getRequest());

    expect(result).toBe('9.5');
    expect(mockGetMaxSendableAmount).toHaveBeenCalledWith(TRON_ACCOUNT, {
      accountId: TRON_ACCOUNT.id,
      assetId: ASSET_ID,
    });
  });

  it('passes the recipient when it is a Tron address', async () => {
    mockGetMaxSendableAmount.mockResolvedValue({ amount: '9.5' });

    await getTronMaxSendableAmount(getRequest({ toAddress: TO_ADDRESS }));

    expect(mockGetMaxSendableAmount).toHaveBeenCalledWith(TRON_ACCOUNT, {
      accountId: TRON_ACCOUNT.id,
      assetId: ASSET_ID,
      toAddress: TO_ADDRESS,
    });
  });

  it('omits the recipient when it is not a Tron address', async () => {
    mockGetMaxSendableAmount.mockResolvedValue({ amount: '9.5' });

    await getTronMaxSendableAmount(getRequest({ toAddress: '0x123' }));

    expect(mockGetMaxSendableAmount).toHaveBeenCalledWith(TRON_ACCOUNT, {
      accountId: TRON_ACCOUNT.id,
      assetId: ASSET_ID,
    });
  });

  it('reserves 1.1 TRX when the Snap cannot quote a native maximum', async () => {
    mockGetMaxSendableAmount.mockRejectedValue(new Error('Snap unavailable'));

    expect(await getTronMaxSendableAmount(getRequest())).toBe('8.9');
  });

  it('reserves nothing when the Snap cannot quote a TRC-20 maximum', async () => {
    mockGetMaxSendableAmount.mockRejectedValue(new Error('Snap unavailable'));

    const result = await getTronMaxSendableAmount(
      getRequest({
        balance: {
          rawBalanceNumeric: new Numeric('10000000', 10),
          decimals: 6,
          isNative: false,
        },
      }),
    );

    expect(result).toBe('10');
  });

  it('returns zero when the native balance cannot cover the reserve', async () => {
    mockGetMaxSendableAmount.mockRejectedValue(new Error('Snap unavailable'));

    const result = await getTronMaxSendableAmount(
      getRequest({
        balance: {
          rawBalanceNumeric: new Numeric('1000000', 10),
          decimals: 6,
          isNative: true,
        },
      }),
    );

    expect(result).toBe('0');
  });

  it('falls back when the Snap returns no amount', async () => {
    mockGetMaxSendableAmount.mockResolvedValue(
      undefined as unknown as { amount: string },
    );

    expect(await getTronMaxSendableAmount(getRequest())).toBe('8.9');
  });
});
