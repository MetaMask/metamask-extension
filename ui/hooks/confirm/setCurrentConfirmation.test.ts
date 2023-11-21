import * as redux from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';

import setCurrentConfirmation from './setCurrentConfirmation';

jest.mock('./useCurrentConfirmation', () => () => ({
  currentConfirmation: { id: '1' },
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: (args: any) => jest.fn(args),
}));

describe('setCurrentConfirmation', () => {
  it('should dispatch updatCurrentConfirmation', () => {
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    renderHook(() => setCurrentConfirmation());
    expect(useDispatchSpy).toHaveBeenCalled();
  });
});
