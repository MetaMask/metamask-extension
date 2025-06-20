import { TransactionMeta } from '@metamask/transaction-controller';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { getTokenStandardAndDetailsByChain } from '../../../../../../../store/actions';
import { useIsNFT } from './use-is-nft';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

describe('useIsNFT', () => {
  const mockGetTokenStandardAndDetailsByChain = jest.mocked(
    getTokenStandardAndDetailsByChain,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokenStandardAndDetailsByChain.mockImplementation(() =>
      Promise.resolve({
        standard: TokenStandard.ERC721,
      }),
    );
  });

  it('identifies NFT in token with 0 decimals', async () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useIsNFT(transactionMeta),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current.isNFT).toMatchInlineSnapshot(`true`);
    expect(mockGetTokenStandardAndDetailsByChain).toHaveBeenCalledWith(
      transactionMeta.txParams.to,
      transactionMeta.txParams.from,
      undefined,
      transactionMeta.chainId,
    );
  });

  it('identifies fungible in token with greater than 0 decimals', async () => {
    mockGetTokenStandardAndDetailsByChain.mockImplementation(() =>
      Promise.resolve({
        standard: TokenStandard.ERC20,
      }),
    );

    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useIsNFT(transactionMeta),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current.isNFT).toMatchInlineSnapshot(`false`);
  });
});
