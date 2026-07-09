import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import type { NotificationCategoryMetadata } from './notification-categories-types';
import {
  NotificationsCategory,
  NOTIFICATIONS_CATEGORY_TEST_IDS,
} from './notifications-category';
import { fetchNotificationCategories } from './notification-categories-api';

jest.mock('./notification-categories-api');

const mockFetchNotificationCategories = jest.mocked(
  fetchNotificationCategories,
);

const MOCK_CATEGORIES: NotificationCategoryMetadata[] = [
  {
    categoryId: 'walletActivity',
    ausKeys: ['walletActivity'],
    label: 'Wallet activity',
    description: 'Buys, sells, transfers, and swaps',
    icon: 'Clock',
  },
  {
    categoryId: 'tradingActivity',
    ausKeys: ['perps'],
    label: 'Trading activity',
    description: 'Perps position changes',
    icon: 'Candlestick',
  },
  {
    categoryId: 'tradingSignals',
    ausKeys: ['socialAI'],
    label: 'Trading signals',
    description: 'Updates from traders you follow',
    icon: 'Flash',
  },
  {
    categoryId: 'updatesAndRewards',
    ausKeys: ['marketing'],
    label: 'Updates and rewards',
    description: 'Product updates and rewards campaigns',
    icon: 'Megaphone',
  },
];

const buildState = (isNotificationServicesEnabled: boolean) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    isNotificationServicesEnabled,
  },
});

describe('NotificationsCategory', () => {
  beforeEach(() => {
    mockFetchNotificationCategories.mockResolvedValue(MOCK_CATEGORIES);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when notifications are disabled', () => {
    const store = configureStore(buildState(false));
    const { queryByTestId, queryByText } = renderWithProvider(
      <NotificationsCategory onSelect={jest.fn()} />,
      store,
    );

    expect(
      queryByTestId(NOTIFICATIONS_CATEGORY_TEST_IDS.ALL),
    ).not.toBeInTheDocument();
    expect(queryByText('Wallet activity')).not.toBeInTheDocument();
  });

  it('renders BE-driven category tabs when notifications are enabled', async () => {
    const store = configureStore(buildState(true));
    const { findByText } = renderWithProvider(
      <NotificationsCategory onSelect={jest.fn()} />,
      store,
    );

    expect(await findByText('Wallet activity')).toBeInTheDocument();
    expect(await findByText('Trading activity')).toBeInTheDocument();
    expect(await findByText('Trading signals')).toBeInTheDocument();
    expect(await findByText('Updates and rewards')).toBeInTheDocument();
  });

  it('calls onSelect with the tapped category id', async () => {
    const store = configureStore(buildState(true));
    const onSelect = jest.fn();
    const { findByText } = renderWithProvider(
      <NotificationsCategory onSelect={onSelect} />,
      store,
    );

    fireEvent.click(await findByText('Trading activity'));

    expect(onSelect).toHaveBeenCalledWith('tradingActivity');
  });
});
