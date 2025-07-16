import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { SigningInWithRow } from './sign-in-with-row';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('<TransactionDetails />', () => {
  const middleware = [thunk];

  it('renders component for transaction details', () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { getByText } = renderWithConfirmContextProvider(
      <SigningInWithRow />,
      mockStore,
    );
    expect(getByText('Signing in with')).toBeInTheDocument();
    expect(getByText('0x2e0D7...5d09B')).toBeInTheDocument();
  });
});
