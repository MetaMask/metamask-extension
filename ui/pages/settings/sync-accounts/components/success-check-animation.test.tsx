import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRive } from '@rive-app/react-canvas';
import SuccessCheckAnimation from './success-check-animation';

jest.mock('@rive-app/react-canvas', () => ({
  Alignment: { Center: 'center' },
  Fit: { Contain: 'contain' },
  Layout: jest.fn(),
  useRive: jest.fn(() => ({
    RiveComponent: (props: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props} />
    ),
  })),
}));

jest.mock('../../../../hooks/useRiveFileLavamoat', () => ({
  useRiveFileLavamoat: () => ({
    riveFile: { name: 'card-verified-check' },
    status: 'success',
  }),
}));

describe('SuccessCheckAnimation', () => {
  it('plays the verified check animation', () => {
    render(<SuccessCheckAnimation />);

    expect(useRive).toHaveBeenCalledWith(
      expect.objectContaining({
        artboard: 'Check',
        stateMachines: 'State Machine 1',
        autoplay: true,
      }),
    );
    expect(screen.getByTestId('qr-sync-success-check-animation')).toHaveClass(
      'h-[104px]',
      'w-[104px]',
      'left-1/2',
      'top-1/2',
      '-translate-x-1/2',
      '-translate-y-1/2',
    );
    expect(screen.getByTestId('qr-sync-success-illustration')).toHaveClass(
      'h-[144px]',
      'w-[144px]',
    );
  });
});
