import { submitRequestToBackground } from '../background-connection';
import { signDelegation } from './delegation-controller';

jest.mock('../background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('signDelegation', () => {
  it('signs the delegation through the delegation controller messenger action', async () => {
    const delegation = {
      delegate: '0x0000000000000000000000000000000000000001',
    };
    const chainId = '0x1' as const;
    const signature = '0xabcd' as const;
    mockSubmitRequestToBackground.mockResolvedValue(signature);

    // @ts-expect-error The action-forwarding test does not need a complete
    // delegation fixture.
    const result = await signDelegation({ delegation, chainId });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'DelegationController:signDelegation',
      [{ delegation, chainId }],
    );
    expect(result).toBe(signature);
  });
});
