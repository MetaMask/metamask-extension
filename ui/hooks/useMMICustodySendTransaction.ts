import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { TransactionMeta } from '@metamask/transaction-controller';
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import { updateAndApproveTx } from '../store/actions';
import { AccountType, CustodyStatus } from '../../shared/constants/custody';
import { getMostRecentOverviewPage } from '../ducks/history/history';
import { clearConfirmTransaction } from '../ducks/confirm-transaction/confirm-transaction.duck';
import { getAccountType } from '../selectors/selectors';
import { mmiActionsFactory } from '../store/institutional/institution-background';
import { showCustodyConfirmLink } from '../store/institutional/institution-actions';
import {
  getIsNoteToTraderSupported,
  getIsCustodianPublishesTransactionSupported,
  State,
} from '../selectors/institutional/selectors';
import { useConfirmContext } from '../pages/confirmations/context/confirm';
import { getConfirmationSender } from '../pages/confirmations/components/confirm/utils';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';
import { getSmartTransactionsEnabled } from '../../shared/modules/selectors';
import { CHAIN_ID_TO_RPC_URL_MAP } from '../../shared/constants/network';
import { getProviderConfig } from '../ducks/metamask/metamask';

type MMITransactionMeta = TransactionMeta & {
  txParams: { from: string };
  custodyStatus: CustodyStatus;
  metadata: Record<string, unknown>;
};

export function useMMICustodySendTransaction() {
  const dispatch = useDispatch();
  const history = useHistory();
  const mmiActions = mmiActionsFactory();
  const accountType = useSelector(getAccountType);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const { currentConfirmation } = useConfirmContext() as unknown as {
    currentConfirmation: TransactionMeta | undefined;
  };
  const { from } = getConfirmationSender(currentConfirmation);
  const fromChecksumHexAddress = toChecksumHexAddress(from || '');

  const isNoteToTraderSupported = useSelector((state: State) =>
    getIsNoteToTraderSupported(state, fromChecksumHexAddress),
  );

  const custodianPublishesTransaction = useSelector((state: State) =>
    getIsCustodianPublishesTransactionSupported(state, fromChecksumHexAddress),
  );

  const isSmartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);

  const { chainId, rpcUrl: customRpcUrl } =
    useSelector(getProviderConfig) || {};

  const builtinRpcUrl =
    CHAIN_ID_TO_RPC_URL_MAP[chainId as keyof typeof CHAIN_ID_TO_RPC_URL_MAP];

  const rpcUrl = customRpcUrl || builtinRpcUrl;

  const custodyTransactionFn = async (
    _transactionData: TransactionMeta,
    noteToTraderMessage: string,
  ) => {
    const confirmation = _transactionData as MMITransactionMeta;

    if (confirmation && accountType === AccountType.CUSTODY) {
      confirmation.custodyStatus = CustodyStatus.CREATED;
      confirmation.metadata = confirmation.metadata || {};

      if (isNoteToTraderSupported) {
        confirmation.metadata.note = noteToTraderMessage;
      }

      if (isSmartTransactionsEnabled) {
        confirmation.origin += '#smartTransaction';
      }

      confirmation.metadata.custodianPublishesTransaction =
        custodianPublishesTransaction;
      confirmation.metadata.rpcUrl = rpcUrl;

      dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(true));

      const txId = confirmation.id;
      const fromAddress = confirmation.txParams.from;
      const closeNotification = false;

      await dispatch(updateAndApproveTx(confirmation, true, ''));
      showCustodianDeepLink({
        dispatch,
        mmiActions,
        txId,
        fromAddress,
        closeNotification,
        isSignature: false,
        custodyId: '',
        onDeepLinkFetched: () => undefined,
        onDeepLinkShown: () => {
          dispatch(clearConfirmTransaction());
        },
        showCustodyConfirmLink,
      });
    } else {
      // Non Custody accounts follow normal flow
      await dispatch(updateAndApproveTx(_transactionData, true, ''));
      dispatch(clearConfirmTransaction());
      history.push(mostRecentOverviewPage);
    }
  };

  return { custodyTransactionFn };
}
