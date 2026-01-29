import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { parseExpression } from 'cron-parser';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type BackgroundEvent = {
  id: string;
  recurring: boolean;
  schedule: string;
  scheduledAt: string;
  snapId: string;
  date: string;
  request: {
    method: string;
    jsonrpc?: '2.0';
    id?: string | number | null;
    params?: unknown[] | Record<string, unknown>;
  };
};

type CronjobControllerState = {
  events: Record<string, BackgroundEvent>;
};

export const version = 191;

/**
 * Validates if a string is a valid cron expression.
 *
 * @param expression - The cron expression to validate.
 * @returns True if the expression is valid, false otherwise.
 */
function isValidCronExpression(expression: string): boolean {
  try {
    parseExpression(expression, { utc: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempts to fix common cron expression errors.
 * Currently handles the case where '+' is used instead of '/'.
 *
 * @param expression - The potentially invalid cron expression.
 * @returns A fixed cron expression, or null if unfixable.
 */
function attemptCronExpressionFix(expression: string): string | null {
  // Replace '+' with '/' (e.g., "5+15 * * * * *" -> "5/15 * * * * *")
  const fixedExpression = expression.replace(/(\d+)\+(\d+)/gu, '$1/$2');

  if (
    fixedExpression !== expression &&
    isValidCronExpression(fixedExpression)
  ) {
    return fixedExpression;
  }

  return null;
}

/**
 * This migration fixes invalid cron expressions in the CronjobController state.
 * Invalid cron expressions can cause the extension to fail during initialization.
 *
 * The migration:
 * 1. Iterates through all cronjob events in the CronjobController state
 * 2. Validates each event's schedule (cron expression)
 * 3. Attempts to fix common errors (e.g., '+' instead of '/')
 * 4. Removes events with unfixable invalid cron expressions
 *
 * @param originalVersionedData - Versioned MetaMask extension state.
 * @returns The updated versioned extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  if (
    !hasProperty(versionedData.data, 'CronjobController') ||
    !isObject(versionedData.data.CronjobController)
  ) {
    return versionedData;
  }

  const cronjobControllerState = versionedData.data
    .CronjobController as CronjobControllerState;

  if (
    !hasProperty(cronjobControllerState, 'events') ||
    !isObject(cronjobControllerState.events)
  ) {
    return versionedData;
  }

  const { events } = cronjobControllerState;
  const eventsToRemove: string[] = [];
  let fixedCount = 0;
  let removedCount = 0;

  // Iterate through all events and validate/fix cron expressions
  for (const [eventId, event] of Object.entries(events)) {
    if (!event || typeof event.schedule !== 'string') {
      continue;
    }

    // Skip non-recurring events (they don't use cron expressions)
    if (!event.recurring) {
      continue;
    }

    // Check if the schedule is a valid cron expression
    if (!isValidCronExpression(event.schedule)) {
      // Attempt to fix the cron expression
      const fixedExpression = attemptCronExpressionFix(event.schedule);

      if (fixedExpression) {
        console.log(
          `Migration #${version}: Fixed invalid cron expression for event ${eventId}: "${event.schedule}" -> "${fixedExpression}"`,
        );
        event.schedule = fixedExpression;
        fixedCount += 1;
      } else {
        console.warn(
          `Migration #${version}: Removing event ${eventId} with unfixable invalid cron expression: "${event.schedule}"`,
        );
        eventsToRemove.push(eventId);
        removedCount += 1;
      }
    }
  }

  // Remove events with unfixable invalid cron expressions
  for (const eventId of eventsToRemove) {
    delete events[eventId];
  }

  if (fixedCount > 0 || removedCount > 0) {
    console.log(
      `Migration #${version}: Fixed ${fixedCount} and removed ${removedCount} invalid cron expression(s)`,
    );
  }

  return versionedData;
}

const migration191 = { migrate, version };
export default migration191;
