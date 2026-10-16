import { submitRequestToBackground } from '../../../../store/background-connection';
import addEthereumChain from './add-ethereum-chain';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

describe('addEthereumChain confirmation', () => {
  const mockSubmitRequest = jest.mocked(submitRequestToBackground);

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequest.mockResolvedValue('0x1');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('validates through the background only after the user approves', async () => {
    const pendingApproval = {
      id: 'network-approval',
      origin: 'https://dapp.example',
      requestData: {
        chainId: '0x1',
        chainName: 'Ethereum',
        rpcUrl: 'https://rpc.example/rpc',
        ticker: 'ETH',
        rpcPrefs: { blockExplorerUrl: null },
      },
    };
    const resolvePendingApproval = jest.fn();
    const { onSubmit } = addEthereumChain.getValues(
      pendingApproval,
      (key: string) => key,
      { resolvePendingApproval },
      jest.fn(),
      {},
    );

    expect(mockSubmitRequest).not.toHaveBeenCalled();

    const errors = await onSubmit();

    expect(mockSubmitRequest).toHaveBeenCalledWith('validateRpcEndpoint', [
      'https://rpc.example/rpc',
    ]);
    expect(resolvePendingApproval).toHaveBeenCalledWith(
      pendingApproval.id,
      pendingApproval.requestData,
    );
    expect(errors).toEqual([]);
  });

  it('keeps the approval pending when background validation fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSubmitRequest.mockRejectedValue(new Error('RPC validation failed'));
    const resolvePendingApproval = jest.fn();
    const { onSubmit } = addEthereumChain.getValues(
      {
        id: 'network-approval',
        origin: 'https://dapp.example',
        requestData: {
          chainId: '0x1',
          chainName: 'Ethereum',
          rpcUrl: 'https://rpc.example/rpc',
          ticker: 'ETH',
          rpcPrefs: { blockExplorerUrl: null },
        },
      },
      (key: string) => key,
      { resolvePendingApproval },
      jest.fn(),
      {},
    );

    const errors = await onSubmit();

    expect(resolvePendingApproval).not.toHaveBeenCalled();
    expect(errors).toEqual([
      expect.objectContaining({ id: 'ERROR_CONNECTING_TO_RPC' }),
    ]);
  });
});
