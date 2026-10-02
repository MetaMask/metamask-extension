import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { submitRequestToBackground } from '../../../store/background-connection';
import { MpcSigningMfaConfirmation } from './mpc-signing-mfa-confirmation';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;

const mockStore = configureMockStore();

function renderConfirmation(pendingRequestId: string | null) {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingMpcSigningMfaRequestId: pendingRequestId,
    },
  };
  return renderWithProvider(<MpcSigningMfaConfirmation />, mockStore(state));
}

describe('MpcSigningMfaConfirmation', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockReset();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  it('renders nothing when no signing confirmation is waiting', () => {
    renderConfirmation(null);

    expect(
      screen.queryByTestId('mpc-signing-mfa-confirmation'),
    ).not.toBeInTheDocument();
  });

  it('asks the background to continue when the user confirms', async () => {
    renderConfirmation('request-1');

    expect(
      screen.getByText(messages.mpcSigningMfaTitle.message),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mpc-signing-mfa-confirm'));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['MpcSigningMfaController:acceptSigningConfirmation', []],
      );
    });
  });

  it('asks the background to cancel when the user rejects', async () => {
    renderConfirmation('request-1');

    fireEvent.click(screen.getByTestId('mpc-signing-mfa-cancel'));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['MpcSigningMfaController:rejectSigningConfirmation', []],
      );
    });
  });
});
