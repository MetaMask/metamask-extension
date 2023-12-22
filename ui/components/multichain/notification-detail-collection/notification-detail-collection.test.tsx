import React from 'react';
import { render, screen } from '@testing-library/react';
import { IconName } from '../../component-library';
import {
  NotificationDetailCollection,
  NotificationDetailCollectionProps,
} from './notification-detail-collection';

describe('NotificationDetailCollection', () => {
  const defaultProps: NotificationDetailCollectionProps = {
    icon: {
      src: 'https://example.com/image.jpg',
      badge: {
        iconName: IconName.Ethereum,
      },
    },
    label: 'Test Label',
    collection: 'Test Collection',
  };

  it('renders the label and collection', () => {
    render(<NotificationDetailCollection {...defaultProps} />);
    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.collection)).toBeInTheDocument();
  });

  it('renders the image', () => {
    render(<NotificationDetailCollection {...defaultProps} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      defaultProps.icon.src,
    );
  });
});
