import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { NotificationListSnapButton } from './notification-list-snap-button';

describe('NotificationListSnapButton', () => {
  it('renders the button with the provided text and responds to click events', () => {
    const mockOnClick = jest.fn();
    const buttonText = 'Test Button';

    const { getByText } = render(
      <NotificationListSnapButton onClick={mockOnClick} text={buttonText} />,
    );

    const button = getByText(buttonText);
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
