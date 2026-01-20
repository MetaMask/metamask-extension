// Early Segment Tracking for Vault Corruption Events
//
// This module provides a standalone way to track Segment events during the
// vault corruption recovery flow, BEFORE MetaMetricsController is initialized.
//
// WHY DO WE NEED THIS?
//
// Normally, all Segment events go through MetaMetricsController.trackEvent(),
// which provides rich context (user traits, chain_id, locale, etc.). However,
// when vault corruption is detected, we're in an error state where:
// 1. MetaMetricsController hasn't been initialized yet
// 2. We can't initialize it because it depends on other controllers
//    (PreferencesController, NetworkController) via the messenger
// 3. The user might abandon the recovery flow, so we need to track immediately
//
// HOW DOES IT WORK?
//
// The `segment` client is created at module load time (before controllers are
// initialized), so it's available during the corruption handling phase. We read
// the user's MetaMetrics consent and ID from the IndexedDB backup (which we
// already have for vault recovery) and send events directly to Segment.
//
// WHAT DO WE LOSE COMPARED TO MetaMetricsController?
//
// - User traits (number of accounts, networks, etc.)
// - chain_id (not relevant during corruption anyway)
// - locale (nice to have, not critical)
// - Marketing campaign cookie ID
//
// For vault corruption events, this is acceptable because:
// - We primarily care about counting affected users
// - The corruption type property tells us what we need to know
// - Reliability matters more than extra metadata

import { isObject } from '@metamask/utils';
import { segment } from '../segment';
import { VaultCorruptionType } from '../../../../shared/constants/state-corruption';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { Backup } from '../stores/persistence-manager';

/**
 * Extracts MetaMetrics consent and user ID from the backup state.
 *
 * @param backup - The backup state from IndexedDB.
 * @returns Object containing participateInMetaMetrics and metaMetricsId, or null if unavailable.
 */
function getMetaMetricsFromBackup(backup: Backup | null): {
  participateInMetaMetrics: boolean;
  metaMetricsId: string;
} | null {
  if (!backup?.MetaMetricsController) {
    return null;
  }

  const metaMetricsState = backup.MetaMetricsController;

  // Validate it's an object (defensive check in case state shape changes)
  if (!isObject(metaMetricsState)) {
    console.error(
      'MetaMetricsController is not an object in backup state:',
      typeof metaMetricsState,
    );
    return null;
  }

  // User hasn't opted in to MetaMetrics
  if (metaMetricsState.participateInMetaMetrics !== true) {
    return null;
  }

  // Validate metaMetricsId is a string
  if (typeof metaMetricsState.metaMetricsId !== 'string') {
    console.error(
      'metaMetricsId is not a string in backup state:',
      typeof metaMetricsState.metaMetricsId,
    );
    return null;
  }

  return {
    participateInMetaMetrics: true,
    metaMetricsId: metaMetricsState.metaMetricsId,
  };
}

/**
 * Tracks a vault corruption event directly to Segment.
 *
 * This bypasses MetaMetricsController (which isn't initialized during corruption
 * handling) and sends events directly using the backup state for consent/ID.
 *
 * @param backup - The backup state from IndexedDB containing MetaMetricsController state.
 * @param eventName - The MetaMetrics event name to track.
 * @param corruptionType - The type of vault corruption (missing_vault_in_database, unaccessible_database).
 */
export function trackVaultCorruptionEvent(
  backup: Backup | null,
  eventName: MetaMetricsEventName,
  corruptionType: VaultCorruptionType,
): void {
  const metaMetrics = getMetaMetricsFromBackup(backup);

  // Don't track if user hasn't opted in to MetaMetrics
  if (!metaMetrics) {
    return;
  }

  try {
    segment.track({
      userId: metaMetrics.metaMetricsId,
      event: eventName,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_type: corruptionType,
        category: MetaMetricsEventCategory.Error,
      },
      context: {
        app: {
          name: 'MetaMask Extension',
          version: process.env.METAMASK_VERSION,
        },
      },
    });

    // Flush immediately to ensure the event is sent before the page might reload
    segment.flush();
  } catch (error) {
    // Log but don't propagate analytics errors to ensure they never break the
    // vault recovery flow. This matches MetaMetricsController's behavior.
    console.error('Failed to track vault corruption event:', error);
  }
}
