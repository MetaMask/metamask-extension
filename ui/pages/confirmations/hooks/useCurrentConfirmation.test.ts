import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType, detectSIWE } from '@metamask/controller-utils';
import type { SignatureRequest } from '@metamask/signature-controller';
import {
  SignatureRequestStatus,
  SignatureRequestType,
} from '@metamask/signature-controller';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Json } from '@metamask/utils';
import mockState from '../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import useCurrentConfirmation from './useCurrentConfirmation';

const ID_MOCK = '123-456';
const ID_2_MOCK = '456-789';

const SIGNATURE_REQUEST_MOCK: SignatureRequest = {
  id: ID_MOCK,
  chainId: CHAIN_IDS.GOERLI,
  networkClientId: 'test-network-client',
  status: SignatureRequestStatus.Unapproved,
  time: 0,
  type: SignatureRequestType.PersonalSign,
  messageParams: {
    from: '0x0000000000000000000000000000000000000001',
    data: 'test',
  },
};

/** EIP-4361 message body that {@link ParsedMessage} accepts (see SIWE grammar). */
const MOCK_EIP4361_MESSAGE_BODY_FOR_TESTS =
  'example.com wants you to sign in with your Ethereum account:\n0x0000000000000000000000000000000000000001\n\nSign in\n\nURI: https://example.com\nVersion: 1\nChain ID: 1\nNonce: testnonce\nIssued At: 2021-09-30T16:25:24.000Z';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
  };
});
const APPROVAL_MOCK = {
  id: ID_MOCK,
  type: ApprovalType.EthSignTypedData,
};

const TRANSACTION_MOCK = {
  id: ID_MOCK,
  chainId: CHAIN_IDS.GOERLI,
  status: TransactionStatus.unapproved,
  type: TransactionType.contractInteraction,
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function arrayToIdMap<T>(array: T[]): Record<string, T> {
  return array.reduce(
    (acc, item) => ({
      ...acc,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [(item as any).id]: item,
    }),
    {},
  );
}

function buildState({
  signatureRequest,
  pendingApprovals,
  transaction,
}: {
  signatureRequest?: SignatureRequest;
  pendingApprovals?: Partial<ApprovalRequest<Record<string, Json>>>[];
  transaction?: Partial<TransactionMeta>;
}) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingApprovals: pendingApprovals ? arrayToIdMap(pendingApprovals) : {},
      transactions: transaction ? [transaction] : [],
      signatureRequests: signatureRequest
        ? { [signatureRequest.id]: signatureRequest }
        : {},
    },
  };
}

function runHook(state: Parameters<typeof buildState>[0]) {
  const response = renderHookWithProvider(
    useCurrentConfirmation,
    buildState(state),
  );

  return response.result.current.currentConfirmation;
}

describe('useCurrentConfirmation', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('return message matching latest pending approval ID', () => {
    const currentConfirmation = runHook({
      signatureRequest: SIGNATURE_REQUEST_MOCK,
      pendingApprovals: [APPROVAL_MOCK],
    });

    expect(currentConfirmation).toStrictEqual(
      expect.objectContaining({
        id: SIGNATURE_REQUEST_MOCK.id,
        type: SignatureRequestType.PersonalSign,
        messageParams: expect.objectContaining({ data: 'test' }),
      }),
    );
  });

  it('return transaction matching latest pending approval ID', () => {
    const currentConfirmation = runHook({
      pendingApprovals: [{ ...APPROVAL_MOCK, type: ApprovalType.Transaction }],
      transaction: TRANSACTION_MOCK,
    });

    expect(currentConfirmation).toStrictEqual(TRANSACTION_MOCK);
  });

  it('returns message matching ID param', () => {
    const currentConfirmation = runHook({
      signatureRequest: SIGNATURE_REQUEST_MOCK,
      pendingApprovals: [
        { ...APPROVAL_MOCK, time: 0 },
        { ...APPROVAL_MOCK, time: 1, id: ID_2_MOCK },
      ],
    });

    expect(currentConfirmation).toStrictEqual(
      expect.objectContaining({
        id: SIGNATURE_REQUEST_MOCK.id,
        messageParams: expect.objectContaining({ data: 'test' }),
      }),
    );
  });

  it('returns transaction matching ID param', () => {
    const currentConfirmation = runHook({
      pendingApprovals: [
        { ...APPROVAL_MOCK, time: 0 },
        { ...APPROVAL_MOCK, time: 1, id: ID_2_MOCK },
      ],

      transaction: TRANSACTION_MOCK,
    });

    expect(currentConfirmation).toStrictEqual(TRANSACTION_MOCK);
  });

  it('returns undefined if approval for message has incorrect type', () => {
    const currentConfirmation = runHook({
      signatureRequest: SIGNATURE_REQUEST_MOCK,
      pendingApprovals: [{ ...APPROVAL_MOCK, type: 'invalid_type' }],
    });

    expect(currentConfirmation).toBeUndefined();
  });

  it('returns undefined if transaction has incorrect type', () => {
    const currentConfirmation = runHook({
      pendingApprovals: [{ ...APPROVAL_MOCK, type: ApprovalType.Transaction }],
      transaction: { ...TRANSACTION_MOCK, type: TransactionType.cancel },
    });

    expect(currentConfirmation).toBeUndefined();
  });

  it('returns undefined if transaction is not unapproved', () => {
    const currentConfirmation = runHook({
      pendingApprovals: [{ ...APPROVAL_MOCK, type: ApprovalType.Transaction }],
      transaction: { ...TRANSACTION_MOCK, status: TransactionStatus.submitted },
    });

    expect(currentConfirmation).toBeUndefined();
  });

  it('returns if message is SIWE', () => {
    const siwePersonalSignDataHex = `0x${Buffer.from(
      MOCK_EIP4361_MESSAGE_BODY_FOR_TESTS,
      'utf8',
    ).toString('hex')}`;

    const siweSignatureRequest: SignatureRequest = {
      ...SIGNATURE_REQUEST_MOCK,
      messageParams: {
        ...SIGNATURE_REQUEST_MOCK.messageParams,
        data: siwePersonalSignDataHex,
        siwe: detectSIWE({ data: siwePersonalSignDataHex }),
      },
    };

    const currentConfirmation = runHook({
      signatureRequest: siweSignatureRequest,
      pendingApprovals: [{ ...APPROVAL_MOCK, type: ApprovalType.PersonalSign }],
    });

    expect(currentConfirmation).toStrictEqual(
      expect.objectContaining({
        id: APPROVAL_MOCK.id,
        messageParams: expect.objectContaining({
          siwe: expect.objectContaining({ isSIWEMessage: true }),
        }),
      }),
    );
  });
});
