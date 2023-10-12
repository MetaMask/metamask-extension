import React from 'react';
import { render } from '@testing-library/react';

import { ButtonIcon, IconName } from '../../../../../component-library';
import { Header } from '.';

const HEADER_TEXT = 'Connections';

describe('Header', () => {
  it('renders the header text', () => {
    const { queryByText } = render(<Header>{HEADER_TEXT}</Header>);
    expect(queryByText(HEADER_TEXT)).toBeInTheDocument();
  });

  it('renders the startAccessory when provided', () => {
    const { container } = render(
      <Header startAccessory={<ButtonIcon name={IconName.ArrowLeft} />}>
        {HEADER_TEXT}
      </Header>,
    );

    expect(container.querySelector('.mm-button-icon')).toBeInTheDocument();
  });

  it('renders the endAccessory when provided', () => {
    const headerText = 'Connections';

    const { container } = render(
      <Header endAccessory={<ButtonIcon name={IconName.Close} />}>
        {headerText}
      </Header>,
    );

    expect(container.querySelector('.mm-button-icon')).toBeInTheDocument();
  });

  it('renders the startAccessory and endAccessory when provided', () => {
    const headerText = 'Connections';

    const { container } = render(
      <Header
        startAccessory={<ButtonIcon name={IconName.ArrowLeft} />}
        endAccessory={<ButtonIcon name={IconName.Close} />}
      >
        {headerText}
      </Header>,
    );

    expect(container.querySelectorAll('.mm-button-icon')).toHaveLength(2);
  });
});
