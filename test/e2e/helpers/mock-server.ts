import { strict as assert } from 'assert';
import { Driver } from '../webdriver/driver';
import { MockedEndpoint } from '../mock-e2e';

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
}

export async function expectNoMockRequest(
  driver: Driver,
  mockedEndpoint: MockedEndpoint,
  { timeout }: { timeout?: number } = {},
) {
  await driver.delay(timeout ?? TIMEOUT_DEFAULT);

  const isPending = await mockedEndpoint.isPending();

  assert.ok(isPending, 'Expected no requests');
}
