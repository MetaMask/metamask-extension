import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import useConfirmationAlertAction from './useConfirmationAlertActions';
import { usePersonalSignAlertActions } from './alerts/PersonalSignAlertAction';

jest.mock('./alerts/PersonalSignAlertAction');

describe('useConfirmationAlertActions', () => {
  it('calls processPersonalSignAction with the provided actionKey', () => {
    const processPersonalSignActionMock = jest.fn();
    (usePersonalSignAlertActions as jest.Mock).mockReturnValue(
      processPersonalSignActionMock,
    );

    const { result } = renderHookWithProvider(
      () => useConfirmationAlertAction(),
      { ...mockState },
    );
    const processAction = result.current;

    const actionKey = 'actionKeyMock';
    processAction(actionKey);

    expect(processPersonalSignActionMock).toHaveBeenCalledWith(actionKey);
  });
});
