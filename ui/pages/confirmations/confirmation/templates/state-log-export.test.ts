import { providerErrors } from '@metamask/rpc-errors';
import stateLogExport from './state-log-export';

const mockStateString = '{"metamask":{"isInitialized":true},"logs":[]}';

describe('state-log-export confirmation template', () => {
  const mockLogStateString = jest.fn().mockResolvedValue(mockStateString);
  const mockResolvePendingApproval = jest.fn();
  const mockRejectPendingApproval = jest.fn();
  const mockT = (key: string) => key;

  const pendingApproval = {
    id: 'test-approval-id',
    origin: 'https://support.metamask.io',
    type: 'stateLogExport:userConsent',
    requestData: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'logStateString', {
      value: mockLogStateString,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'logStateString');
  });

  it('resolves approval with the state log string from logStateString', async () => {
    const { onSubmit } = stateLogExport.getValues(pendingApproval, mockT, {
      resolvePendingApproval: mockResolvePendingApproval,
      rejectPendingApproval: mockRejectPendingApproval,
    });

    await onSubmit();

    expect(mockLogStateString).toHaveBeenCalledTimes(1);
    expect(mockResolvePendingApproval).toHaveBeenCalledWith(
      pendingApproval.id,
      mockStateString,
    );
  });

  it('rejects approval when logStateString fails', async () => {
    const error = new Error('Failed to export state logs');
    mockLogStateString.mockRejectedValueOnce(error);

    const { onSubmit } = stateLogExport.getValues(pendingApproval, mockT, {
      resolvePendingApproval: mockResolvePendingApproval,
      rejectPendingApproval: mockRejectPendingApproval,
    });

    await expect(onSubmit()).rejects.toThrow(error);
    expect(mockResolvePendingApproval).not.toHaveBeenCalled();
  });

  it('rejects approval on cancel', () => {
    const { onCancel } = stateLogExport.getValues(pendingApproval, mockT, {
      resolvePendingApproval: mockResolvePendingApproval,
      rejectPendingApproval: mockRejectPendingApproval,
    });

    onCancel();

    expect(mockRejectPendingApproval).toHaveBeenCalledWith(
      pendingApproval.id,
      providerErrors.userRejectedRequest().serialize(),
    );
  });
});
