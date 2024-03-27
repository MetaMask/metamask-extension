import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  NotificationDetailCollection,
  NotificationDetailCollectionProps,
} from './notification-detail-collection';

describe('NotificationDetailCollection', () => {
  const defaultProps: NotificationDetailCollectionProps = {
    icon: {
      src: 'https://example.com/image.jpg',
      badgeSrc: 'https://example.com/badge.jpg',
    },
    label: 'Test Label',
    collection: 'Test Collection',
  };

  it('renders the label and collection', () => {
    render(<NotificationDetailCollection {...defaultProps} />);
    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.collection)).toBeInTheDocument();
  });

  it('renders the main image and the badge image', () => {
    render(<NotificationDetailCollection {...defaultProps} />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
    expect(images[0]).toHaveAttribute('src', defaultProps.icon.src);
    expect(images[1]).toHaveAttribute('src', defaultProps.icon.badgeSrc);
  });
});
