import { TransactionType } from '@metamask/transaction-controller';
import updateTxData from './updateTxData';

describe('updateTxData', () => {
  const mockAddToAddressBookIfNew = jest.fn();

  afterEach(() => {
    mockAddToAddressBookIfNew.mockClear();
  });

  it('should add to address book if txData type is simpleSend', () => {
    const txData = {
      type: TransactionType.simpleSend,
    };
    updateTxData({
      txData,
      addToAddressBookIfNew: mockAddToAddressBookIfNew,
      toAccounts: 'mockToAccounts',
      toAddress: 'mockToAddress',
    });
    expect(mockAddToAddressBookIfNew).toHaveBeenCalledWith(
      'mockToAddress',
      'mockToAccounts',
    );
  });

  it('should update estimatedBaseFee if baseFeePerGas is provided', () => {
    const txData = {};
    const result = updateTxData({
      txData,
      baseFeePerGas: 'mockBaseFeePerGas',
    });
    expect(result.estimatedBaseFee).toBe('mockBaseFeePerGas');
  });

  it('should update contractMethodName if name is provided', () => {
    const txData = {};
    const result = updateTxData({
      txData,
      name: 'mockName',
    });
    expect(result.contractMethodName).toBe('mockName');
  });

  it('should update dappProposedTokenAmount and originalApprovalAmount if dappProposedTokenAmount is provided', () => {
    const txData = {};
    const result = updateTxData({
      txData,
      dappProposedTokenAmount: 'mockDappProposedTokenAmount',
    });
    expect(result.dappProposedTokenAmount).toBe('mockDappProposedTokenAmount');
    expect(result.originalApprovalAmount).toBe('mockDappProposedTokenAmount');
  });

  it('should update customTokenAmount and finalApprovalAmount if customTokenAmount is provided', () => {
    const txData = {};
    const result = updateTxData({
      txData,
      customTokenAmount: 'mockCustomTokenAmount',
    });
    expect(result.customTokenAmount).toBe('mockCustomTokenAmount');
    expect(result.finalApprovalAmount).toBe('mockCustomTokenAmount');
  });

  it('should update finalApprovalAmount if dappProposedTokenAmount is provided but customTokenAmount is not', () => {
    const txData = {};
    const result = updateTxData({
      txData,
      dappProposedTokenAmount: 'mockDappProposedTokenAmount',
    });
    expect(result.finalApprovalAmount).toBe('mockDappProposedTokenAmount');
  });

  it('should update currentTokenBalance if currentTokenBalance is provided', () => {
    const txData = {};
    const result = updateTxData({
      txData,
      currentTokenBalance: 'mockCurrentTokenBalance',
    });
    expect(result.currentTokenBalance).toBe('mockCurrentTokenBalance');
  });

  it('should update maxFeePerGas in txParams if maxFeePerGas is provided', () => {
    const txData = { txParams: {} };
    const result = updateTxData({
      txData,
      maxFeePerGas: 'mockMaxFeePerGas',
    });
    expect(result.txParams.maxFeePerGas).toBe('mockMaxFeePerGas');
  });

  it('should update maxPriorityFeePerGas in txParams if maxPriorityFeePerGas is provided', () => {
    const txData = { txParams: {} };
    const result = updateTxData({
      txData,
      maxPriorityFeePerGas: 'mockMaxPriorityFeePerGas',
    });
    expect(result.txParams.maxPriorityFeePerGas).toBe(
      'mockMaxPriorityFeePerGas',
    );
  });
});
