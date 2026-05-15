import type {
  SignatureControllerState,
  SignatureRequest,
} from '@metamask/signature-controller';
import {
  SignatureRequestStatus,
  SignatureRequestType,
} from '@metamask/signature-controller';
import { EMPTY_OBJECT } from './shared';
import {
  selectSignatureRequests,
  selectSignatureRequestById,
  selectUnapprovedSignatureRequestById,
} from './signatures';

type SignatureState = {
  metamask: SignatureControllerState;
};

function makeSignatureRequest(
  overrides: Partial<SignatureRequest> & { id: string },
): SignatureRequest {
  return {
    chainId: '0x1',
    networkClientId: 'mainnet',
    status: SignatureRequestStatus.Unapproved,
    time: Date.now(),
    type: SignatureRequestType.PersonalSign,
    messageParams: { from: '0x0', data: '0x' },
    ...overrides,
  } as SignatureRequest;
}

function createMockState(
  signatureRequests: Record<string, SignatureRequest>,
): SignatureState {
  return {
    metamask: { signatureRequests } as unknown as SignatureControllerState,
  };
}

describe('signature selectors', () => {
  beforeEach(() => {
    selectSignatureRequestById.clearCache();
    selectUnapprovedSignatureRequestById.clearCache();
  });

  describe('selectSignatureRequests', () => {
    it('returns signature requests from state', () => {
      const request = makeSignatureRequest({ id: 'sig-1' });
      const state = createMockState({ 'sig-1': request });

      expect(selectSignatureRequests(state)).toStrictEqual({
        'sig-1': request,
      });
    });

    it('returns EMPTY_OBJECT when signatureRequests is undefined', () => {
      const state = {
        metamask: {} as unknown as SignatureControllerState,
      };

      expect(selectSignatureRequests(state)).toBe(EMPTY_OBJECT);
    });

    it('returns EMPTY_OBJECT when metamask is undefined', () => {
      const state = { metamask: undefined } as unknown as SignatureState;

      expect(selectSignatureRequests(state)).toBe(EMPTY_OBJECT);
    });
  });

  describe('selectSignatureRequestById', () => {
    it('returns signature request matching the given ID', () => {
      const request = makeSignatureRequest({ id: 'sig-1' });
      const state = createMockState({ 'sig-1': request });

      expect(selectSignatureRequestById(state, 'sig-1')).toStrictEqual(request);
    });

    it('returns undefined when no request matches', () => {
      const request = makeSignatureRequest({ id: 'sig-1' });
      const state = createMockState({ 'sig-1': request });

      expect(selectSignatureRequestById(state, 'non-existent')).toBeUndefined();
    });

    it('returns undefined for empty signature requests', () => {
      const state = createMockState({});

      expect(selectSignatureRequestById(state, 'sig-1')).toBeUndefined();
    });

    it('returns undefined when ID is undefined', () => {
      const request = makeSignatureRequest({ id: 'sig-1' });
      const state = createMockState({ 'sig-1': request });

      expect(selectSignatureRequestById(state, undefined)).toBeUndefined();
    });
  });

  describe('selectUnapprovedSignatureRequestById', () => {
    it('returns unapproved signature request matching the given ID', () => {
      const request = makeSignatureRequest({
        id: 'sig-1',
        status: SignatureRequestStatus.Unapproved,
      });
      const state = createMockState({ 'sig-1': request });

      expect(
        selectUnapprovedSignatureRequestById(state, 'sig-1'),
      ).toStrictEqual(request);
    });

    it('returns undefined when request exists but is not unapproved', () => {
      const request = makeSignatureRequest({
        id: 'sig-1',
        status: SignatureRequestStatus.Signed,
      });
      const state = createMockState({ 'sig-1': request });

      expect(
        selectUnapprovedSignatureRequestById(state, 'sig-1'),
      ).toBeUndefined();
    });

    it('returns undefined when no request matches the given ID', () => {
      const request = makeSignatureRequest({
        id: 'sig-1',
        status: SignatureRequestStatus.Unapproved,
      });
      const state = createMockState({ 'sig-1': request });

      expect(
        selectUnapprovedSignatureRequestById(state, 'non-existent'),
      ).toBeUndefined();
    });

    it('returns undefined for empty signature requests', () => {
      const state = createMockState({});

      expect(
        selectUnapprovedSignatureRequestById(state, 'sig-1'),
      ).toBeUndefined();
    });

    it('returns undefined when ID is undefined', () => {
      const request = makeSignatureRequest({
        id: 'sig-1',
        status: SignatureRequestStatus.Unapproved,
      });
      const state = createMockState({ 'sig-1': request });

      expect(
        selectUnapprovedSignatureRequestById(state, undefined),
      ).toBeUndefined();
    });
  });
});
