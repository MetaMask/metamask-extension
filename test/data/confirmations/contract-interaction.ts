import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  Confirmation,
  SignatureRequestType,
} from '../../../ui/pages/confirmations/types/confirm';

export const PAYMASTER_AND_DATA =
  '0x9d6ac51b972544251fcc0f2902e633e3f9bd3f2900000000000000000000000000000000000000000000000000000000666bfd410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003498a76eb88b702e5e52b00fbc16a36baf89ebe3e0dd23170949cffc0a623011383cced660ff67930308c22e5aa746a2d586629ddbd87046a146225bf80e9d6f1b';

export const CONTRACT_INTERACTION_SENDER_ADDRESS =
  '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b';

export const DEPOSIT_METHOD_DATA = '0xd0e30db0';

export const CHAIN_ID = '0xaa36a7';

export const genUnapprovedContractInteractionConfirmation = ({
  address = CONTRACT_INTERACTION_SENDER_ADDRESS,
  txData = DEPOSIT_METHOD_DATA,
  chainId = CHAIN_ID,
}: {
  address?: Hex;
  txData?: Hex;
  chainId?: string;
} = {}): Confirmation =>
  ({
    actionId: String(400855682),
    chainId,
    dappSuggestedGasFees: {
      gas: '0xab77',
    },
    defaultGasEstimates: {
      estimateType: 'medium',
      gas: '0xab77',
      maxFeePerGas: '0xaa350353',
      maxPriorityFeePerGas: '0x59682f00',
    },
    gasFeeEstimatesLoaded: true,
    history: [
      {
        actionId: String(400855682),
        chainId,
        dappSuggestedGasFees: {
          gas: '0xab77',
        },
        defaultGasEstimates: {
          estimateType: 'medium',
          gas: '0xab77',
          maxFeePerGas: '0xaa350353',
          maxPriorityFeePerGas: '0x59682f00',
        },
        id: '1d7c08c0-fe54-11ee-9243-91b1e533746a',
        origin: 'https://metamask.github.io',
        securityAlertResponse: {
          reason: 'loading',
          result_type: 'validation_in_progress',
        },
        sendFlowHistory: [],
        status: TransactionStatus.unapproved,
        time: 1713534772044,
        txParams: {
          data: txData,
          from: address,
          gas: '0xab77',
          maxFeePerGas: '0xaa350353',
          maxPriorityFeePerGas: '0x59682f00',
          to: '0x88aa6343307ec9a652ccddda3646e62b2f1a5125',
          value: '0x3782dace9d900000',
        },
        type: TransactionType.contractInteraction,
        userEditedGasLimit: false,
        userFeeLevel: 'medium',
        verifiedOnBlockchain: false,
      },
      [
        {
          note: 'TransactionController#updateSimulationData - Update simulation data',
          op: 'add',
          path: '/simulationData',
          timestamp: 1713534772417,
          value: {
            nativeBalanceChange: {
              difference: '0x3782dace9d900000',
              isDecrease: true,
              newBalance: '0xcc0ea4fb7ffa87d',
              previousBalance: '0x4443c51e558fa87d',
            },
            tokenBalanceChanges: [],
          },
        },
        {
          op: 'add',
          path: '/gasFeeEstimatesLoaded',
          value: true,
        },
      ],
      [
        {
          note: 'TransactionController:updatesecurityAlertResponse - securityAlertResponse updated',
          op: 'replace',
          path: '/securityAlertResponse/result_type',
          timestamp: 1713534773213,
          value: 'Benign',
        },
        {
          op: 'replace',
          path: '/securityAlertResponse/reason',
          value: '',
        },
        {
          op: 'add',
          path: '/securityAlertResponse/description',
          value: '',
        },
        {
          op: 'add',
          path: '/securityAlertResponse/features',
          value: [],
        },
        {
          op: 'add',
          path: '/securityAlertResponse/block',
          value: 5732063,
        },
      ],
    ],
    id: '1d7c08c0-fe54-11ee-9243-91b1e533746a',
    origin: 'https://metamask.github.io',
    securityAlertResponse: {
      features: [],
      reason: '',
      result_type: 'Benign',
    },
    sendFlowHistory: [],
    simulationData: {
      nativeBalanceChange: {
        difference: '0x3782dace9d900000',
        isDecrease: true,
        newBalance: '0xcc0ea4fb7ffa87d',
        previousBalance: '0x4443c51e558fa87d',
      },
      tokenBalanceChanges: [],
    },
    status: TransactionStatus.unapproved,
    time: 1713534772044,
    txParams: {
      data: txData,
      from: address,
      gas: '0xab77',
      maxFeePerGas: '0xaa350353',
      maxPriorityFeePerGas: '0x59682f00',
      to: '0x88aa6343307ec9a652ccddda3646e62b2f1a5125',
      value: '0x3782dace9d900000',
    },
    type: TransactionType.contractInteraction,
    userEditedGasLimit: false,
    userFeeLevel: 'medium',
    verifiedOnBlockchain: false,
  } as SignatureRequestType);

export const genUnapprovedApproveConfirmation = ({
  address = CONTRACT_INTERACTION_SENDER_ADDRESS,
  chainId = CHAIN_ID,
}: {
  address?: Hex;
  chainId?: string;
} = {}) => ({
  ...genUnapprovedContractInteractionConfirmation({ chainId }),
  txParams: {
    from: address,
    data: '0x095ea7b30000000000000000000000002e0d7e8c45221fca00d74a3609a0f7097035d09b0000000000000000000000000000000000000000000000000000000000000001',
    gas: '0x16a92',
    to: '0x076146c765189d51be3160a2140cf80bfc73ad68',
    value: '0x0',
    maxFeePerGas: '0x5b06b0c0d',
    maxPriorityFeePerGas: '0x59682f00',
  },
  type: TransactionType.tokenMethodApprove,
});
