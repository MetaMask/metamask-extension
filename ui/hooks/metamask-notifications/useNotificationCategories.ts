import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getCurrentLocale } from '../../ducks/locale/locale';
import { fetchNotificationCategories } from '../../pages/notifications/notification-categories-api';
import type { NotificationCategoryMetadata } from '../../pages/notifications/notification-categories-types';

export const NOTIFICATION_CATEGORIES_QUERY_KEY = 'NotificationCategories:list';

/**
 * Fetches the BE-driven notification category catalog (label, description,
 * icon per category), caching it per locale so the category tab bar and any
 * future settings UI can share the same query.
 */
export const useNotificationCategories = () => {
  const locale = useSelector(getCurrentLocale) ?? 'en';

  const { data, isLoading } = useQuery<NotificationCategoryMetadata[]>({
    queryKey: [NOTIFICATION_CATEGORIES_QUERY_KEY, locale],
    queryFn: () => fetchNotificationCategories(locale),
  });

  return { categories: data ?? [], isLoading };
};
