/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { ModalContent } from './modal-content';
import { ModalContentSize } from './modal-content.types';

describe('ModalContent', () => {
  it('should render with text inside the ModalContent', () => {
    const { getByText } = render(<ModalContent>test</ModalContent>);
    expect(getByText('test')).toBeDefined();
    expect(getByText('test')).toHaveClass('mm-modal-content');
  });
  it('should match snapshot', () => {
    const { container } = render(<ModalContent>test</ModalContent>);
    expect(container).toMatchSnapshot();
  });
  it('should render with and additional className', () => {
    const { getByText } = render(
      <ModalContent className="test-class">test</ModalContent>,
    );
    expect(getByText('test')).toHaveClass('test-class');
  });
  it('should render with size sm', () => {
    const { getByText } = render(
      <>
        <ModalContent>default</ModalContent>
        <ModalContent size={ModalContentSize.Sm}>sm</ModalContent>
      </>,
    );
    expect(getByText('sm')).toHaveClass('mm-modal-content--size-sm');
    expect(getByText('default')).toHaveClass('mm-modal-content--size-sm');
  });
  it('should render with a ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ModalContent modalContentRef={ref}>test</ModalContent>);
    expect(ref.current).toBeDefined();
  });
});
