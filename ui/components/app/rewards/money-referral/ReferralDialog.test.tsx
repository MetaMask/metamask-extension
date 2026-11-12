import React, { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReferralDialog } from '#ui/components/app/rewards/money-referral/ReferralDialog';

describe('ReferralDialog', () => {
  it('opens modally, focuses the requested action, and closes on unmount', () => {
    const initialFocusRef = React.createRef<HTMLButtonElement>();
    const { unmount } = render(
      <StrictMode>
        <ReferralDialog
          onClose={jest.fn()}
          initialFocusRef={initialFocusRef}
          data-testid="invite"
        >
          <button ref={initialFocusRef}>Accept</button>
        </ReferralDialog>
      </StrictMode>,
    );
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(initialFocusRef.current).toHaveFocus();
    unmount();
    expect(dialog.open).toBe(false);
  });

  it('keeps mouse interactions away from other dialogs', () => {
    const onClose = jest.fn();
    const background = jest.fn();
    render(
      <ReferralDialog onClose={onClose} data-testid="invite">
        <button>Accept</button>
      </ReferralDialog>,
    );
    document.addEventListener('mousedown', background);
    document.addEventListener('click', background);
    try {
      const button = screen.getByRole('button');
      fireEvent.mouseDown(button);
      fireEvent.click(button);
      expect(onClose).not.toHaveBeenCalled();
      expect(background).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('mousedown', background);
      document.removeEventListener('click', background);
    }
  });

  it('dismisses once on Escape and prevents native cancellation', () => {
    const onClose = jest.fn();
    const background = jest.fn();
    render(
      <ReferralDialog onClose={onClose} data-testid="invite">
        <button>Accept</button>
      </ReferralDialog>,
    );
    document.addEventListener('keydown', background);
    try {
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      fireEvent(screen.getByRole('button'), escapeEvent);

      expect(escapeEvent.defaultPrevented).toBe(true);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(background).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', background);
    }
  });

  it('dismisses once on native cancellation and leaves closing to the parent', () => {
    const onClose = jest.fn();
    render(
      <ReferralDialog onClose={onClose} data-testid="invite">
        Invite
      </ReferralDialog>,
    );
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    const cancel = new Event('cancel', { cancelable: true });

    fireEvent(dialog, cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(true);
  });

  it('dismisses only gestures that start and finish on the backdrop', () => {
    const onClose = jest.fn();
    render(
      <ReferralDialog onClose={onClose} data-testid="invite">
        Invite
      </ReferralDialog>,
    );
    const dialog = screen.getByRole('dialog');
    Object.defineProperty(dialog, 'closedBy', { value: 'closerequest' });
    jest.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 100,
      width: 280,
      height: 180,
      top: 100,
      right: 380,
      bottom: 280,
      left: 100,
      toJSON: () => ({}),
    });
    fireEvent.mouseDown(dialog, { clientX: 150, clientY: 150 });
    fireEvent.click(dialog, { clientX: 150, clientY: 150 });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByText('Invite'), {
      clientX: 150,
      clientY: 150,
    });
    fireEvent.click(dialog, { clientX: 10, clientY: 10 });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(dialog, { clientX: 10, clientY: 10 });
    fireEvent.click(dialog, { clientX: 150, clientY: 150 });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(dialog, { clientX: 10, clientY: 10 });
    fireEvent.click(dialog, { clientX: 10, clientY: 10 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
