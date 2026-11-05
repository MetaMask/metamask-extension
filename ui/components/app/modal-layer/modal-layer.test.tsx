import React, { StrictMode, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { it } from '@jest/globals';
import { ModalOverlay } from '@metamask/design-system-react';
import { Modal as LegacyModal } from '#ui/components/component-library/modal';
import { ModalContent as LegacyModalContent } from '#ui/components/component-library/modal-content';
import {
  Modal,
  ModalContent,
  ModalFocus,
  ModalPriority,
  ModalProvider,
  Popover,
} from '.';

const Form = () => {
  const [value, setValue] = useState('');
  return (
    <input
      aria-label="Draft"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
};

const Dialog = ({
  name,
  priority,
  onClose = () => undefined,
  children,
}: React.PropsWithChildren<{
  name: string;
  priority?: ModalPriority;
  onClose?: () => void;
}>) => {
  return (
    <Modal isOpen priority={priority} onClose={onClose} data-testid={name}>
      <ModalOverlay />
      <ModalContent modalDialogProps={{ 'aria-label': name }}>
        <button>{name}</button>
        {children}
      </ModalContent>
    </Modal>
  );
};

describe('ModalProvider', () => {
  it('suspends ordinary dialogs, preserves form state, and resumes them after an urgent dialog', async () => {
    const Example = () => {
      const [urgent, setUrgent] = useState(false);
      return (
        <>
          <Dialog name="Ordinary">
            <Form />
            <button onClick={() => setUrgent(true)}>Open urgent</button>
          </Dialog>
          {urgent && (
            <Dialog
              name="Urgent"
              priority={ModalPriority.Urgent}
              onClose={() => setUrgent(false)}
            />
          )}
        </>
      );
    };
    render(
      <StrictMode>
        <ModalProvider>
          <Example />
        </ModalProvider>
      </StrictMode>,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), {
      target: { value: 'Keep me' },
    });
    fireEvent.click(screen.getByText('Open urgent'));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Urgent');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Urgent' })).toHaveFocus(),
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Ordinary');
    expect(screen.getByRole('textbox')).toHaveValue('Keep me');
    await waitFor(() =>
      expect(screen.getByTestId('Ordinary')).toContainElement(
        document.activeElement as HTMLElement,
      ),
    );
  });

  it('keeps a later ordinary dialog behind an already open urgent dialog', () => {
    const view = render(
      <ModalProvider>
        <Dialog name="Urgent" priority={ModalPriority.Urgent} />
      </ModalProvider>,
    );
    view.rerender(
      <ModalProvider>
        <Dialog name="Urgent" priority={ModalPriority.Urgent} />
        <Dialog name="Ordinary" />
      </ModalProvider>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Urgent');
    view.rerender(
      <ModalProvider>
        <Dialog name="Ordinary" />
      </ModalProvider>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Ordinary');
  });

  it('gives the latest dialog precedence when priorities match', () => {
    const view = render(
      <ModalProvider>
        <Dialog name="First" />
        <Dialog name="Second" />
      </ModalProvider>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Second');
    view.rerender(
      <ModalProvider>
        <Dialog name="First" />
      </ModalProvider>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('First');
  });

  it('supports nested dialogs and inherited priority without unmounting the parent', () => {
    const Example = () => {
      const [child, setChild] = useState(true);
      return (
        <>
          <Dialog name="Parent" priority={ModalPriority.Urgent}>
            <Form />
            {child && <Dialog name="Child" onClose={() => setChild(false)} />}
          </Dialog>
          <Dialog name="Unrelated" />
        </>
      );
    };
    render(
      <ModalProvider>
        <Example />
      </ModalProvider>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Child');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Parent');
  });

  it.each(['escape', 'outside click'])(
    'delivers %s only to its original owner even when it closes synchronously',
    (interaction) => {
      const closeOrdinary = jest.fn();
      const Example = () => {
        const [urgent, setUrgent] = useState(true);
        return (
          <>
            {urgent && (
              <Dialog
                name="Urgent"
                priority={ModalPriority.Urgent}
                onClose={() => flushSync(() => setUrgent(false))}
              />
            )}
            <Dialog name="Ordinary" onClose={closeOrdinary} />
          </>
        );
      };
      render(
        <ModalProvider>
          <Example />
        </ModalProvider>,
      );
      if (interaction === 'escape') {
        fireEvent.keyDown(document, { key: 'Escape' });
      } else {
        fireEvent.mouseDown(document.body);
      }
      expect(screen.getByRole('dialog')).toHaveAccessibleName('Ordinary');
      expect(closeOrdinary).not.toHaveBeenCalled();
    },
  );

  it('honors dismissal settings and floating UI portals', () => {
    const onClose = jest.fn();
    const dialogRef = React.createRef<HTMLDivElement>();
    const view = render(
      <ModalProvider>
        <Modal
          isOpen
          onClose={onClose}
          isClosedOnEscapeKey={false}
          isClosedOnOutsideClick={false}
        >
          <ModalContent modalDialogProps={{ ref: dialogRef }}>
            <button>Dialog</button>
          </ModalContent>
        </Modal>
      </ModalProvider>,
    );
    expect(dialogRef.current).toBe(screen.getByRole('dialog'));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);
    expect(onClose).not.toHaveBeenCalled();
    view.rerender(
      <ModalProvider>
        <Dialog name="Dialog" onClose={onClose} />
      </ModalProvider>,
    );
    const floatingContent = document.createElement('div');
    floatingContent.setAttribute('data-mm-modal-ignore-outside-click', '');
    document.body.appendChild(floatingContent);
    fireEvent.mouseDown(floatingContent);
    floatingContent.remove();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('coordinates legacy dialogs without feature-specific checks', async () => {
    const closeLegacy = jest.fn();
    render(
      <ModalProvider>
        <Dialog name="Urgent" priority={ModalPriority.Urgent} />
        <LegacyModal isOpen onClose={closeLegacy}>
          <LegacyModalContent>
            <button>Legacy</button>
          </LegacyModalContent>
        </LegacyModal>
      </ModalProvider>,
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Urgent');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Urgent' })).toHaveFocus(),
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);
    expect(closeLegacy).not.toHaveBeenCalled();
  });

  it('suspends floating portals and their focus locks while a modal is active', async () => {
    const dismissPopover = jest.fn();
    const Example = () => {
      const [urgent, setUrgent] = useState(true);
      return (
        <>
          {urgent && (
            <Dialog
              name="Urgent"
              priority={ModalPriority.Urgent}
              onClose={() => setUrgent(false)}
            />
          )}
          <Popover
            isOpen
            isPortal
            referenceHidden={false}
            onPressEscKey={dismissPopover}
            onClickOutside={dismissPopover}
          >
            <ModalFocus>
              <button>Floating action</button>
            </ModalFocus>
          </Popover>
        </>
      );
    };
    render(
      <ModalProvider>
        <Example />
      </ModalProvider>,
    );
    expect(
      screen.queryByRole('button', { name: 'Floating action' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Urgent')).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dismissPopover).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Floating action' }),
      ).toHaveFocus(),
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dismissPopover).toHaveBeenCalledTimes(1);
  });

  it('restores final focus when a modal closes, without restoring it during preemption', async () => {
    const Example = () => {
      const target = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(true);
      const [urgent, setUrgent] = useState(false);
      return (
        <>
          <button ref={target}>Return here</button>
          {open && (
            <Modal isOpen onClose={() => setOpen(false)} finalFocusRef={target}>
              <ModalContent>
                <button onClick={() => setUrgent(true)}>Preempt</button>
              </ModalContent>
            </Modal>
          )}
          {urgent && (
            <Dialog
              name="Urgent"
              priority={ModalPriority.Urgent}
              onClose={() => setUrgent(false)}
            />
          )}
        </>
      );
    };
    render(
      <ModalProvider>
        <Example />
      </ModalProvider>,
    );
    fireEvent.click(screen.getByText('Preempt'));
    await waitFor(() => expect(screen.getByText('Urgent')).toHaveFocus());
    expect(screen.getByText('Return here')).not.toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.getByText('Return here')).toHaveFocus());
  });
});
