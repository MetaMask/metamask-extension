import React from 'react';
import { render, screen } from '@testing-library/react';
import source from '../../../../shared/assets/animations/spinner_loader_with_states.riv';
import { useRiveFileLavamoat } from '../../../hooks/useRiveFileLavamoat';
import { StatusIcon } from './status-icon';

jest.mock('@rive-app/react-canvas', () => ({
  useRive: () => ({
    rive: null,
    RiveComponent: () => <div data-testid="rive-component" />,
  }),
}));

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

jest.mock('../../../hooks/useRiveFileLavamoat', () => ({
  useRiveFileLavamoat: jest.fn(() => ({ riveFile: {}, status: 'success' })),
}));

const states = ['loading', 'success', 'fail'] as const;

describe('StatusIcon', () => {
  it('loads the bundled animation', () => {
    render(<StatusIcon state="loading" />);

    expect(useRiveFileLavamoat).toHaveBeenCalledWith({ src: source });
  });

  for (const state of states) {
    it(`renders for ${state} status`, () => {
      render(<StatusIcon state={state} />);
      expect(screen.getByTestId('rive-component')).toBeInTheDocument();
    });
  }
});
