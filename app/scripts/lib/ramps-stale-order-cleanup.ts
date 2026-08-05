import {
  RampsOrderStatus,
  type RampsController,
  type RampsOrder,
} from '@metamask/ramps-controller';

/**
 * How long a precreated order id stays claimable. Mirrors the ramps API's
 * custom-id expiration window, after which the provider can no longer attach a
 * real order to the id we reserved.
 */
const PRECREATED_ORDER_TTL_MS = 60 * 60 * 1000;

/**
 * A precreated stub is a placeholder we seeded at checkout, not an order the
 * provider has acknowledged. Once its id window closes it can never become one:
 * the API answers with an empty payload (or nothing at all, once the provider's
 * external-id lookup comes back empty), so polling can neither complete nor
 * expire it and the stub would linger in state forever.
 *
 * @param order - The order to evaluate.
 * @param now - Current timestamp.
 * @returns True when the stub can no longer resolve and should be dropped.
 */
function isDeadPrecreatedStub(order: RampsOrder, now: number): boolean {
  // Anything the provider filled in is a real order — never prune it.
  if (order.cryptoCurrency || order.txHash) {
    return false;
  }

  if (order.status === RampsOrderStatus.IdExpired) {
    return true;
  }

  if (
    order.status !== RampsOrderStatus.Precreated &&
    order.status !== RampsOrderStatus.Unknown
  ) {
    return false;
  }

  // Polling stamps `idExpirationDate` when it gets an answer; stubs that never
  // got one fall back to their own age.
  const expiresAt =
    order.idExpirationDate ??
    (order.createdAt ? order.createdAt + PRECREATED_ORDER_TTL_MS : undefined);

  return expiresAt === undefined ? false : now > expiresAt;
}

/**
 * Drops precreated stubs that can no longer resolve into real orders, so they
 * stop accumulating in state and stop being polled on every cycle.
 *
 * @param rampsController - The ramps controller holding order state.
 * @param now - Current timestamp, injectable for tests.
 * @returns The internal order codes that were removed.
 */
export function removeStalePrecreatedOrders(
  rampsController: RampsController,
  now: number = Date.now(),
): string[] {
  const stale = (rampsController.state?.orders ?? []).filter((order) =>
    isDeadPrecreatedStub(order, now),
  );

  for (const order of stale) {
    rampsController.removeOrder(order.providerOrderId);
  }

  return stale.map((order) => order.providerOrderId);
}
