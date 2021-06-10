import { ethErrors } from 'eth-rpc-errors';
import { NETWORK_TYPE_RPC } from '../../../../shared/constants/network';
import {
  JUSTIFY_CONTENT,
  SEVERITIES,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';

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

async function getAlerts() {
  return [PENDING_TX_DROP_NOTICE];
}

function getValues(pendingApproval, t, actions) {
  return {
    content: [
      {
        element: 'Typography',
        key: 'title',
        children: t('switchEthereumChainConfirmationTitle'),
        props: {
          variant: TYPOGRAPHY.H3,
          align: 'center',
          fontWeight: 'bold',
          boxProps: {
            margin: [0, 0, 4],
          },
        },
      },
      {
        element: 'Typography',
        key: 'description',
        children: t('switchEthereumChainConfirmationDescription'),
        props: {
          variant: TYPOGRAPHY.H7,
          align: 'center',
          boxProps: {
            margin: [0, 0, 4],
          },
        },
      },
      {
        element: 'Box',
        key: 'status-box',
        props: {
          justifyContent: JUSTIFY_CONTENT.CENTER,
        },
        children: {
          element: 'NetworkDisplay',
          key: 'network-being-switched',
          props: {
            colored: false,
            outline: true,
            targetNetwork: {
              type: pendingApproval.requestData.type || NETWORK_TYPE_RPC,
              nickname: pendingApproval.requestData.nickname,
            },
          },
        },
      },
    ],
    approvalText: t('switchNetwork'),
    cancelText: t('cancel'),
    onApprove: () =>
      actions.resolvePendingApproval(
        pendingApproval.id,
        pendingApproval.requestData,
      ),

    onCancel: () =>
      actions.rejectPendingApproval(
        pendingApproval.id,
        ethErrors.provider.userRejectedRequest(),
      ),
  };
}

const switchEthereumChain = {
  getAlerts,
  getValues,
};

export default switchEthereumChain;
