import React from 'react';
import { render } from '@testing-library/react';
import log from 'loglevel';
import NotificationsListItemErrorBoundary from './notifications-list-item-error-boundary';

describe('NotificationsListItemErrorBoundary tests', () => {
  it('should fallback if a notification list item crashes', () => {
    const mockError = jest.spyOn(log, 'error').mockImplementation(jest.fn());
    const mockConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(jest.fn());

    const MockListItem = () => {
      throw new Error('Mock Error');
    };

    const { container } = render(
      <NotificationsListItemErrorBoundary fallback={() => null}>
        <MockListItem />
      </NotificationsListItemErrorBoundary>,
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockError).toHaveBeenCalled();

    mockError.mockRestore();
    mockConsoleError.mockRestore();
  });
});
