import { useDispatch } from 'react-redux';
import { getMockPersonalSignConfirmStateForRequest } from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import {
  Alert,
  clearAlerts,
  updateAlerts,
} from '../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../helpers/constants/design-system';
import setConfirmationAlerts from './setConfirmationAlerts';
import useConfirmationAlerts from './useConfirmationAlerts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));
jest.mock('./useConfirmationAlerts', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const alerts: Alert[] = [
  { key: 'Contract', severity: Severity.Info, message: 'Alert Info' },
];
const alertsMock = { [unapprovedPersonalSignMsg.id]: alerts };

const mockState = getMockPersonalSignConfirmStateForRequest(
  unapprovedPersonalSignMsg,
  {
    metamask: {},
    confirmAlerts: {
      alerts: alertsMock,
      confirmed: { [unapprovedPersonalSignMsg.id]: { Contract: false } },
    },
  },
);

describe('setConfirmationAlerts', () => {
  it('updates confirmation alerts', () => {
    const mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useConfirmationAlerts as jest.Mock).mockReturnValue(alerts);

    renderHookWithConfirmContextProvider(
      () => setConfirmationAlerts(),
      mockState,
    );

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      updateAlerts(unapprovedPersonalSignMsg.id, alerts),
    );
  });

  it('clears confirmation alerts on unmount', () => {
    const mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);

    const { unmount } = renderHookWithConfirmContextProvider(
      () => setConfirmationAlerts(),
      mockState,
    );

    unmount();

    expect(mockDispatch).toHaveBeenCalledWith(
      clearAlerts(unapprovedPersonalSignMsg.id),
    );
  });
});
