import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { useAlertActionHandler } from './alertActionHandler';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('alertActionHandler', () => {
  it('throws an error if used outside of AlertActionHandlerProvider', () => {
    (React.useContext as jest.Mock).mockReturnValue(undefined);

    const HookConsumer = () => {
      useAlertActionHandler();
      return null;
    };

    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      expect(() => render(React.createElement(HookConsumer))).toThrow(
        'useAlertActionHandler must be used within an AlertActionHandlerProvider',
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('returns the context value when used within AlertActionHandlerProvider', () => {
    const mockProcessAction = jest.fn();
    (React.useContext as jest.Mock).mockReturnValue({
      processAction: mockProcessAction,
    });

    const { result } = renderHook(() => useAlertActionHandler());

    expect(result.current.processAction).toBe(mockProcessAction);
  });
});
