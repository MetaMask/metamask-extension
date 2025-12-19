import { providerErrors } from '@metamask/rpc-errors';
import {
  JustifyContent,
  SEVERITIES,
  TextColor,
  TextVariant,
  AlignItems,
} from '../../../../helpers/constants/design-system';

const PENDING_TX_DROP_NOTICE = {
  id: 'PENDING_TX_DROP_NOTICE',
  severity: SEVERITIES.WARNING,
  content: {
    element: 'span',
    children: {
      element: 'MetaMaskTranslation',
      props: {
        translationKey: 'switchingNetworksCancelsPendingConfirmations',
      },
    },
  },
};

async function getAlerts(_pendingApproval, state) {
  const alerts = [];
  if (state.unapprovedTxsCount > 0) {
    alerts.push(PENDING_TX_DROP_NOTICE);
  }
  return alerts;
}

function getValues(pendingApproval, t, actions) {
  return {
    content: [
      {
        element: 'Text',
        key: 'title',
        children: t('switchEthereumChainConfirmationTitle'),
        props: {
          variant: TextVariant.headingSm,
          alignItems: AlignItems.center,
          fontWeight: 'normal',
          margin: [0, 0, 2],
          padding: [0, 4, 0, 4],
        },
      },
      {
        element: 'Text',
        key: 'description',
        children: t('switchEthereumChainConfirmationDescription'),
        props: {
          variant: TextVariant.bodySm,
          color: TextColor.textAlternative,
          alignItems: AlignItems.center,
          padding: [0, 4, 0, 4],
        },
      },
      {
        element: 'OriginPill',
        key: 'origin-pill',
        props: {
          origin: pendingApproval.origin,
          dataTestId: 'signature-origin-pill',
        },
      },
      {
        element: 'Box',
        key: 'status-box',
        props: {
          justifyContent: JustifyContent.center,
        },
        children: {
          element: 'ConfirmationNetworkSwitch',
          key: 'network-being-switched',
          props: {
            toNetwork: pendingApproval.requestData.toNetworkConfiguration,
            fromNetwork: pendingApproval.requestData.fromNetworkConfiguration,
          },
        },
      },
    ],
    cancelText: t('cancel'),
    submitText: t('switchNetwork'),
    onSubmit: () =>
      actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData.toNetworkConfiguration,
      ),

    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        providerErrors.userRejectedRequest().serialize(),
      ),
    networkDisplay: true,
  };
}

const switchEthereumChain = {
  getAlerts,
  getValues,
};

export default switchEthereumChain;
