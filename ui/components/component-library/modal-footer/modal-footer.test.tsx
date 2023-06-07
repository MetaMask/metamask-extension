import React from 'react';
import { render } from '@testing-library/react';

import { ModalFooter } from './modal-footer';

describe('ModalFooter', () => {
  it('should render ModalFooter without error', () => {
    const { getByTestId } = render(<ModalFooter data-testid="modal-footer" />);
    expect(getByTestId('modal-footer')).toBeDefined();
    expect(getByTestId('modal-footer')).toHaveClass('mm-modal-footer');
  });
  it('should match snapshot', () => {
    const { container } = render(<ModalFooter />);
    expect(container).toMatchSnapshot();
  });
  it('should render with and additional className', () => {
    const { getByTestId } = render(
      <ModalFooter data-testid="modal-footer" className="test-class" />,
    );
    expect(getByTestId('modal-footer')).toHaveClass('test-class');
  });
  it('should fire the onClick function when clicked', () => {
    const onClick = jest.fn();
    const { getByTestId } = render(
      <ModalFooter data-testid="modal-footer" onClick={onClick} />,
    );
    getByTestId('modal-footer').click();
    expect(onClick).toHaveBeenCalled();
  });
});
