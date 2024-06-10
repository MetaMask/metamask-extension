import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  clearAlerts,
  updateAlerts,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../helpers/constants/design-system';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import setConfirmationAlerts from './setConfirmationAlerts';
import useConfirmationAlerts from './useConfirmationAlerts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));
jest.mock('./useConfirmationAlerts', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const alerts: Alert[] = [
  { key: 'Contract', severity: Severity.Info, message: 'Alert Info' },
];
const alertsMock = { '123': alerts };

const mockState = {
  confirm: {
    currentConfirmation: { id: '123' },
  },
  confirmAlerts: {
    alerts: alertsMock,
    confirmed: { '123': { Contract: false } },
  },
};

describe('setConfirmationAlerts', () => {
  it('updates confirmation alerts', () => {
    const mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockReturnValue({ id: '123' });
    (useConfirmationAlerts as jest.Mock).mockReturnValue(alerts);

    renderHookWithProvider(() => setConfirmationAlerts(), mockState);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(updateAlerts('123', alerts));
  });

  it('clears confirmation alerts on unmount', () => {
    const mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    const { unmount } = renderHook(() => setConfirmationAlerts());

    unmount();

    expect(mockDispatch).toHaveBeenCalledWith(clearAlerts('123'));
  });
});
