import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Alert from '.';

describe('Alert', () => {
  it('renders nothing with no visible boolean in state', () => {
    const props = {
      visible: false,
    };

    const { container } = renderWithProvider(<Alert {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('renders with visible boolean in state', () => {
    const props = {
      visible: true,
    };

    const { container } = renderWithProvider(<Alert {...props} />);

    expect(container).toMatchSnapshot();
  });
});
