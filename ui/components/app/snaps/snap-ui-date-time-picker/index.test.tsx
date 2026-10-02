import { Button, DateTimePicker, Form } from '@metamask/snaps-sdk/jsx';
import { screen } from '@testing-library/react';
import { renderInterface } from '../snap-ui-renderer/test-utils';

describe('Lazy Snap date picker', () => {
  it('keeps form actions hidden until the date picker is ready', async () => {
    renderInterface(
      Form({
        name: 'schedule',
        children: [
          DateTimePicker({ name: 'date', type: 'date' }),
          Button({ name: 'submit', type: 'submit', children: 'Submit' }),
        ],
      }),
    );

    expect(
      screen.queryByRole('button', { name: 'Submit' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    expect(await screen.findByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });
});
