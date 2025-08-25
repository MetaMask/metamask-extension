import { SnapId } from '@metamask/snaps-sdk';
import { parseCaipAssetType, CaipAssetType } from '@metamask/utils';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  sendMultichainTransaction,
  setDefaultHomeActiveTabName,
} from '../../../../store/actions';
import {
  getMemoizedUnapprovedTemplatedConfirmations,
  getSelectedInternalAccount,
} from '../../../../selectors';
import { getSelectedMultichainNetworkConfiguration } from '../../../../selectors/multichain/networks';
import { isMultichainWalletSnap } from '../../../../../shared/lib/accounts/snaps';
import { CONFIRMATION_V_NEXT_ROUTE } from '../../../../helpers/constants/routes';

/**
 * Use this hook to trigger the send flow for non-EVM accounts.
 *
 * On non-EVM, the send flow is delegated to a Snap that displays the UI,
 * builds the transaction, and sends it to the blockchain.
 *
 * @param caipAssetType - The optional CAIP asset type to use for the send flow. Defaults to the chain's native asset if not provided.
 * @returns A function that triggers the send flow for non-EVM accounts.
 */
export const useHandleSendNonEvm = (caipAssetType?: CaipAssetType) => {
  const { nativeCurrency } = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );

  const account = useSelector(getSelectedInternalAccount);
  const history = useHistory();
  const dispatch = useDispatch();

  const currentActivityTabName = useSelector(
    // @ts-expect-error TODO: fix state type
    (state) => state.metamask.defaultHomeActiveTabName,
  );

  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );

  useEffect(() => {
    const templatedSnapApproval = unapprovedTemplatedConfirmations.find(
      (approval) => {
        return (
          approval.type === 'snap_dialog' &&
          account.metadata.snap &&
          account.metadata.snap.id === approval.origin &&
          isMultichainWalletSnap(account.metadata.snap.id as SnapId)
        );
      },
    );

    if (templatedSnapApproval) {
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    }
  }, [unapprovedTemplatedConfirmations, history, account]);

  return async () => {
    // Non-EVM (Snap) Send flow
    if (!account.metadata.snap) {
      throw new Error('Non-EVM needs to be Snap accounts');
    }

    // TODO: Remove this once we want to enable all non-EVM Snaps
    // if (!isMultichainWalletSnap(account.metadata.snap.id as SnapId)) {
    //   throw new Error(
    //     `Non-EVM Snap is not whitelisted: ${account.metadata.snap.id}`,
    //   );
    // }

    // Either use the passed caipAssetType, or fallback to the chain's native asset
    const assetTypeToUse = (() => {
      if (caipAssetType) {
        return caipAssetType;
      }

      if (!nativeCurrency) {
        throw new Error(
          'No CAIP asset type provided, and could not find a fallback native asset for the selected account',
        );
      }

      return nativeCurrency as CaipAssetType;
    })();

    const { chainId } = parseCaipAssetType(assetTypeToUse);

    try {
      // FIXME: We switch the tab before starting the send flow (we
      // faced some inconsistencies when changing it after).
      await dispatch(setDefaultHomeActiveTabName('activity'));
      await sendMultichainTransaction(account.metadata.snap.id, {
        account: account.id,
        scope: chainId,
        assetType: assetTypeToUse,
      });
    } catch (error) {
      // Restore the previous tab in case of any error (see FIXME comment above).
      await dispatch(setDefaultHomeActiveTabName(currentActivityTabName));
    }
  };
};
