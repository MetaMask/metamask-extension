/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { SuccessPill } from './success-pill';

describe('SuccessPill', () => {
  it('should render the label inside the pill and match snapshot', () => {
    const { getByTestId, container } = render(
      <SuccessPill data-testid="success-pill" label="Paid by MetaMask" />,
    );
    expect(getByTestId('success-pill')).toBeDefined();
    expect(getByTestId('success-pill')).toHaveTextContent('Paid by MetaMask');
    expect(container).toMatchSnapshot();
  });

  it('should render with custom label', () => {
    const { getByTestId, container } = render(
      <SuccessPill data-testid="success-pill" label="No network fee" />,
    );
    expect(getByTestId('success-pill')).toHaveTextContent('No network fee');
    expect(container).toMatchSnapshot();
  });

  it('should apply success styling (mm-tag with label)', () => {
    const { getByTestId } = render(
      <SuccessPill data-testid="success-pill" label="Paid by MetaMask" />,
    );
    const pill = getByTestId('success-pill');
    expect(pill).toHaveClass('mm-tag');
    expect(pill).toHaveTextContent('Paid by MetaMask');
  });

  it('should forward a ref to the root html element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<SuccessPill label="Test" ref={ref} />);
    expect(ref.current).not.toBeNull();
    if (ref.current) {
      expect(ref.current.nodeName).toBe('DIV');
    }
  });
});
