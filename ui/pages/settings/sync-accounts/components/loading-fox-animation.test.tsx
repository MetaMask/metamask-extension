import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRive } from '@rive-app/react-canvas';
import LoadingFoxAnimation from './loading-fox-animation';

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
    riveFile: { name: 'loading-mm-fox' },
    status: 'success',
  }),
}));

describe('LoadingFoxAnimation', () => {
  it('plays the loading fox animation in the shared illustration slot', () => {
    render(<LoadingFoxAnimation />);

    expect(useRive).toHaveBeenCalledWith(
      expect.objectContaining({
        artboard: 'Loading',
        stateMachines: 'State Machine 1',
        autoplay: true,
      }),
    );
    expect(screen.getByTestId('qr-sync-loading-indicator')).toHaveClass(
      'h-[144px]',
      'w-[144px]',
    );
    expect(screen.getByTestId('qr-sync-loading-fox-animation')).toHaveClass(
      'h-[104px]',
      'w-[104px]',
      'left-1/2',
      'top-1/2',
      '-translate-x-1/2',
      '-translate-y-1/2',
    );
  });
});
