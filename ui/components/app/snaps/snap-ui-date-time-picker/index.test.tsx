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
          Button({
            name: 'submit',
            type: 'submit',
            children: 'Schedule reminder',
          }),
        ],
      }),
    );

    expect(
      screen.queryByRole('button', { name: 'Schedule reminder' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    expect(await screen.findByRole('textbox')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Schedule reminder' }),
    ).toBeEnabled();
  });
});
