/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { ModalHeader } from './modal-header';

describe('ModalHeader', () => {
  it('should render ModalHeader correctly', () => {
    const { getByTestId, container } = render(
      <ModalHeader data-testid="modal-header">Modal header</ModalHeader>,
    );
    expect(getByTestId('modal-header')).toHaveClass('mm-modal-header');
    expect(container).toMatchSnapshot();
  });

  it('should render modal header children as a string', () => {
    const { getByText } = render(
      <ModalHeader data-testid="modal-header">Modal header test</ModalHeader>,
    );
    expect(getByText('Modal header test')).toBeDefined();
  });

  it('should render modal header children as a node', () => {
    const { getByText, getByTestId } = render(
      <ModalHeader data-testid="modal-header">
        <div data-testid="div">Modal header test</div>
      </ModalHeader>,
    );
    expect(getByText('Modal header test')).toBeDefined();
    expect(getByTestId('div')).toBeDefined();
  });

  it('should render modal header back button', () => {
    const onBackTest = jest.fn();
    const { getByTestId } = render(
      <ModalHeader
        data-testid="modal-header"
        onBack={onBackTest}
        backButtonProps={{ 'data-testid': 'back' }}
      >
        ModalHeader
      </ModalHeader>,
    );

    const backButton = getByTestId('back');
    fireEvent.click(backButton);

    expect(onBackTest).toHaveBeenCalled();
  });

  it('should render modal header close button', () => {
    const onCloseTest = jest.fn();
    const { getByTestId } = render(
      <ModalHeader
        data-testid="modal-header"
        onClose={onCloseTest}
        closeButtonProps={{ 'data-testid': 'close' }}
      >
        Modal header
      </ModalHeader>,
    );

    const closeButton = getByTestId('close');
    fireEvent.click(closeButton);

    expect(onCloseTest).toHaveBeenCalled();
  });
});
