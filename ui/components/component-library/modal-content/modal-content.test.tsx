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
  it('should render with different sizes', () => {
    const { getByText } = render(
      <>
        <ModalContent size={ModalContentSize.Sm}>sm</ModalContent>
        <ModalContent size={ModalContentSize.Md}>md</ModalContent>
        <ModalContent size={ModalContentSize.Lg}>lg</ModalContent>
      </>,
    );
    expect(getByText('sm')).toHaveClass('mm-modal-content--size-sm');
    expect(getByText('md')).toHaveClass('mm-modal-content--size-md');
    expect(getByText('lg')).toHaveClass('mm-modal-content--size-lg');
  });
});
