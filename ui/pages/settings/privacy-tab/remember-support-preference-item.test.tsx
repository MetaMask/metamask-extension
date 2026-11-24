import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { setShouldShowSupportConsent } from '../../../store/actions';
import { RememberSupportPreferenceToggleItem } from './remember-support-preference-item';

jest.mock('../shared/settings-toggle-item', () => ({
  SettingsToggleItem: ({
    title,
    description,
    value,
    onToggle,
    dataTestId,
  }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    dataTestId: string;
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      <button
        type="button"
        data-testid={dataTestId}
        value={value.toString()}
        onClick={() => onToggle(value)}
      />
    </div>
  ),
}));

jest.mock('../../../store/actions', () => ({
  setShouldShowSupportConsent: jest.fn((value: boolean) => ({
    type: 'SET_SHOULD_SHOW_SUPPORT_CONSENT',
    value,
  })),
}));

const renderItem = () =>
  renderWithProvider(
    <RememberSupportPreferenceToggleItem />,
    configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          shouldShowSupportConsent: false,
        },
      },
    }),
  );

describe('RememberSupportPreferenceToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the toggle on with its description when a choice is remembered', () => {
    const { getByText, getByTestId } = renderItem();

    expect(
      getByText(messages.rememberSupportPreferenceDescription.message),
    ).toBeInTheDocument();
    expect(getByTestId('remember-support-preference-toggle')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('asks for consent again when the toggle is turned off', () => {
    const { getByTestId } = renderItem();

    fireEvent.click(getByTestId('remember-support-preference-toggle'));

    expect(setShouldShowSupportConsent).toHaveBeenCalledWith(true);
  });
});
