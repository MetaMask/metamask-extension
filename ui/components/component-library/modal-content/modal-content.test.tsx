/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { Modal } from '..';
import { ModalContent } from './modal-content';
import { ModalContentSize } from './modal-content.types';

describe('ModalContent', () => {
  const onClose = jest.fn();

  afterEach(() => {
    onClose.mockReset();
  });

  it('should render with text inside the ModalContent', () => {
    const { getByText, getByTestId } = render(
      <Modal isOpen onClose={onClose}>
        <ModalContent data-testid="modal-content">test</ModalContent>
      </Modal>,
    );
    expect(getByText('test')).toBeDefined();
    expect(getByText('test')).toHaveClass('mm-modal-content__dialog');
    expect(getByTestId('modal-content')).toHaveClass('mm-modal-content');
  });
  it('should match snapshot', () => {
    const { getByTestId } = render(
      <Modal isOpen onClose={onClose}>
        <ModalContent data-testid="test">test</ModalContent>
      </Modal>,
    );
    expect(getByTestId('test')).toMatchSnapshot();
  });
  it('should render with and additional className', () => {
    const { getByTestId } = render(
      <Modal isOpen onClose={onClose}>
        <ModalContent data-testid="test" className="test-class">
          test
        </ModalContent>
        ,
      </Modal>,
    );
    expect(getByTestId('test')).toHaveClass('test-class');
  });
  it('should render with size sm', () => {
    const { getByText } = render(
      <>
        <Modal isOpen onClose={onClose}>
          <ModalContent>default</ModalContent>
          <ModalContent size={ModalContentSize.Sm}>sm</ModalContent>
        </Modal>
      </>,
    );
    expect(getByText('sm')).toHaveClass('mm-modal-content__dialog--size-sm');
    expect(getByText('default')).toHaveClass(
      'mm-modal-content__dialog--size-sm',
    );
  });
  it('should render with additional props being passed to modalDialogProps and not override default class name', () => {
    const { getByTestId } = render(
      <Modal isOpen onClose={onClose}>
        <ModalContent
          modalDialogProps={{
            'data-testid': 'test',
            className: 'custom-dialog-class',
          }}
          data-testid="modal-content"
        >
          test
        </ModalContent>
      </Modal>,
    );
    expect(getByTestId('test')).toBeDefined();
    expect(getByTestId('test')).toHaveClass(
      'mm-modal-content__dialog custom-dialog-class',
    );
  });
  it('should close when escape key is pressed', () => {
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onClose}>
        <ModalContent>modal dialog</ModalContent>
      </Modal>,
    );
    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when isClosedOnEscapeKey is false and escape key is pressed', () => {
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onClose} isClosedOnEscapeKey={false}>
        <ModalContent>modal dialog</ModalContent>
      </Modal>,
    );
    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should close when clicked outside', () => {
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onClose}>
        <ModalContent data-testid="modal-dialog">modal dialog</ModalContent>
      </Modal>,
    );
    // don't close when clicked inside
    fireEvent.mouseDown(getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    // close when clicked outside
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when isClosedOnOutsideClick is false and clicked outside', () => {
    const ref: React.RefObject<HTMLDivElement> = React.createRef();
    const { getByTestId } = render(
      <Modal isOpen={true} onClose={onClose} isClosedOnOutsideClick={false}>
        <ModalContent data-testid="modal-dialog" ref={ref}>
          modal dialog
        </ModalContent>
      </Modal>,
    );
    // don't close when clicked inside
    fireEvent.mouseDown(getByTestId('modal-dialog'));
    expect(onClose).not.toHaveBeenCalled();
    // don't close when clicked outside
    fireEvent.mouseDown(document.body);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should focus initial focus ref when autoFocus is false', () => {
    const initialRef: React.RefObject<HTMLInputElement> = React.createRef();
    const { getByTestId } = render(
      <Modal isOpen={true} onClose={onClose} initialFocusRef={initialRef}>
        <ModalContent>
          <button>modal dialog</button>
          <input data-testid="input" ref={initialRef} />
        </ModalContent>
      </Modal>,
    );
    expect(getByTestId('input')).toHaveFocus();
  });

  it('should focus final focus ref when modal is closed', () => {
    const finalRef: React.RefObject<HTMLButtonElement> = React.createRef();
    const { rerender } = render(
      <>
        <button ref={finalRef}>button</button>
        <Modal isOpen={true} onClose={onClose} finalFocusRef={finalRef}>
          <ModalContent data-testid="modal-dialog">modal dialog</ModalContent>
        </Modal>
      </>,
    );
    rerender(
      <>
        <button ref={finalRef}>button</button>
        <Modal isOpen={false} onClose={onClose} finalFocusRef={finalRef}>
          <ModalContent data-testid="modal-dialog">modal dialog</ModalContent>
        </Modal>
      </>,
    );
    expect(finalRef.current).toHaveFocus();
  });
});
