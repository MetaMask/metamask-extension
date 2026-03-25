import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToastStatusIcon, SPINNER_INPUT } from './toast-status-icon';

jest.mock('@rive-app/react-canvas', () => ({
  useRive: () => ({
    rive: null,
    RiveComponent: () => <div data-testid="rive-component" />,
  }),
  useStateMachineInput: () => null,
}));

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

describe('ToastStatusIcon', () => {
  for (const status of Object.values(SPINNER_INPUT)) {
    it(`renders for ${status} status`, () => {
      render(<ToastStatusIcon status={status} />);
      expect(screen.getByTestId('rive-component')).toBeInTheDocument();
    });
  }
});
