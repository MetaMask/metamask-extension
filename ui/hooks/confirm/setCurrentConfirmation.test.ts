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
  it('should dispatch updateCurrentConfirmation', () => {
    const useDispatchSpy = jest.spyOn(redux, 'useDispatch');
    renderHook(() => setCurrentConfirmation());
    expect(useDispatchSpy).toHaveBeenCalled();
  });
import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';

import * as ConfirmDucks from '../../ducks/confirm/confirm';
import configureStore from '../../store/store';
import setCurrentConfirmation from './setCurrentConfirmation';

const mockState = {
  metamask: {
    confirm: {
      currentConfirmation: undefined,
    },
  },
};

const mockCurrentConfirmation = { id: '1' };

jest.mock('./useCurrentConfirmation', () => () => ({
  currentConfirmation: mockCurrentConfirmation,
}));

describe('setCurrentConfirmation', () => {
  it('should dispatch updateCurrentConfirmation', () => {
    const updateCurrentConfirmationSpy = jest.spyOn(
      ConfirmDucks,
      'updateCurrentConfirmation',
    );
    const wrapper = ({ children }) => (
      <Provider store={configureStore(mockState)}>{children}</Provider>
    );
    renderHook(() => setCurrentConfirmation(), { wrapper });

    expect(updateCurrentConfirmationSpy).toHaveBeenCalledWith(
      mockCurrentConfirmation,
    );
  });
});
