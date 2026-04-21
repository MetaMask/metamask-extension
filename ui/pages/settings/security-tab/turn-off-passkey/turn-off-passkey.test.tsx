import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
import { SECOND } from '../../../../../shared/constants/time';
import { toast } from '../../../../components/ui/toast/toast';
import TurnOffPasskey from './turn-off-passkey';

jest.mock('../../../../components/ui/toast/toast', () => ({
  toast: {
    success: jest.fn(),
  },
  ToastContent: ({ title }: { title: string }) => title,
}));

const mockUseNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockRemovePasskeyWithPasswordVerification = jest
  .fn()
  .mockResolvedValue(undefined);
const mockForceUpdateMetamaskState = jest.fn().mockResolvedValue(undefined);

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  removePasskeyWithPasswordVerification: (password: string) =>
    mockRemovePasskeyWithPasswordVerification(password),
  forceUpdateMetamaskState: () => mockForceUpdateMetamaskState(),
}));

describe('TurnOffPasskey', () => {
  const mockStore = configureMockStore()(mockState);
  const mockToastSuccess = jest.mocked(toast.success);

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    mockRemovePasskeyWithPasswordVerification.mockResolvedValue(undefined);
  });

  it('submits password and navigates to security on success', async () => {
    const { getByTestId } = renderWithProvider(<TurnOffPasskey />, mockStore);

    fireEvent.change(getByTestId('turn-off-passkey-password-input'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(getByTestId('turn-off-passkey-submit'));

    await waitFor(() => {
      expect(mockRemovePasskeyWithPasswordVerification).toHaveBeenCalledWith(
        'correct-password',
      );
      expect(mockForceUpdateMetamaskState).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess.mock.calls[0][1]).toStrictEqual({
        duration: 5 * SECOND,
      });
      expect(mockUseNavigate).toHaveBeenCalledWith(SECURITY_ROUTE);
    });
  });

  it('shows incorrect password error when verification fails', async () => {
    mockRemovePasskeyWithPasswordVerification.mockRejectedValueOnce(
      new Error('wrong'),
    );

    const { getByTestId, getByText } = renderWithProvider(
      <TurnOffPasskey />,
      mockStore,
    );

    fireEvent.change(getByTestId('turn-off-passkey-password-input'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(getByTestId('turn-off-passkey-submit'));

    await waitFor(() => {
      expect(
        getByText('Password is incorrect. Please try again.'),
      ).toBeInTheDocument();
    });
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});
