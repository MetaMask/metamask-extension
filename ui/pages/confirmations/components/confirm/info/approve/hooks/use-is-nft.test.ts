import { TransactionMeta } from '@metamask/transaction-controller';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { getTokenStandardAndDetails } from '../../../../../../../store/actions';
import { useIsNFT } from './use-is-nft';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getTokenStandardAndDetails: jest.fn(),
}));

describe('useIsNFT', () => {
  it('identifies NFT in token with 0 decimals', async () => {
    const getTokenStandardAndDetailsMock = jest
      .fn()
      .mockImplementation(() => ({ standard: TokenStandard.ERC721 }));

    (getTokenStandardAndDetails as jest.Mock).mockImplementation(
      getTokenStandardAndDetailsMock,
    );

    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () => useIsNFT(transactionMeta),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current.isNFT).toMatchInlineSnapshot(`true`);
  });

  it('identifies fungible in token with greater than 0 decimals', async () => {
    const getTokenStandardAndDetailsMock = jest
      .fn()
      .mockImplementation(() => ({ standard: TokenStandard.ERC20 }));

    (getTokenStandardAndDetails as jest.Mock).mockImplementation(
      getTokenStandardAndDetailsMock,
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
