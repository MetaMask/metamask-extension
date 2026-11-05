import React, { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ReferralDialog,
  ReferralDialogContent,
} from '#ui/components/app/rewards/money-referral/ReferralDialog';

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

  it('keeps keyboard cancellation and mouse interactions away from other dialogs', () => {
    const onClose = jest.fn();
    const background = jest.fn();
    render(
      <ReferralDialog onClose={onClose} data-testid="invite">
        <button>Accept</button>
      </ReferralDialog>,
    );
    document.addEventListener('keydown', background);
    document.addEventListener('mousedown', background);
    document.addEventListener('click', background);
    try {
      const button = screen.getByRole('button');
      fireEvent.mouseDown(button);
      fireEvent.click(button);
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.keyDown(button, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(background).not.toHaveBeenCalled();
      const cancel = new Event('cancel', { cancelable: true });
      fireEvent(screen.getByRole('dialog'), cancel);
      expect(cancel.defaultPrevented).toBe(true);
      expect(screen.getByRole('dialog')).toHaveAttribute('open');
    } finally {
      document.removeEventListener('keydown', background);
      document.removeEventListener('mousedown', background);
      document.removeEventListener('click', background);
    }
  });

  it('dismisses backdrop clicks without dismissing clicks on the sheet', () => {
    const onClose = jest.fn();
    render(
      <ReferralDialog onClose={onClose} data-testid="invite">
        <ReferralDialogContent>Invite</ReferralDialogContent>
      </ReferralDialog>,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(screen.getByText('Invite'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
