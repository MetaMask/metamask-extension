import React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';

import { ModalFooter } from './modal-footer';

describe('ModalFooter', () => {
  it('renders ModalFooter without error', () => {
    const { getByTestId } = renderWithProvider(
      <ModalFooter data-testid="modal-footer" />,
    );
    expect(getByTestId('modal-footer')).toBeDefined();
    expect(getByTestId('modal-footer')).toHaveClass('mm-modal-footer');
  });
  it('matches snapshot', () => {
    const { container } = renderWithProvider(<ModalFooter />);
    expect(container).toMatchSnapshot();
  });
  it('renders with an additional className', () => {
    const { getByTestId } = renderWithProvider(
      <ModalFooter data-testid="modal-footer" className="test-class" />,
    );
    expect(getByTestId('modal-footer')).toHaveClass('test-class');
  });
  it('fires the onSubmit function when clicked and passes additional props to the confirm button', () => {
    const onSubmit = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <ModalFooter
        onSubmit={onSubmit}
        submitButtonProps={{
          'data-testid': 'confirm-button',
        }}
      />,
    );
    getByText(messages.confirm.message).click();
    expect(onSubmit).toHaveBeenCalled();
    expect(getByTestId('confirm-button')).toBeDefined();
  });

  it('uses submitButtonProps.children as the submit label instead of the default confirm string', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderWithProvider(
      <ModalFooter
        onSubmit={onSubmit}
        submitButtonProps={{
          children: 'Confirm trade',
        }}
      />,
    );
    expect(screen.getByText('Confirm trade')).toBeInTheDocument();
    expect(
      screen.queryByText(messages.confirm.message),
    ).not.toBeInTheDocument();
    await user.click(screen.getByText('Confirm trade'));
    expect(onSubmit).toHaveBeenCalled();
  });
  it('renders the confirm button with custom class without overriding the default class', () => {
    const onSubmit = jest.fn();
    const { getByText } = renderWithProvider(
      <ModalFooter
        onSubmit={onSubmit}
        submitButtonProps={{
          className: 'test-class',
        }}
      />,
    );
    expect(getByText(messages.confirm.message)).toHaveClass(
      'mm-modal-footer__button test-class',
    );
  });
  it('fires the onCancel function when clicked and passes additional props to the cancel button', () => {
    const onCancel = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <ModalFooter
        onCancel={onCancel}
        cancelButtonProps={{
          'data-testid': 'cancel-button',
        }}
      />,
    );
    getByText(messages.cancel.message).click();
    expect(onCancel).toHaveBeenCalled();
    expect(getByTestId('cancel-button')).toBeDefined();
  });
  it('renders the cancel button with custom class without overriding the default class', () => {
    const onCancel = jest.fn();
    const { getByText } = renderWithProvider(
      <ModalFooter
        onCancel={onCancel}
        cancelButtonProps={{
          className: 'test-class',
        }}
      />,
    );
    expect(getByText(messages.cancel.message)).toHaveClass(
      'mm-modal-footer__button test-class',
    );
  });
  it('renders children', () => {
    const { getByText } = renderWithProvider(
      <ModalFooter>
        <div>Test</div>
      </ModalFooter>,
    );
    expect(getByText('Test')).toBeDefined();
  });
  it('renders with containerProps', () => {
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
