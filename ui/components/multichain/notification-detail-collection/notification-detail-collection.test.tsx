import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { Store } from 'redux';
import {
  NotificationDetailCollection,
  NotificationDetailCollectionProps,
} from './notification-detail-collection';

const mockStore = configureStore([]);

describe('NotificationDetailCollection', () => {
  const defaultProps: NotificationDetailCollectionProps = {
    icon: {
      src: 'https://example.com/image.jpg',
      badgeSrc: 'https://example.com/badge.jpg',
    },
    label: 'Test Label',
    collection: 'Test Collection',
  };

  let store: Store;
  beforeEach(() => {
    store = mockStore({
      metamask: {
        ipfsGateway: true,
        openSeaEnabled: true,
      },
    });
  });

  const renderWithProvider = (component: React.ReactNode) => {
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the label and collection', () => {
    renderWithProvider(<NotificationDetailCollection {...defaultProps} />);
    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.collection)).toBeInTheDocument();
  });

  it('renders the main image and the badge image', () => {
    renderWithProvider(<NotificationDetailCollection {...defaultProps} />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', defaultProps.icon.src);
    expect(images[1]).toHaveAttribute('src', defaultProps.icon.badgeSrc);
  });
});
