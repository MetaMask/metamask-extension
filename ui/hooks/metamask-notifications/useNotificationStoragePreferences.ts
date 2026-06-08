import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import log from 'loglevel';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import {
  getNotificationPreferences,
  putNotificationPreferences,
} from '../../store/actions';

export const NOTIFICATION_STORAGE_PREFERENCES_QUERY_KEY =
  'AuthenticatedUserStorageService:getNotificationPreferences';

export type NotificationStoragePreferences = NotificationPreferences;
export type NotificationStoragePreferenceSection =
  keyof NotificationStoragePreferences;
export type NotificationStoragePreferenceChannelKey =
  | 'pushNotificationsEnabled'
  | 'inAppNotificationsEnabled';

export function useNotificationStoragePreferences() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const fetchPreferences = useCallback(
    () =>
      dispatch(
        getNotificationPreferences(),
      ) as unknown as Promise<NotificationPreferences | null>,
    [dispatch],
  );

  const { data, isLoading, error, refetch } =
    useQuery<NotificationPreferences | null>({
      queryKey: [NOTIFICATION_STORAGE_PREFERENCES_QUERY_KEY],
      queryFn: fetchPreferences,
    });

  const enqueuePersist = useCallback(
    async <
      PreferenceType extends NotificationStoragePreferenceSection =
        NotificationStoragePreferenceSection,
    >(
      nextPreferences: NotificationStoragePreferences,
      updatedType?: PreferenceType,
    ) => {
      const latest = (dispatch(
        getNotificationPreferences(),
      )) as unknown as NotificationPreferences | null;
      const preferencesToPersist: NotificationStoragePreferences = {
        ...(latest ?? nextPreferences),
        ...(updatedType
          ? { [updatedType]: nextPreferences[updatedType] }
          : nextPreferences),
      };

      dispatch(putNotificationPreferences(preferencesToPersist));
    },
    [dispatch],
  );

  const updatePreferencesSection = useCallback(
    async <PreferenceType extends NotificationStoragePreferenceSection>(
      type: PreferenceType,
      nextSectionPreferences: NotificationStoragePreferences[PreferenceType],
    ) => {
      if (!data) {
        log.error(
          `No notification preferences found when updating ${type} section, enable notifications first`,
        );
        return;
      }

      const nextPreferences = {
        ...data,
        [type]: nextSectionPreferences,
      } as NotificationStoragePreferences;

      queryClient.setQueryData<NotificationPreferences | null>(
        [NOTIFICATION_STORAGE_PREFERENCES_QUERY_KEY],
        (previousPreferences) =>
          ({
            ...(previousPreferences ?? nextPreferences),
            [type]: nextSectionPreferences,
          }) as NotificationPreferences,
      );

      try {
        await enqueuePersist(nextPreferences, type);
      } catch (persistError) {
        refetch();
        throw persistError;
      }
    },
    [data, enqueuePersist, queryClient, refetch],
  );

  const updatePreference = useCallback(
    async (
      type: NotificationStoragePreferenceSection,
      key: NotificationStoragePreferenceChannelKey,
      value: boolean,
    ) => {
      if (!data) {
        log.error(
          'No notification preferences found when updating preference, enable notifications first',
        );
        return;
      }

      await updatePreferencesSection(type, {
        ...data[type],
        [key]: value,
      });
    },
    [data, updatePreferencesSection],
  );

  return {
    preferences: data,
    hasNotificationPreferences: data !== null && data !== undefined,
    isLoading,
    error,
    refetchPreferences: refetch,
    updatePreference,
    updatePreferencesSection,
  };
}
