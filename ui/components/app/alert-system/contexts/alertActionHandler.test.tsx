import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import {
  AlertActionHandlerProvider,
  useAlertActionHandler,
} from './alertActionHandler';

describe('AlertActionHandlerContext', () => {
  it('throws if hook is used outside the provider', () => {
    const TestComponent = () => {
      useAlertActionHandler();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useAlertActionHandler must be used within an AlertActionHandlerProvider',
    );
  });

  it('calls onProcessAction when processAction is invoked', async () => {
    const mockHandler = jest.fn();

    const TestComponent = () => {
      const { processAction } = useAlertActionHandler();
      return <button onClick={() => processAction('KEY')}>Trigger</button>;
    };

    render(
      <AlertActionHandlerProvider onProcessAction={mockHandler}>
        <TestComponent />
      </AlertActionHandlerProvider>,
    );

    await userEvent.click(screen.getByText('Trigger'));
    expect(mockHandler).toHaveBeenCalledWith('KEY');
  });
});
