import React from 'react';
import { render, screen } from '@testing-library/react';

import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { Header } from '.';

const HEADER_TEXT = 'Connections';

describe('Header', () => {
  it('renders the header text', () => {
    const { queryByText } = render(<Header>{HEADER_TEXT}</Header>);
    expect(queryByText(HEADER_TEXT)).toBeInTheDocument();
  });

  it('renders the startAccessory when provided', () => {
    render(
      <Header
        startAccessory={
          <button aria-label={messages.back.message} type="button" />
        }
      >
        {HEADER_TEXT}
      </Header>,
    );

    expect(
      screen.getByRole('button', { name: messages.back.message }),
    ).toBeInTheDocument();
  });

  it('renders the endAccessory when provided', () => {
    const headerText = 'Connections';

    render(
      <Header
        endAccessory={
          <button aria-label={messages.back.message} type="button" />
        }
      >
        {headerText}
      </Header>,
    );

    expect(
      screen.getByRole('button', { name: messages.back.message }),
    ).toBeInTheDocument();
  });

  it('renders the startAccessory and endAccessory when provided', () => {
    const headerText = 'Connections';

    const { container } = render(
      <Header
        startAccessory={
          <button aria-label={messages.back.message} type="button" />
        }
        endAccessory={
          <button aria-label={messages.close.message} type="button" />
        }
      >
        {headerText}
      </Header>,
    );

    expect(container.querySelectorAll('button')).toHaveLength(2);
  });
});
