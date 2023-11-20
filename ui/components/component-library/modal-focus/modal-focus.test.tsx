/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { ModalFocus } from './modal-focus';

describe('ModalFocus', () => {
  it('should render with children inside the ModalFocus', () => {
    const { getByText } = render(
      <ModalFocus>
        <div>modal focus</div>
      </ModalFocus>,
    );
    expect(getByText('modal focus')).toBeDefined();
  });

  it('should render with the initial element focused', () => {
    const { getByTestId } = render(
      <ModalFocus>
        <input data-testid="input" />
      </ModalFocus>,
    );
    expect(getByTestId('input')).toHaveFocus();
  });

  it('should render with focused with autoFocus is set to false', () => {
    const { getByTestId } = render(
      <ModalFocus autoFocus={false}>
        <input data-testid="input" />
      </ModalFocus>,
    );
    expect(getByTestId('input')).not.toHaveFocus();
  });

  it('should focus initialFocusRef on render', () => {
    const ref: React.RefObject<HTMLInputElement> = React.createRef();
    const { getByTestId } = render(
      <ModalFocus initialFocusRef={ref}>
        <input />
        <input />
        <input data-testid="input" ref={ref} />
      </ModalFocus>,
    );
    expect(getByTestId('input')).toHaveFocus();
  });

  it('should focus final focus ref when closed', () => {
    const finalRef: React.RefObject<HTMLButtonElement> = React.createRef();
    const { rerender, getByRole } = render(
      <>
        <button ref={finalRef}>button</button>
        <ModalFocus finalFocusRef={finalRef}>
          <div>modal focus</div>
        </ModalFocus>
      </>,
    );
    expect(finalRef.current).not.toHaveFocus();
    rerender(<button ref={finalRef}>button</button>);
    expect(getByRole('button')).toHaveFocus();
  });
});
