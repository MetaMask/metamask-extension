import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { createProjectLogger } from '@metamask/utils';
import { isSolanaChainId } from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import { submitBridgeTx, submitIntent } from '../../../ducks/bridge-status/actions';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import {
  getIsSmartTransaction,
  isHardwareWallet,
} from '../../../../shared/modules/selectors';
import { getFromChain } from '../../../ducks/bridge/selectors';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import { captureException } from '../../../../shared/lib/sentry';
import { submitRequestToBackground } from '../../../store/background-connection';

const ALLOWANCE_RESET_ERROR = 'Eth USDT allowance reset failed';
const APPROVAL_TX_ERROR = 'Approve transaction failed';

const debugLog = createProjectLogger('bridge');

export const isAllowanceResetError = (error: unknown): boolean => {
  const errorMessage = (error as Error).message ?? '';
  return errorMessage.includes(ALLOWANCE_RESET_ERROR);
};

export const isApprovalTxError = (error: unknown): boolean => {
  const errorMessage = (error as Error).message ?? '';
  return errorMessage.includes(APPROVAL_TX_ERROR);
};

const isHardwareWalletUserRejection = (error: unknown): boolean => {
  const errorMessage = (error as Error).message?.toLowerCase() ?? '';
  return (
    // Ledger rejection
    (errorMessage.includes('ledger') &&
      (errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('error while signing'))) ||
    // Trezor rejection
    (errorMessage.includes('trezor') &&
      (errorMessage.includes('cancelled') ||
        errorMessage.includes('rejected'))) ||
    // Lattice rejection
    (errorMessage.includes('lattice') && errorMessage.includes('rejected')) ||
    // Generic hardware wallet rejections
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user cancelled')
  );
};

export default function useSubmitBridgeTransaction() {
  const history = useHistory();
  const dispatch = useDispatch();
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const fromChain = useSelector(getFromChain);
  const smartTransactionsEnabled = useSelector((state) =>
    getIsSmartTransaction(state as never, fromChain?.chainId),
  );

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    if (hardwareWalletUsed) {
      history.push(`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`);
    }

    // Execute transaction(s)
    try {
      if (isSolanaChainId(quoteResponse.quote.srcChainId)) {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push({
          pathname: DEFAULT_ROUTE,
          state: { stayOnHomePage: true },
        });
        await dispatch(submitBridgeTx(quoteResponse, false));
        return;
      }
      // Intent-based flow (UI fast path): sign EIP-712 and submit to background
      const intent = (quoteResponse as any).quote.intent;
      if (intent && intent.protocol === 'cowswap') {
        const accountAddress = selectedAccount?.address;
        if (!accountAddress) {
          throw new Error('Missing selected account for intent signing');
        }

  const chainId = quoteResponse.quote.srcChainId;
  const verifyingContract = intent.settlementContract ?? '0x9008D19f58AAbd9eD0D60971565AA8510560ab41';

  // Types/Domain EIP-712 gérés côté background (intent.ts)

        const order = intent.order;
        if (!order?.sellToken || !order?.buyToken || !order?.validTo || !order?.appData || !order?.feeAmount || !order?.kind) {
          throw new Error('Intent order is missing required fields');
        }
        if (!order.sellAmount && !order.buyAmount) {
          throw new Error('Intent order requires sellAmount or buyAmount');
        }

        const message = {
          sellToken: order.sellToken,
          buyToken: order.buyToken,
          receiver: order.receiver ?? accountAddress,
          sellAmount: order.sellAmount ?? '0',
          buyAmount: order.buyAmount ?? '0',
          validTo: Number(order.validTo),
          appData: order.appData,
          feeAmount: '0',
          kind: order.kind,
          partiallyFillable: Boolean(order.partiallyFillable),
          sellTokenBalance: 'erc20',
          buyTokenBalance: 'erc20',
        };

  // Domain construit côté background

        // Signe l'intent via un endpoint background dédié (pattern "delegation")
        const signature: string = await submitRequestToBackground(
          'signIntent' as unknown as keyof Record<string, unknown>,
          [
            {
              chainId,
              from: accountAddress,
              order: message,
              verifyingContract,
            } as unknown as Record<string, unknown>,
          ] as unknown as any[],
        );

        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push({ pathname: DEFAULT_ROUTE, state: { stayOnHomePage: true } });
        await dispatch(submitIntent({ quote: quoteResponse, signature, accountAddress }));
        return;
      }
      await dispatch(
        await submitBridgeTx(
          quoteResponse,
          isSolanaChainId(quoteResponse.quote.srcChainId)
            ? false
            : smartTransactionsEnabled,
        ),
      );
    } catch (e) {
      debugLog('Bridge transaction failed', e);
      captureException(e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      } else {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push(DEFAULT_ROUTE);
      }
      return;
    }
    // Route user to activity tab on Home page
    await dispatch(setDefaultHomeActiveTabName('activity'));
    history.push({
      pathname: DEFAULT_ROUTE,
      state: { stayOnHomePage: true },
    });
  };

  return {
    submitBridgeTransaction,
  };
}
