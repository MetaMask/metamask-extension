import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusIcon } from './status-icon';
import { useRiveFile } from '@rive-app/react-canvas';

jest.mock('@rive-app/react-canvas', () => ({
  useRive: () => ({
    rive: null,
    RiveComponent: () => <div data-testid="rive-component" />,
  }),
  useRiveFile: () => ({ riveFile: {}, status: 'success' }),
  useStateMachineInput: () => null,
}));

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

const states = ['loading', 'success', 'fail'] as const;

describe('StatusIcon', () => {
  for (const state of states) {
    it(`renders for ${state} status`, () => {
      render(<StatusIcon state={state} />);
      expect(screen.getByTestId('rive-component')).toBeInTheDocument();
    });
  }
});
