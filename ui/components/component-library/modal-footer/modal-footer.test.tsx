import React from 'react';
import { renderWithProvider } from '../../../../test/jest';

import { ModalFooter } from './modal-footer';

describe('ModalFooter', () => {
  it('should render ModalFooter without error', () => {
    const { getByTestId } = renderWithProvider(
      <ModalFooter data-testid="modal-footer" />,
    );
    expect(getByTestId('modal-footer')).toBeDefined();
    expect(getByTestId('modal-footer')).toHaveClass('mm-modal-footer');
  });
  it('should match snapshot', () => {
    const { container } = renderWithProvider(<ModalFooter />);
    expect(container).toMatchSnapshot();
  });
  it('should render with and additional className', () => {
    const { getByTestId } = renderWithProvider(
      <ModalFooter data-testid="modal-footer" className="test-class" />,
    );
    expect(getByTestId('modal-footer')).toHaveClass('test-class');
  });
  it('should fire the onSubmit function when clicked and pass additional props to the confirm button', () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <ModalFooter
        onSubmit={onSubmit}
        submitButtonProps={{
          'data-testid': 'confirm-button',
        }}
      />,
    );
    getByText('Confirm').click();
    expect(onSubmit).toHaveBeenCalled();
    expect(getByTestId('confirm-button')).toBeDefined();
  });
  it('should render the confirm button with custom class without overriding the default class', () => {
    const onSubmit = jest.fn();
    const { getByText } = renderWithProvider(
      <ModalFooter
        onSubmit={onSubmit}
        submitButtonProps={{
          className: 'test-class',
        }}
      />,
    );
    expect(getByText('Confirm')).toHaveClass(
      'mm-modal-footer__button test-class',
    );
  });
  it('should fire the onCancel function when clicked and pass additional props to the cancel button', () => {
    const onCancel = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <ModalFooter
        onCancel={onCancel}
        cancelButtonProps={{
          'data-testid': 'cancel-button',
        }}
      />,
    );
    getByText('Cancel').click();
    expect(onCancel).toHaveBeenCalled();
    expect(getByTestId('cancel-button')).toBeDefined();
  });
  it('should render the cancel button with custom class without overriding the default class', () => {
    const onCancel = jest.fn();
    const { getByText } = renderWithProvider(
      <ModalFooter
        onCancel={onCancel}
        cancelButtonProps={{
          className: 'test-class',
        }}
      />,
    );
    expect(getByText('Cancel')).toHaveClass(
      'mm-modal-footer__button test-class',
    );
  });
  it('should render children', () => {
    const { getByText } = renderWithProvider(
      <ModalFooter>
        <div>Test</div>
      </ModalFooter>,
    );
    expect(getByText('Test')).toBeDefined();
  });
  it('should render with containerProps', () => {
    const { getByTestId } = renderWithProvider(
      <ModalFooter
        containerProps={{
          'data-testid': 'container',
        }}
      />,
    );
    expect(getByTestId('container')).toBeDefined();
  });
});
