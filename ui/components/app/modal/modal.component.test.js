import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import Modal from './modal.component';

describe('Modal Component', () => {
  it('should render a modal with a submit button', () => {
    const { container } = renderWithProvider(<Modal />);

    expect(container).toMatchSnapshot();
  });

  it('should render a modal with a cancel and a submit button', () => {
    const props = {
      onCancel: jest.fn(),
      cancelText: 'Cancel',
      onSubmit: jest.fn(),
      submitText: 'Submit',
    };
    const { container, queryByText } = renderWithProvider(<Modal {...props} />);
    expect(container).toMatchSnapshot();

    const cancelButton = queryByText(props.cancelText);
    const submitButton = queryByText(props.submitText);

    expect(props.onCancel).not.toHaveBeenCalled();
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalled();

    expect(props.onSubmit).not.toHaveBeenCalled();
    fireEvent.click(submitButton);
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it('should render a modal with different button types', () => {
    const props = {
      onCancel: () => undefined,
      cancelText: 'Cancel',
      cancelType: 'default',
      onSubmit: () => undefined,
      submitText: 'Submit',
      submitType: 'confirm',
    };

    const { container } = renderWithProvider(<Modal {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should render a modal with children', () => {
    const props = {
      onCancel: () => undefined,
      cancelText: 'Cancel',
      onSubmit: () => undefined,
      submitText: 'Submit',
    };
    const { container } = renderWithProvider(
      <Modal {...props}>
        <div className="test-child" />
      </Modal>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render a modal with a header', () => {
    const props = {
      onCancel: jest.fn(),
      cancelText: 'Cancel',
      onSubmit: jest.fn(),
      submitText: 'Submit',
      headerText: 'My Header',
      onClose: jest.fn(),
    };

    const { container, queryByTestId } = renderWithProvider(
      <Modal {...props} />,
    );
    expect(container).toMatchSnapshot();

    const modalClose = queryByTestId('modal-header-close');
    fireEvent.click(modalClose);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('should disable the submit button if submitDisabled is true', () => {
    const props = {
      onCancel: jest.fn(),
      cancelText: 'Cancel',
      onSubmit: jest.fn(),
      submitText: 'Submit',
      submitDisabled: true,
      headerText: 'My Header',
      onClose: jest.fn(),
    };
    const { queryByText } = renderWithProvider(<Modal {...props} />);
    const submitButton = queryByText(props.submitText);

    expect(submitButton).toHaveAttribute('disabled');

    fireEvent.click(submitButton);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });
});
