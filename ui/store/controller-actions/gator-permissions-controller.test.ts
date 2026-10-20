import { submitRequestToBackground } from '../background-connection';
import {
  addPendingRevocation,
  checkDelegationDisabled,
  fetchAndUpdateGatorPermissions,
  submitDirectRevocation,
} from './gator-permissions-controller';

jest.mock('../background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('gator permissions actions', () => {
  it('fetches permissions through the Gator Permissions Controller messenger action', async () => {
    await fetchAndUpdateGatorPermissions();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'GatorPermissionsController:fetchAndUpdateGatorPermissions',
    );
  });

  it('adds a pending revocation through the Gator Permissions Controller messenger action', async () => {
    const params = {
      txId: 'transaction-id',
      permissionContext: '0xabcd' as const,
    };

    await addPendingRevocation(params);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'GatorPermissionsController:addPendingRevocation',
      [params],
    );
  });

  it('submits a direct revocation through the Gator Permissions Controller messenger action', async () => {
    const params = {
      permissionContext: '0xabcd' as const,
      txHash: undefined,
    };

    await submitDirectRevocation(params);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'GatorPermissionsController:submitDirectRevocation',
      [
        {
          permissionContext: '0xabcd',
          txHash: undefined,
        },
      ],
    );
  });

  it('checks delegation status through the legacy background API service messenger action', async () => {
    mockSubmitRequestToBackground.mockResolvedValue(true);

    const result = await checkDelegationDisabled(
      '0x0000000000000000000000000000000000000001',
      '0x1234',
      'mainnet',
    );

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'LegacyBackgroundApiService:checkDelegationDisabled',
      ['0x0000000000000000000000000000000000000001', '0x1234', 'mainnet'],
    );
    expect(result).toBe(true);
  });
});
