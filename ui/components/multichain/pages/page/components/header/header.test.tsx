import { render } from '@testing-library/react';
import React from 'react';

import { Header } from '.';
import { ButtonIcon, IconName } from '../../../../../component-library';

const HEADER_TEXT = 'Connections';

describe('Header', () => {
  it('renders the header text', () => {
    const { queryByText } = render(<Header>{HEADER_TEXT}</Header>);
    expect(queryByText(HEADER_TEXT)).toBeInTheDocument();
  });

  it('renders the startAccessory when provided', () => {
    const { container } = render(
      <Header
        startAccessory={
          <ButtonIcon iconName={IconName.ArrowLeft} ariaLabel="Back" />
        }
      >
        {HEADER_TEXT}
      </Header>,
    );

    expect(container.querySelector('.mm-button-icon')).toBeInTheDocument();
  });

  it('renders the endAccessory when provided', () => {
    const headerText = 'Connections';

    const { container } = render(
      <Header
        endAccessory={<ButtonIcon iconName={IconName.Close} ariaLabel="Back" />}
      >
        {headerText}
      </Header>,
    );

    expect(container.querySelector('.mm-button-icon')).toBeInTheDocument();
  });

  it('renders the startAccessory and endAccessory when provided', () => {
    const headerText = 'Connections';

    const { container } = render(
      <Header
        startAccessory={
          <ButtonIcon iconName={IconName.ArrowLeft} ariaLabel="Back" />
        }
        endAccessory={
          <ButtonIcon iconName={IconName.Close} ariaLabel="Close" />
        }
      >
        {headerText}
      </Header>,
    );

    expect(container.querySelectorAll('.mm-button-icon')).toHaveLength(2);
  });
});
