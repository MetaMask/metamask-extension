import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  Modal as Dialog,
  ModalContent,
  ModalPriority,
  ModalProvider,
} from '#ui/components/app/modal-layer';
import { Modal } from './modal';

describe('Redux modal host', () => {
  it('pauses without dismissing and retains animation cleanup when closed', () => {
    const hideModal = jest.fn();
    const view = render(
      <ModalProvider>
        <Modal active hideModal={hideModal} modalState={{}} />
        <Dialog
          isOpen
          priority={ModalPriority.Urgent}
          onClose={() => undefined}
        >
          <ModalContent>
            <button>Urgent</button>
          </ModalContent>
        </Dialog>
      </ModalProvider>,
    );
    const content = document.querySelector('.modal__content');
    expect(content?.closest('[aria-hidden="true"]')).toHaveStyle({
      visibility: 'hidden',
    });
    expect(screen.getByRole('button', { name: 'Urgent' })).toHaveFocus();
    expect(hideModal).not.toHaveBeenCalled();

    view.rerender(
      <ModalProvider>
        <Modal active hideModal={hideModal} modalState={{}} />
      </ModalProvider>,
    );
    expect(content?.closest('[aria-hidden="true"]')).toBeNull();
    expect(hideModal).not.toHaveBeenCalled();

    view.rerender(
      <ModalProvider>
        <Modal active={false} hideModal={hideModal} modalState={{}} />
      </ModalProvider>,
    );
    // Suspension uses visibility so the legacy animation can still finish.
    fireEvent.animationEnd(content as Element);
    expect(hideModal).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.modal__content')).toBeNull();
  });
});
