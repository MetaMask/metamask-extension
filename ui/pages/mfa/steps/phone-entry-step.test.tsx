import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MfaFlowTestIds } from '../test-ids';
import { getPhoneNumberEntryTestIds } from '../phone-number-entry/phone-number-entry.test-ids';
import PhoneEntryStep from './phone-entry-step';

const ids = getPhoneNumberEntryTestIds(MfaFlowTestIds.PHONE_ENTRY_PREFIX);

const render = (state: { busy: boolean; error?: 'rate_limited' }) => {
  const onAction = jest.fn();
  renderWithProvider(
    <PhoneEntryStep
      step={{ name: 'phoneEntry' }}
      state={state}
      onAction={onAction}
    />,
    configureMockStore()(mockState),
  );
  return { onAction };
};

describe('PhoneEntryStep', () => {
  it('dispatches submitPhone with the E.164 number', async () => {
    const { onAction } = render({ busy: false });
    expect(screen.getByText('Verify your phone number')).toBeInTheDocument();
    fireEvent.change(
      screen.getByTestId(ids.INPUT).querySelector('input') as HTMLInputElement,
      { target: { value: '4155552671' } },
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId(ids.SUBMIT_BUTTON));
    });
    expect(onAction).toHaveBeenCalledWith({
      type: 'submitPhone',
      phone: { e164: '+14155552671', country: 'US', national: '4155552671' },
    });
  });

  it('shows the flow error', () => {
    render({ busy: false, error: 'rate_limited' });
    expect(screen.getByTestId(MfaFlowTestIds.ERROR)).toBeInTheDocument();
  });

  it('shows busy as a loading button', () => {
    render({ busy: true });
    expect(screen.getByTestId(ids.SUBMIT_BUTTON)).toBeDisabled();
  });
});
