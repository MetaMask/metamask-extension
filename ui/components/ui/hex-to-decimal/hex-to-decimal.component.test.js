import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import HexToDecimal from '.';

describe('HexToDecimal Component', () => {
  it('should render a prefixed hex as a decimal with a className', () => {
    const props = {
      value: '0x3039',
      className: 'hex-to-decimal',
    };

    const { container } = renderWithProvider(<HexToDecimal {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should render an unprefixed hex as a decimal with a className', () => {
    const props = {
      value: '1A85',
      className: 'hex-to-decimal',
    };

    const { container } = renderWithProvider(<HexToDecimal {...props} />);

    expect(container).toMatchSnapshot();
  });
});
