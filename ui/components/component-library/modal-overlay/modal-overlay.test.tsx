import React from 'react';
import { render } from '@testing-library/react';

import { ModalOverlay } from './modal-overlay';

describe('ModalOverlay', () => {
  it('should render ModalOverlay without error', () => {
    const { getByTestId } = render(
      <ModalOverlay data-testid="modal-overlay" />,
    );
    expect(getByTestId('modal-overlay')).toBeDefined();
    expect(getByTestId('modal-overlay')).toHaveClass('mm-modal-overlay');
  });
  it('should match snapshot', () => {
    const { container } = render(<ModalOverlay />);
    expect(container).toMatchSnapshot();
  });
  it('should render with and additional className', () => {
    const { getByTestId } = render(
      <ModalOverlay data-testid="modal-overlay" className="test-class" />,
    );
    expect(getByTestId('modal-overlay')).toHaveClass('test-class');
  });
  it('should fire the onClick function when clicked', () => {
    const onClick = jest.fn();
    const { getByTestId } = render(
      <ModalOverlay data-testid="modal-overlay" onClick={onClick} />,
    );
    getByTestId('modal-overlay').click();
    expect(onClick).toHaveBeenCalled();
  });
});
