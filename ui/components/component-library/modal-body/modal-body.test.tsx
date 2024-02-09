import React from 'react';
import { render } from '@testing-library/react';

import { ModalBody } from './modal-body';

describe('ModalBody', () => {
  it('should render ModalBody without error', () => {
    const { getByTestId } = render(<ModalBody data-testid="modal-body" />);
    expect(getByTestId('modal-body')).toBeDefined();
    expect(getByTestId('modal-body')).toHaveClass('mm-modal-body');
  });
  it('should match snapshot', () => {
    const { container } = render(<ModalBody />);
    expect(container).toMatchSnapshot();
  });
  it('should render with and additional className', () => {
    const { getByTestId } = render(
      <ModalBody data-testid="modal-body" className="test-class" />,
    );
    expect(getByTestId('modal-body')).toHaveClass('test-class');
  });
});
