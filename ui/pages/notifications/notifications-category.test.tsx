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

// Labels are deliberately distinct from any real locale copy - these are
// synthetic BE catalog fixtures, not i18n-driven strings (the component
// renders `category.label` verbatim from the fetched catalog).
const MOCK_CATEGORIES: NotificationCategoryMetadata[] = [
  {
    categoryId: 'walletActivity',
    ausKeys: ['walletActivity'],
    label: 'Wallet Activity Category',
    description: 'Buys, sells, transfers, and swaps',
    icon: 'Clock',
  },
  {
    categoryId: 'tradingActivity',
    ausKeys: ['perps'],
    label: 'Trading Activity Category',
    description: 'Perps position changes',
    icon: 'Candlestick',
  },
  {
    categoryId: 'tradingSignals',
    ausKeys: ['socialAI'],
    label: 'Trading Signals Category',
    description: 'Updates from traders you follow',
    icon: 'Flash',
  },
  {
    categoryId: 'updatesAndRewards',
    ausKeys: ['marketing'],
    label: 'Updates And Rewards Category',
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
    expect(queryByText('Wallet Activity Category')).not.toBeInTheDocument();
  });

  it('renders BE-driven category tabs when notifications are enabled', async () => {
    const store = configureStore(buildState(true));
    const { findByText } = renderWithProvider(
      <NotificationsCategory onSelect={jest.fn()} />,
      store,
    );

    expect(await findByText('Wallet Activity Category')).toBeInTheDocument();
    expect(await findByText('Trading Activity Category')).toBeInTheDocument();
    expect(await findByText('Trading Signals Category')).toBeInTheDocument();
    expect(
      await findByText('Updates And Rewards Category'),
    ).toBeInTheDocument();
  });

  it('calls onSelect with the tapped category id', async () => {
    const store = configureStore(buildState(true));
    const onSelect = jest.fn();
    const { findByText } = renderWithProvider(
      <NotificationsCategory onSelect={onSelect} />,
      store,
    );

    fireEvent.click(await findByText('Trading Activity Category'));

    expect(onSelect).toHaveBeenCalledWith('tradingActivity');
  });
});
