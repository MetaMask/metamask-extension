/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';

import { Modal } from './modal';

describe('Modal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it('should render the Modal without crashing', () => {
    const { getByText, getByTestId } = render(
      <Modal onClose={onClose} isOpen data-testid="modal">
        <div>modal dialog</div>
      </Modal>,
    );
    expect(getByText('modal dialog')).toBeDefined();
    expect(getByTestId('modal')).toHaveClass('mm-modal');
  });

  it('should match snapshot', () => {
    const { container } = render(
      <Modal onClose={onClose} isOpen>
        <div>modal dialog</div>
      </Modal>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with and additional className', () => {
    const { getByTestId } = render(
      <Modal
        onClose={onClose}
        isOpen
        className="test-class"
        data-testid="modal"
      >
        <div>modal dialog</div>
      </Modal>,
    );
    expect(getByTestId('modal')).toHaveClass('mm-modal test-class');
  });

  it('should close when escape key is pressed', () => {
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onClose}>
        <div role="dialog">modal dialog</div>
      </Modal>,
    );
    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when isClosedOnEscapeKey is false and escape key is pressed', () => {
    const { getByRole } = render(
      <Modal isOpen={true} onClose={onClose} isClosedOnEscapeKey={false}>
        <div role="dialog">modal dialog</div>
      </Modal>,
    );
    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should close when clicked outside', () => {
    const ref: React.RefObject<HTMLDivElement> = React.createRef();
    const { getByTestId } = render(
      <Modal isOpen={true} onClose={onClose}>
        <div data-testid="modal-dialog" ref={ref}>
          modal dialog
        </div>
      </Modal>,
    );
    // don't close when clicked inside
    fireEvent.mouseDown(getByTestId('modal-dialog'));
    expect(onClose).not.toHaveBeenCalled();
    // close when clicked outside
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when isClosedOnOutsideClick is false and clicked outside', () => {
    const ref: React.RefObject<HTMLDivElement> = React.createRef();
    const { getByTestId } = render(
      <Modal isOpen={true} onClose={onClose} isClosedOnOutsideClick={false}>
        <div data-testid="modal-dialog" ref={ref}>
          modal dialog
        </div>
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
        <div>
          <button>modal dialog</button>
          <input data-testid="input" ref={initialRef} />
        </div>
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
          <div data-testid="modal-dialog">modal dialog</div>
        </Modal>
      </>,
    );
    rerender(
      <>
        <button ref={finalRef}>button</button>
        <Modal isOpen={false} onClose={onClose} finalFocusRef={finalRef}>
          <div data-testid="modal-dialog">modal dialog</div>
        </Modal>
      </>,
    );
    expect(finalRef.current).toHaveFocus();
  });
});
