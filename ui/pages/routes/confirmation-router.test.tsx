import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ConfirmationRouter } from './confirmation-router';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const mockNavigate = jest.fn();
const mockCloseModals = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/useModalState', () => ({
  useModalState: () => ({ closeModals: mockCloseModals }),
}));

jest.mock('../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(() => 'popup'),
}));

const createMockState = (overrides = {}) => ({
  metamask: {
    transactions: [],
    quotes: [],
    pendingApprovals: {},
    pendingApprovalCount: 0,
    approvalFlows: [],
    ...overrides.metamask,
  },
  appState: {
    ...overrides.appState,
  },
});

function TestWrapper({
  children,
  store,
  locationKey = 'default',
}: {
  children: React.ReactNode;
  store: any;
  locationKey?: string;
}) {
  return (
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[{ pathname: '/home', key: locationKey }]}
      >
        {children}
      </MemoryRouter>
    </Provider>
  );
}

describe('ConfirmationRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'platform', {
      value: { getVersion: () => '1.0.0' },
      writable: true,
    });
  });

  describe('swap redirect on first screen only', () => {
    it('redirects to swap on first screen when bridge quotes exist', () => {
      const store = mockStore(
        createMockState({
          metamask: {
            quotes: [{ quote: { srcChainId: '0x1', destChainId: '0xa' } }],
          },
        }),
      );

      render(
        <TestWrapper store={store} locationKey="default">
          <ConfirmationRouter />
        </TestWrapper>,
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        '/cross-chain/swaps/prepare-bridge-page',
      );
    });

    it('does NOT redirect on subsequent navigation with quotes present', () => {
      const store = mockStore(
        createMockState({
          metamask: {
            quotes: [{ quote: { srcChainId: '0x1', destChainId: '0xa' } }],
          },
        }),
      );

      render(
        <TestWrapper store={store} locationKey="in-app-nav-key">
          <ConfirmationRouter />
        </TestWrapper>,
      );

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
