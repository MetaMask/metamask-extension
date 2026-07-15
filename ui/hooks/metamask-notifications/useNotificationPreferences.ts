import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import log from 'loglevel';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import { useAppDispatch } from '../../store/hooks';

import {
  getNotificationPreferences,
  putNotificationPreferences,
} from '../../store/actions';

export const NOTIFICATION_PREFERENCES_QUERY_KEY =
  'AuthenticatedUserStorageService:getNotificationPreferences';
const NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY = [
  NOTIFICATION_PREFERENCES_QUERY_KEY,
] as const;

export type NotificationPreferenceSection = keyof NotificationPreferences;
export type NotificationPreferenceChannelKey =
  | 'pushNotificationsEnabled'
  | 'inAppNotificationsEnabled';
export type NotificationPreferencesQueryData =
  | NotificationPreferences
  | null
  | undefined;
export type NotificationPreferenceSectionUpdater<
  PreferenceType extends NotificationPreferenceSection,
> = (
  currentSectionPreferences: NotificationPreferences[PreferenceType],
) => NotificationPreferences[PreferenceType];
export type NotificationPreferenceSectionUpdate<
  PreferenceType extends NotificationPreferenceSection,
> =
  | NotificationPreferences[PreferenceType]
  | NotificationPreferenceSectionUpdater<PreferenceType>;
export type { NotificationPreferences };

export function useNotificationPreferences() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [pendingWrites, setPendingWrites] = useState(0);
  const pendingWritesRef = useRef(0);
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());
  const generationRef = useRef(0);
  const lastConfirmedPreferencesRef =
    useRef<NotificationPreferencesQueryData>(undefined);

  const fetchPreferences = useCallback(
    () =>
      dispatch(
        getNotificationPreferences(),
      ) as unknown as Promise<NotificationPreferences | null>,
    [dispatch],
  );

  const { data, isLoading, error, refetch } =
    useQuery<NotificationPreferences | null>({
      queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
      queryFn: fetchPreferences,
    });

  const getCachedPreferences = useCallback(
    () =>
      queryClient.getQueryData(
        NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
      ) as NotificationPreferencesQueryData,
    [queryClient],
  );

  useEffect(() => {
    if (pendingWritesRef.current === 0 && data) {
      lastConfirmedPreferencesRef.current = data;
    }
  }, [data]);

  const beginWrite = useCallback(() => {
    pendingWritesRef.current += 1;
    setPendingWrites(pendingWritesRef.current);
  }, []);

  const finishWrite = useCallback(() => {
    pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
    setPendingWrites(pendingWritesRef.current);
  }, []);

  const updatePreferencesSection = useCallback(
    async <PreferenceType extends NotificationPreferenceSection>(
      type: PreferenceType,
      sectionUpdate: NotificationPreferenceSectionUpdate<PreferenceType>,
    ) => {
      const latestCachedPreferences = getCachedPreferences() ?? data;

      if (!latestCachedPreferences) {
        log.error(
          `No notification preferences found when updating ${String(type)} section, enable notifications first`,
        );
        return;
      }

      const currentPreferences =
        latestCachedPreferences as NotificationPreferences;
      const currentSectionPreferences = currentPreferences[type];
      const nextSectionPreferences =
        typeof sectionUpdate === 'function'
          ? sectionUpdate(currentSectionPreferences)
          : sectionUpdate;

      if (nextSectionPreferences === currentSectionPreferences) {
        return;
      }

      const previousSnapshot = getCachedPreferences() ?? currentPreferences;
      const nextPreferences: NotificationPreferences = {
        ...currentPreferences,
        [type]: nextSectionPreferences,
      };

      if (pendingWritesRef.current === 0) {
        lastConfirmedPreferencesRef.current = previousSnapshot;
      }

      generationRef.current += 1;
      const writeGeneration = generationRef.current;
      beginWrite();

      const cancelQueriesPromise = queryClient.cancelQueries({
        queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
      });
      queryClient.setQueryData<NotificationPreferencesQueryData>(
        NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
        nextPreferences,
      );

      const persistWrite = writeChainRef.current.then(async () => {
        await cancelQueriesPromise;
        await dispatch(putNotificationPreferences(nextPreferences));
      });
      writeChainRef.current = persistWrite.catch(() => undefined);

      try {
        await persistWrite;
        lastConfirmedPreferencesRef.current = nextPreferences;
      } catch (persistError) {
        if (generationRef.current === writeGeneration) {
          queryClient.setQueryData<NotificationPreferencesQueryData>(
            NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
            lastConfirmedPreferencesRef.current ?? previousSnapshot,
          );
        }
        throw persistError;
      } finally {
        finishWrite();
      }
    },
    [
      beginWrite,
      data,
      dispatch,
      finishWrite,
      getCachedPreferences,
      queryClient,
    ],
  );

  const updatePreference = useCallback(
    async (
      type: NotificationPreferenceSection,
      key: NotificationPreferenceChannelKey,
      value: boolean,
    ) => {
      await updatePreferencesSection(type, (currentSectionPreferences) => {
        // TODO: type casting until agentic cli preferences are not optional (next release)
        const sectionPreferences = currentSectionPreferences as NonNullable<
          NotificationPreferences[typeof type]
        >;

        if (sectionPreferences[key] === value) {
          return sectionPreferences;
        }

        return {
          ...sectionPreferences,
          [key]: value,
        };
      });
    },
    [updatePreferencesSection],
  );

  return {
    preferences: data,
    hasNotificationPreferences: data !== null && data !== undefined,
    isLoading,
    isUpdatingPreferences: pendingWrites > 0,
    error,
    refetchPreferences: refetch,
    updatePreference,
    updatePreferencesSection,
  };
}
