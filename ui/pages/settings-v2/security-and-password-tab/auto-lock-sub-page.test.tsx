import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import AutoLockSubPage from './auto-lock-sub-page';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSetAutoLockTimeLimit = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setAutoLockTimeLimit: (val: number) => {
    mockSetAutoLockTimeLimit(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

const createMockStore = (autoLockTimeLimit = 0) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        autoLockTimeLimit,
      },
    },
  });

describe('AutoLockSubPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders all auto-lock options', () => {
    renderWithProvider(<AutoLockSubPage />, createMockStore());

    expect(screen.getByText('Immediately')).toBeInTheDocument();
    expect(screen.getByText('After 15 seconds')).toBeInTheDocument();
    expect(screen.getByText('After 30 seconds')).toBeInTheDocument();
    expect(screen.getByText('After 1 minute')).toBeInTheDocument();
    expect(screen.getByText('After 5 minutes')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('highlights the currently selected option', () => {
    renderWithProvider(<AutoLockSubPage />, createMockStore(5));

    expect(screen.getByTestId('auto-lock-option-5')).toHaveClass('bg-muted');
  });

  it('dispatches setAutoLockTimeLimit and navigates on click', () => {
    renderWithProvider(<AutoLockSubPage />, createMockStore());

    fireEvent.click(screen.getByText('After 1 minute'));

    expect(mockSetAutoLockTimeLimit).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith(SECURITY_AND_PASSWORD_ROUTE);
  });
});
