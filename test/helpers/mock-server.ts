import { MockedEndpoint } from '../e2e/mock-e2e';
import { Driver } from '../e2e/webdriver/driver';
import { strict as assert } from 'assert';

const TIMEOUT_DEFAULT = 10 * 1000; // 10 Seconds

export async function expectMockRequest(
  driver: Driver,
  mockedEndpoint: MockedEndpoint,
  { timeout }: { timeout?: number } = {},
) {
  await driver.wait(async () => {
    const isPending = await mockedEndpoint.isPending();
    return isPending === false;
  }, timeout ?? TIMEOUT_DEFAULT);

  const requests = await mockedEndpoint.getSeenRequests();
  assert.equal(requests.length, 1, 'Expected single request');
}

export async function expectNoMockRequest(
  driver: Driver,
  mockedEndpoint: MockedEndpoint,
  { timeout }: { timeout?: number } = {},
) {
  await driver.delay(timeout ?? TIMEOUT_DEFAULT);

  const isPending = await mockedEndpoint.isPending();
  const requests = await mockedEndpoint.getSeenRequests();

  assert.ok(isPending, 'Expected no pending requests');
  assert.equal(requests.length, 0, 'Expected no seen requests');
}
