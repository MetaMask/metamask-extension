import { cloneDeep } from 'lodash';
import {
  hasProperty,
  isObject,
  type Json,
  assert,
  isPlainObject,
} from '@metamask/utils';
import { SnapId } from '@metamask/snaps-sdk';
import { DateTime } from 'luxon';
import { parseExpression } from 'cron-parser';
import {
  PermissionControllerState,
  PermissionConstraint,
} from '@metamask/permission-controller';
import { isSnapId, SnapCaveatType } from '@metamask/snaps-utils';
import { SnapEndowments } from '@metamask/snaps-rpc-methods';

/**
 * The versioned data containing the extension state and metadata.
 */
type VersionedData = {
  /**
   * Metadata about the versioned data.
   */
  meta: {
    /**
     * The version of the state. This should be one version behind the current
     * migration version, and should be incremented by one for each migration.
     */
    version: number;
  };

  /**
   * The persisted MetaMask state, keyed by controller.
   */
  data: Record<string, unknown>;
};

export const version = 165;

/**
 * This migration updates the `CronjobController` state to remove the `jobs`
 * property from state and combine it with the `events` property. It also adds
 * new properties to the state to support the new `CronjobController` API.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state without the tokens property.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

type LegacyStoredJobInformation = {
  lastRun: number;
};

type LegacyBackgroundEvent = {
  id: string;
  scheduledAt: string;
  snapId: SnapId;
  date: string;
  request: {
    method: string;
    jsonrpc?: '2.0' | undefined;
    id?: string | number | null | undefined;
    params?: Json[] | Record<string, Json> | undefined;
  };
};

type LegacyCronjobControllerState = {
  // `jobs` is optional to support `delete` operations in the migration.
  jobs?: Record<string, LegacyStoredJobInformation>;
  events: Record<string, LegacyBackgroundEvent>;
};

/**
 * Represents a background event that is scheduled to be executed by the
 * cronjob controller.
 */
type BackgroundEvent = LegacyBackgroundEvent & {
  /**
   * Whether the event is recurring.
   */
  recurring: boolean;

  /**
   * The cron expression or ISO 8601 duration string that defines the event's
   * schedule.
   */
  schedule: string;
};

/**
 * A cronjob caveat value that contains the jobs to be executed by the
 * cronjob controller.
 */
type CronjobCaveatValue = {
  expression: string;
  request: {
    method: string;
    jsonrpc?: '2.0';
    id?: string | number | null;
    params?: Json[] | Record<string, Json>;
  };
};

/**
 * Get the next execution date from a schedule, which should be either:
 *
 * - An ISO 8601 date string, or
 * - A cron expression.
 *
 * @param schedule - The schedule of the event.
 * @returns The parsed ISO 8601 date at which the event should be executed.
 */
// TODO: Export this function from the `@metamask/snaps-controllers` package?
export function getExecutionDate(schedule: string) {
  const date = DateTime.fromISO(schedule, { setZone: true });
  if (date.isValid) {
    const now = Date.now();

    // We round to the nearest second to avoid milliseconds in the output.
    const roundedDate = date.toUTC().startOf('second');
    if (roundedDate.toMillis() < now) {
      throw new Error('Cannot schedule an event in the past.');
    }

    return roundedDate.toISO({
      suppressMilliseconds: true,
    });
  }

  try {
    const parsed = parseExpression(schedule, { utc: true });
    const next = parsed.next();
    const nextDate = DateTime.fromJSDate(next.toDate());

    assert(nextDate.isValid);
    return nextDate.toUTC().toISO();
  } catch {
    throw new Error(
      `Unable to parse "${schedule}" as ISO 8601 date, ISO 8601 duration, or cron expression.`,
    );
  }
}

/**
 * Transform the state of the `CronjobController` to the new unified format.
 * This migration removes the `jobs` property and combines it with the
 * `events` property. It also ensures that the state is in the correct
 * format for the new `CronjobController` API.
 *
 * @param state - The MetaMask extension state.
 * @returns The updated MetaMask extension state with the transformed
 * `CronjobController` state.
 */
function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (
    !hasProperty(state, 'CronjobController') ||
    !isObject(state.CronjobController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Skipping migration ${version}: \`CronjobController\` state not found or is not an object.`,
      ),
    );

    return state;
  }

  if (
    !hasProperty(state, 'PermissionController') ||
    !isObject(state.PermissionController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Skipping migration ${version}: \`PermissionController\` state not found or is not an object.`,
      ),
    );

    return state;
  }

  const cronjobControllerState =
    state.CronjobController as LegacyCronjobControllerState;
  const permissionControllerState =
    state.PermissionController as PermissionControllerState<PermissionConstraint>;

  // New events object created from the legacy jobs.
  const eventsFromJobs = Object.fromEntries(
    Object.values(permissionControllerState.subjects)
      .filter(
        (subject) =>
          isSnapId(subject.origin) &&
          subject.permissions[SnapEndowments.Cronjob],
      )
      .flatMap((subject) => {
        const { caveats } = subject.permissions[SnapEndowments.Cronjob];
        if (!Array.isArray(caveats)) {
          return [];
        }

        const cronjobCaveat = caveats.find(
          (caveat) => caveat.type === SnapCaveatType.SnapCronjob,
        );

        if (
          !cronjobCaveat?.value ||
          !isPlainObject(cronjobCaveat.value) ||
          !hasProperty(cronjobCaveat.value, 'jobs') ||
          !Array.isArray(cronjobCaveat.value.jobs)
        ) {
          return [];
        }

        const jobs = cronjobCaveat.value.jobs as CronjobCaveatValue[];
        return jobs.map(({ expression, request }, index): BackgroundEvent => {
          const legacyId = `${subject.origin}-${index}`;
          const { lastRun } = cronjobControllerState.jobs?.[legacyId] ?? {
            lastRun: 0,
          };

          // If the cronjob is scheduled to run in the past, we use the
          // last run time to determine the next execution date. This will ensure
          // that the cronjob controller runs the job immediately.
          const parsed = parseExpression(expression);
          const date =
            parsed.hasPrev() && parsed.prev().getTime() > lastRun
              ? parsed.prev().toISOString()
              : getExecutionDate(expression);

          return {
            id: `cronjob-${subject.origin}-${index}`,
            recurring: true,
            schedule: expression,
            scheduledAt: new Date().toISOString(),
            snapId: subject.origin as SnapId,
            date,
            request,
          };
        });
      })
      .map((event) => [event.id, event]),
  );

  // New events object created from the legacy events.
  const eventsFromLegacyEvents = Object.fromEntries(
    Object.entries(cronjobControllerState.events ?? {}).map(
      ([id, event]): [string, BackgroundEvent] => {
        return [
          id,
          {
            ...event,

            // Legacy background events are never recurring.
            recurring: false,

            // We don't know the original schedule, so we use the parsed date.
            // It's not used for non-recurring events anyway.
            schedule: event.date,
          },
        ];
      },
    ),
  );

  cronjobControllerState.events = {
    ...eventsFromLegacyEvents,
    ...eventsFromJobs,
  };

  delete cronjobControllerState.jobs;

  return state;
}
