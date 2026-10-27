import { useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import log from 'loglevel';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { useDispatch } from '../../store/hooks';

import {
  getNotificationPreferences,
  updateNotificationPreferences,
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

type NotificationPreferencesUpdate =
  NotificationServicesController.NotificationPreferencesUpdate;

/**
 * Returns the fields of a section that changed, so an update never sends back
 * fields it didn't change. Arrays and objects count as changed when replaced.
 *
 * @param current - The section before the change.
 * @param next - The section after the change.
 * @returns The changed fields.
 */
function getChangedFields<Section extends object>(
  current: Section | undefined,
  next: Section,
): Partial<Section> {
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => current?.[key as keyof Section] !== value,
    ),
  ) as Partial<Section>;
}

/**
 * Reads and updates the user's notification preferences in Authenticated User
 * Storage.
 *
 * @param options - Hook options.
 * @param options.enabled - Whether to read the preferences. Reading needs a
 * bearer token, which signs a signed-out user in, so callers that can render
 * while signed out must pass `false` then.
 * @returns The preferences and the functions that update them.
 */
export function useNotificationPreferences({
  enabled = true,
}: { enabled?: boolean } = {}) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [pendingWrites, setPendingWrites] = useState(0);
  const pendingWritesRef = useRef(0);
  // What NotificationServicesController saved last, and whether any update
  // failed, since the last time no update was pending.
  const lastSavedPreferencesRef = useRef<NotificationPreferences | null>(null);
  const lastSavedSequenceRef = useRef(0);
  const hadFailedWriteRef = useRef(false);
  const writeSequenceRef = useRef(0);

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
      enabled,
    });

  const getCachedPreferences = useCallback(
    () =>
      queryClient.getQueryData(
        NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
      ) as NotificationPreferencesQueryData,
    [queryClient],
  );

  // Resolves from the cache whenever it holds data, even while a refetch is in
  // flight. Only an empty cache waits for the in-flight read (or starts one).
  const ensurePreferences = useCallback(
    () =>
      queryClient.ensureQueryData<NotificationPreferences | null>({
        queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
        queryFn: fetchPreferences,
      }),
    [fetchPreferences, queryClient],
  );

  // Mirrors the marketing channels the consent sync already turned off in
  // AUS, so the toggles show them off before the preferences are re-read.
  const markMarketingChannelsOff = useCallback(() => {
    queryClient.setQueryData<NotificationPreferencesQueryData>(
      NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
      (current) =>
        current
          ? {
              ...current,
              marketing: {
                ...current.marketing,
                pushNotificationsEnabled: false,
                inAppNotificationsEnabled: false,
              },
            }
          : current,
    );
  }, [queryClient]);

  const beginWrite = useCallback(() => {
    pendingWritesRef.current += 1;
    setPendingWrites(pendingWritesRef.current);
  }, []);

  // Once the last pending update settles, show what was saved. Doing it
  // earlier would hide changes still queued. If any update failed, re-read
  // instead: NotificationServicesController either saves an update or leaves
  // the preferences unchanged.
  const finishWrite = useCallback(() => {
    pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1);
    setPendingWrites(pendingWritesRef.current);
    if (pendingWritesRef.current > 0) {
      return;
    }
    if (hadFailedWriteRef.current) {
      queryClient
        .invalidateQueries({
          queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
        })
        .catch((refetchError: unknown) => log.error(refetchError));
    } else if (lastSavedPreferencesRef.current) {
      queryClient.setQueryData<NotificationPreferencesQueryData>(
        NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
        lastSavedPreferencesRef.current,
      );
    }
    hadFailedWriteRef.current = false;
    lastSavedPreferencesRef.current = null;
  }, [queryClient]);

  const updatePreferencesSection = useCallback(
    async <PreferenceType extends NotificationPreferenceSection>(
      type: PreferenceType,
      sectionUpdate: NotificationPreferenceSectionUpdate<PreferenceType>,
    ) => {
      const currentPreferences = getCachedPreferences() ?? data;

      if (!currentPreferences) {
        log.error(
          `No notification preferences found when updating ${String(type)} section, enable notifications first`,
        );
        return;
      }

      const currentSectionPreferences = currentPreferences[type];
      const nextSectionPreferences =
        typeof sectionUpdate === 'function'
          ? sectionUpdate(currentSectionPreferences)
          : sectionUpdate;
      const changedFields = getChangedFields(
        currentSectionPreferences,
        nextSectionPreferences,
      );

      if (Object.keys(changedFields).length === 0) {
        return;
      }

      // Show the change straight away; NotificationServicesController queues
      // updates and merges each one over the stored preferences.
      // The cache update must not wait, so a quick second toggle reads it.
      writeSequenceRef.current += 1;
      const sequence = writeSequenceRef.current;
      beginWrite();
      queryClient
        .cancelQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY })
        .catch((cancelError: unknown) => log.error(cancelError));
      queryClient.setQueryData<NotificationPreferencesQueryData>(
        NOTIFICATION_PREFERENCES_QUERY_KEY_ARRAY,
        (current) =>
          current
            ? {
                ...current,
                [type]: { ...current[type], ...changedFields },
              }
            : current,
      );

      try {
        const saved = (await dispatch(
          updateNotificationPreferences({
            [type]: changedFields,
          } as NotificationPreferencesUpdate),
        )) as unknown as NotificationPreferences;
        // Keep the result of the latest update, whatever order they settle in.
        if (sequence > lastSavedSequenceRef.current) {
          lastSavedSequenceRef.current = sequence;
          lastSavedPreferencesRef.current = saved;
        }
      } catch (persistError) {
        hadFailedWriteRef.current = true;
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
    ensurePreferences,
    markMarketingChannelsOff,
    updatePreference,
    updatePreferencesSection,
  };
}
