import { useDispatch } from 'react-redux';

import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as AlertActions from '../../../../ducks/confirm-alerts/confirm-alerts';
import setAlerts from './setAlerts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

describe('setAlerts', () => {
  it('calls updateAlerts to update alerts in state', () => {
    const mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    const mockUpdateAlerts = jest.spyOn(AlertActions, 'updateAlerts');

    renderHookWithProvider(() => setAlerts('123'), mockState);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockUpdateAlerts).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      alerts: [],
      ownerId: '123',
      type: 'UPDATE_ALERTS',
    });
    expect(mockUpdateAlerts).toHaveBeenCalledWith('123', []);
  });
});
