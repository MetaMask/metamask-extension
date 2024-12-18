import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import * as utils from '../../../../../utils';
import { SigningInWithRow } from './sign-in-with-row';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../utils', () => {
  const originalUtils = jest.requireActual('../../../../../utils');
  return {
    ...originalUtils,
    isSIWESignatureRequest: jest.fn().mockReturnValue(false),
  };
});

describe('<TransactionDetails />', () => {
  const middleware = [thunk];

  it('does not display the row for non SIWE requests', () => {
    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <SigningInWithRow />,
      mockStore,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders component for SIWE transaction details', () => {
    (utils.isSIWESignatureRequest as jest.Mock).mockReturnValue(true);

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
