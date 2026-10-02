import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { setShouldShowSupportConsent } from '../../../store/actions';
import { RememberSupportPreferenceToggleItem } from './remember-support-preference-item';

jest.mock('../../../store/actions', () => ({
  setShouldShowSupportConsent: jest.fn((value: boolean) => ({
    type: 'SET_SHOULD_SHOW_SUPPORT_CONSENT',
    value,
  })),
}));

const renderItem = (
  shouldShowSupportConsent: boolean,
  supportDataSharingPreference: boolean | null,
) =>
  renderWithProvider(
    <RememberSupportPreferenceToggleItem />,
    configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          shouldShowSupportConsent,
          supportDataSharingPreference,
        },
      },
    }),
  );

describe('RememberSupportPreferenceToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders off with the base description when no choice is saved', () => {
    const { getByText, getByTestId } = renderItem(true, null);

    expect(
      getByText(messages.rememberSupportPreference.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.rememberSupportPreferenceDescription.message),
    ).toBeInTheDocument();
    expect(getByTestId('remember-support-preference-toggle')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('renders on and describes the saved share decision', () => {
    const { getByText, getByTestId } = renderItem(false, true);

    expect(
      getByText(
        `${messages.rememberSupportPreferenceDescription.message} ${messages.rememberSupportPreferenceCurrentlySharing.message}`,
      ),
    ).toBeInTheDocument();
    expect(getByTestId('remember-support-preference-toggle')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('describes the saved do-not-share decision', () => {
    const { getByText } = renderItem(false, false);

    expect(
      getByText(
        `${messages.rememberSupportPreferenceDescription.message} ${messages.rememberSupportPreferenceCurrentlyNotSharing.message}`,
      ),
    ).toBeInTheDocument();
  });

  it('asks for consent again when turned off', () => {
    const { getByTestId } = renderItem(false, true);

    fireEvent.click(getByTestId('remember-support-preference-toggle'));

    expect(setShouldShowSupportConsent).toHaveBeenCalledWith(true);
  });

  it('stops asking for consent when turned on', () => {
    const { getByTestId } = renderItem(true, false);

    fireEvent.click(getByTestId('remember-support-preference-toggle'));

    expect(setShouldShowSupportConsent).toHaveBeenCalledWith(false);
  });
});
