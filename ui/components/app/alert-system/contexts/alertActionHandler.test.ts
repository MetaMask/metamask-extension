import React from 'react';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import { useAlertActionHandler } from './alertActionHandler';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

describe('alertActionHandler', () => {
  it('throws an error if used outside of AlertActionHandlerProvider', () => {
    const { result } = renderHookWithProvider(() => useAlertActionHandler());
    expect(result.error).toEqual(
      new Error(
        'useAlertActionHandler must be used within an AlertActionHandlerProvider',
      ),
    );
  });

  it('returns the context value when used within AlertActionHandlerProvider', () => {
    const mockProcessAction = jest.fn();
    (React.useContext as jest.Mock).mockReturnValue({
      processAction: mockProcessAction,
    });

    const { result } = renderHookWithProvider(() => useAlertActionHandler(), {
      processAction: mockProcessAction,
    });

    expect(result.current.processAction).toBe(mockProcessAction);
  });
});
