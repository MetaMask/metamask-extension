import type { SignatureRequest } from '@metamask/signature-controller';
import {
  SignatureRequestStatus,
  SignatureRequestType,
} from '@metamask/signature-controller';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import {
  useSignatureRequest,
  useSignatureRequestOptional,
} from './useSignatureRequest';

const ID_MOCK = '123-456';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useParams: () => mockUseParams(),
  };
});

const SIGNATURE_REQUEST_MOCK: SignatureRequest = {
  id: ID_MOCK,
  chainId: '0x1',
  networkClientId: 'mainnet',
  status: SignatureRequestStatus.Unapproved,
  time: 1,
  type: SignatureRequestType.PersonalSign,
  messageParams: {
    from: '0x0',
    data: '0xtest',
  },
};

function buildState({
  signatureRequests,
}: {
  signatureRequests?: Record<string, SignatureRequest>;
}) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingApprovals: {},
      signatureRequests: signatureRequests ?? {},
    },
  };
}

describe('useSignatureRequestOptional', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('returns personal sign request matching confirmation ID', () => {
    const state = buildState({
      signatureRequests: { [ID_MOCK]: SIGNATURE_REQUEST_MOCK },
    });

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toStrictEqual(SIGNATURE_REQUEST_MOCK);
  });

  it('returns typed sign request matching confirmation ID', () => {
    const typedRequest: SignatureRequest = {
      ...SIGNATURE_REQUEST_MOCK,
      type: SignatureRequestType.TypedSign,
    } as SignatureRequest;

    const state = buildState({
      signatureRequests: { [ID_MOCK]: typedRequest },
    });

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toStrictEqual(typedRequest);
  });

  it('returns undefined when no matching request', () => {
    const state = buildState({});

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when request has different ID', () => {
    const state = buildState({
      signatureRequests: {
        'other-id': { ...SIGNATURE_REQUEST_MOCK, id: 'other-id' },
      },
    });

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when request is not unapproved', () => {
    const signedRequest: SignatureRequest = {
      ...SIGNATURE_REQUEST_MOCK,
      status: SignatureRequestStatus.Signed,
    };

    const state = buildState({
      signatureRequests: { [ID_MOCK]: signedRequest },
    });

    const { result } = renderHookWithProvider(
      useSignatureRequestOptional,
      state,
    );

    expect(result.current).toBeUndefined();
  });
});

describe('useSignatureRequest', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: ID_MOCK });
  });

  it('returns request when matching unapproved request exists', () => {
    const state = buildState({
      signatureRequests: { [ID_MOCK]: SIGNATURE_REQUEST_MOCK },
    });

    const { result } = renderHookWithProvider(useSignatureRequest, state);

    expect(result.current).toStrictEqual(SIGNATURE_REQUEST_MOCK);
  });

  it('returns fallback signature request when no match', () => {
    const state = buildState({});

    const { result } = renderHookWithProvider(useSignatureRequest, state);

    expect(result.current).toStrictEqual({
      id: '',
      chainId: '0x0',
      networkClientId: '',
      status: SignatureRequestStatus.Unapproved,
      time: 0,
      type: SignatureRequestType.PersonalSign,
      messageParams: {
        from: '0x0000000000000000000000000000000000000000',
        data: '0x',
      },
    });
  });
});
