import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import PhoneNumberEntry, {
  type PhoneNumberEntryProps,
} from './phone-number-entry';
import { getPhoneNumberEntryTestIds } from './phone-number-entry.test-ids';

const ids = getPhoneNumberEntryTestIds('phone-number-entry');

const render = (props: Partial<PhoneNumberEntryProps> = {}) => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  renderWithProvider(
    <PhoneNumberEntry
      title="Verify"
      description="Desc"
      ctaLabel="Send"
      onSubmit={onSubmit}
      {...props}
    />,
    configureMockStore()(mockState),
  );
  return { onSubmit };
};

const type = (value: string) =>
  fireEvent.change(
    screen.getByTestId(ids.INPUT).querySelector('input') as HTMLInputElement,
    { target: { value } },
  );
const input = () =>
  screen.getByTestId(ids.INPUT).querySelector('input') as HTMLInputElement;

describe('PhoneNumberEntry', () => {
  it('formats as typed and keeps the CTA disabled until valid', () => {
    render();
    expect(screen.getByTestId(ids.SUBMIT_BUTTON)).toBeDisabled();
    type('4155');
    expect(input().value).toBe('(415) 5');
    expect(screen.getByTestId(ids.SUBMIT_BUTTON)).toBeDisabled();
    type('4155552671');
    expect(input().value).toBe('(415) 555-2671');
    expect(screen.getByTestId(ids.SUBMIT_BUTTON)).toBeEnabled();
  });

  it('shows the invalid message after blur on an incomplete number', () => {
    render();
    type('415');
    expect(screen.queryByTestId(ids.INVALID)).toBeNull();
    fireEvent.blur(input());
    expect(screen.getByTestId(ids.INVALID)).toBeInTheDocument();
    type('4155');
    expect(screen.queryByTestId(ids.INVALID)).toBeNull();
  });

  it('submits a US number as E.164', async () => {
    const { onSubmit } = render();
    type('4155552671');
    await act(async () => {
      fireEvent.click(screen.getByTestId(ids.SUBMIT_BUTTON));
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      e164: '+14155552671',
      country: 'US',
      national: '4155552671',
    });
  });

  it('submits a non-US number chosen from the picker', async () => {
    const { onSubmit } = render();
    fireEvent.change(screen.getByTestId(ids.COUNTRY_SELECT), {
      target: { value: 'GB' },
    });
    type('7911123456');
    await act(async () => {
      fireEvent.keyDown(input(), { key: 'Enter' });
    });
    expect(onSubmit).toHaveBeenCalledWith({
      e164: '+447911123456',
      country: 'GB',
      national: '7911123456',
    });
  });

  it('switches country for a pasted international number', async () => {
    const { onSubmit } = render();
    type('+44 7911 123456');
    expect(
      (screen.getByTestId(ids.COUNTRY_SELECT) as HTMLSelectElement).value,
    ).toBe('GB');
    await act(async () => {
      fireEvent.click(screen.getByTestId(ids.SUBMIT_BUTTON));
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ e164: '+447911123456' }),
    );
  });

  it('starts from an initial value and default country', () => {
    render({ initialValue: '+447911123456' });
    expect(input().value).toBe('7911 123456');
  });

  it('does not submit while isSubmitting', () => {
    const { onSubmit } = render({
      isSubmitting: true,
      initialValue: '4155552671',
    });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('ignores a second submit while the first is pending', async () => {
    let resolve: () => void = () => undefined;
    const onSubmit = jest.fn(
      () => new Promise<void>((done) => (resolve = done)),
    );
    render({ onSubmit, initialValue: '4155552671' });
    await act(async () => {
      fireEvent.keyDown(input(), { key: 'Enter' });
      fireEvent.keyDown(input(), { key: 'Enter' });
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
  });

  it('renders the disclaimer as a string or a node', () => {
    render({ disclaimer: 'Code comes from Kalshi' });
    expect(screen.getByTestId(ids.DISCLAIMER)).toHaveTextContent(
      'Code comes from Kalshi',
    );
  });

  it('renders a disclaimer node', () => {
    render({ disclaimer: <b>Kalshi node</b> });
    expect(screen.getByText('Kalshi node')).toBeInTheDocument();
  });

  it('renders an error string and an error node', () => {
    render({ error: 'Too many attempts' });
    expect(screen.getByTestId(ids.ERROR)).toHaveTextContent(
      'Too many attempts',
    );
  });

  it('renders an error node', () => {
    render({ error: <span>custom node</span> });
    expect(screen.getByText('custom node')).toBeInTheDocument();
  });

  it('has no cancel button', () => {
    render();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('shows an example number for the country as the placeholder', () => {
    render();
    expect(input().placeholder).toBe('(555) 123-4567');
  });

  it('lists countries by name, the US first', () => {
    render();
    const options = Array.from(
      (screen.getByTestId(ids.COUNTRY_SELECT) as HTMLSelectElement).options,
    ).map((option) => option.textContent);
    expect(options[0]).toBe('🇺🇸 United States of America +1');
    expect(options).toContain('🇫🇷 France +33');
  });
});
