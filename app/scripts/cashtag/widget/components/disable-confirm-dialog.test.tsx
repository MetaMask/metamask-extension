import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DisableConfirmDialog } from './disable-confirm-dialog';

describe('DisableConfirmDialog', () => {
  it('describes the consequence and confirms disabling', () => {
    const onConfirm = jest.fn();
    const { container } = render(
      <DisableConfirmDialog id="disable-dialog" onConfirm={onConfirm} />,
    );

    expect(container.querySelector('dialog')).toHaveAttribute(
      'id',
      'disable-dialog',
    );
    expect(screen.getByText('Disable MetaMask widget?')).toBeInTheDocument();
    expect(screen.getByText(/You won't see/u)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Disable'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
