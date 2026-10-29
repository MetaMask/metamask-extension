import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import ConfirmEncryptionPublicKeyContainer from './confirm-encryption-public-key.container';

const mockUseNavigate = jest.fn();
let mockUseParams: Record<string, string | undefined> = {
  id: 'encryption-approval-1',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useParams: () => mockUseParams,
}));

const mockConfirmEncryptionPublicKey = jest.fn((_props: unknown) => null);

jest.mock('./confirm-encryption-public-key.component', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: (props: unknown) => mockConfirmEncryptionPublicKey(props),
}));

const APPROVAL_ID = 'encryption-approval-1';
const FROM_ADDRESS = '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b';

function getStateWithEncryptionApproval() {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      unapprovedEncryptionPublicKeyMsgs: {
        [APPROVAL_ID]: {
          id: APPROVAL_ID,
          msgParams: FROM_ADDRESS,
          time: 1622687544054,
          status: 'unapproved',
          type: 'eth_getEncryptionPublicKey',
          origin: 'https://metamask.github.io',
        },
      },
    },
  };
}

describe('ConfirmEncryptionPublicKeyContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams = { id: APPROVAL_ID };
  });

  it('passes navigate and params from router hooks', () => {
    const store = configureMockStore()(getStateWithEncryptionApproval());

    renderWithProvider(<ConfirmEncryptionPublicKeyContainer />, store);

    expect(mockConfirmEncryptionPublicKey).toHaveBeenCalledWith(
      expect.objectContaining({
        navigate: mockUseNavigate,
        params: { id: APPROVAL_ID },
      }),
    );
  });

  it('maps txData from store using the route param id', () => {
    const store = configureMockStore()(getStateWithEncryptionApproval());

    renderWithProvider(<ConfirmEncryptionPublicKeyContainer />, store);

    expect(mockConfirmEncryptionPublicKey).toHaveBeenCalledWith(
      expect.objectContaining({
        txData: expect.objectContaining({
          id: APPROVAL_ID,
          type: 'eth_getEncryptionPublicKey',
        }),
      }),
    );
  });

  it('forwards additional props to the connected component', () => {
    const store = configureMockStore()(getStateWithEncryptionApproval());

    renderWithProvider(
      <ConfirmEncryptionPublicKeyContainer testProp="test-value" />,
      store,
    );

    expect(mockConfirmEncryptionPublicKey).toHaveBeenCalledWith(
      expect.objectContaining({
        testProp: 'test-value',
      }),
    );
  });
});
