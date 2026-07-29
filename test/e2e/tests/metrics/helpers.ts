import { MockedEndpoint } from 'mockttp';
import { getEventPayloads } from '../../helpers';

type IdentifyEvent = { traits: Record<string, unknown> };

function mergeTraits(events: IdentifyEvent[]): Record<string, unknown> {
  return events.reduce(
    (acc, event) => ({ ...acc, ...event.traits }),
    {} as Record<string, unknown>,
  );
}

/**
 * Poll getEventPayloads until the merged traits satisfy every key/value in `expected`.
 * Throws TimeoutError if the traits don't converge within the timeout window.
 *
 * @param driver - The WebDriver instance.
 * @param driver.wait - Polls a condition function until it returns true or the timeout expires.
 * @param mockedEndpoints - The mockttp mocked endpoints to retrieve seen requests from.
 * @param expected - Key/value pairs that the merged traits must satisfy.
 * @param timeout - Maximum time in ms to wait for the traits to converge.
 */
export async function waitForExpectedTraits(
  driver: {
    wait: (condition: () => Promise<boolean>, timeout: number) => Promise<void>;
  },
  mockedEndpoints: MockedEndpoint[],
  expected: Record<string, unknown>,
  timeout = 30_000,
): Promise<Record<string, unknown>> {
  let events: IdentifyEvent[] = [];
  await driver.wait(async () => {
    try {
      events = await getEventPayloads(driver, mockedEndpoints, false);
    } catch {
      return false;
    }
    if (events.length === 0) {
      return false;
    }
    const traits = mergeTraits(events);
    return Object.entries(expected).every(
      ([key, value]) => traits[key] === value,
    );
  }, timeout);
  return mergeTraits(events);
}
