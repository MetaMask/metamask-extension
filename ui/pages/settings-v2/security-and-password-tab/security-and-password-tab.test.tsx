import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import SecurityAndPasswordTab from './security-and-password-tab';

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('SecurityAndPasswordTab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders all expected items', () => {
    renderWithProvider(<SecurityAndPasswordTab />, mockStore);

    expect(screen.getByText('Manage wallet recovery')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Auto lock')).toBeInTheDocument();
    expect(
      screen.getByTestId('security-phishing-detection-toggle'),
    ).toBeInTheDocument();
  });
});
