import React from 'react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import Lock from './lock.component';

describe('Lock', () => {
  it('navigates to default route when isUnlocked false', () => {
    const mockNavigate = jest.fn();
    const props = {
      isUnlocked: false,
      navigate: mockNavigate,
    };

    renderWithProvider(<Lock {...props} />);

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('locks and navigates to default route when isUnlocked true', async () => {
    const mockLockMetamask = jest.fn().mockResolvedValue();
    const mockNavigate = jest.fn();
    const props = {
      isUnlocked: true,
      lockMetamask: mockLockMetamask,
      navigate: mockNavigate,
    };

    renderWithProvider(<Lock {...props} />);

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockLockMetamask).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
