import React from 'react';
import { render } from '@testing-library/react';
import { NotificationsPlaceholder } from './notifications-list-placeholder';

describe('NotificationsPlaceholder', () => {
  it('should render the title and text passed as props', () => {
    const { getByText } = render(
      <NotificationsPlaceholder title="Test Title" text="Test Text" />,
    );

    expect(getByText('Test Title')).toBeInTheDocument();
    expect(getByText('Test Text')).toBeInTheDocument();
  });
});
