import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import * as ConfirmDucks from '../../../ducks/confirm/confirm';
import configureStore from '../../../store/store';
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

const ReduxProvider = Provider as any;

describe('setCurrentConfirmation', () => {
  it('should dispatch updateCurrentConfirmation', () => {
    const updateCurrentConfirmationSpy = jest.spyOn(
      ConfirmDucks,
      'updateCurrentConfirmation',
    );
    const wrapper = ({ children }: { children: any }) => (
      <ReduxProvider store={configureStore(mockState)}>
        {children}
      </ReduxProvider>
    );
    renderHook(() => setCurrentConfirmation(), { wrapper });
    expect(updateCurrentConfirmationSpy).toHaveBeenCalledWith(
      mockCurrentConfirmation,
    );
  });
});
