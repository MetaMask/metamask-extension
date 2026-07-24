import React from 'react';
import { render, screen } from '@testing-library/react';

import { Header } from '.';

const HEADER_TEXT = 'Connections';

describe('Header', () => {
  it('renders the header text', () => {
    const { queryByText } = render(<Header>{HEADER_TEXT}</Header>);
    expect(queryByText(HEADER_TEXT)).toBeInTheDocument();
  });

  it('renders the startAccessory when provided', () => {
    render(
      <Header startAccessory={<button aria-label="Back" type="button" />}>
        {HEADER_TEXT}
      </Header>,
    );

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('renders the endAccessory when provided', () => {
    const headerText = 'Connections';

    render(
      <Header endAccessory={<button aria-label="Back" type="button" />}>
        {headerText}
      </Header>,
    );

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('renders the startAccessory and endAccessory when provided', () => {
    const headerText = 'Connections';

    const { container } = render(
      <Header
        startAccessory={<button aria-label="Back" type="button" />}
        endAccessory={<button aria-label="Close" type="button" />}
      >
        {headerText}
      </Header>,
    );

    expect(container.querySelectorAll('button')).toHaveLength(2);
  });
});
