import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockContractInteractionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import * as utilsModule1 from '../../../../../utils/confirm';
import { SigningInWithRow } from './sign-in-with-row';

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../utils/confirm', () => {
  const originalUtils = jest.requireActual('../../../../../utils/confirm');
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
    (utilsModule1.isSIWESignatureRequest as jest.Mock).mockReturnValue(true);

    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { getByText } = renderWithConfirmContextProvider(
      <SigningInWithRow />,
      mockStore,
    );
    expect(getByText(messages.signingInWith.message)).toBeInTheDocument();
    expect(getByText('Account 1')).toBeInTheDocument();
    expect(getByText('Wallet 1')).toBeInTheDocument();
  });
});
