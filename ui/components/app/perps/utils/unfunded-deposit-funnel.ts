const UNFUNDED_DEPOSIT_FUNNEL_KEY = 'perps.unfundedDepositFunnel';

type UnfundedDepositFunnel = {
  /** The address that was unfunded when the user clicked Add funds. */
  address: string;
  /** When a deposit for that address confirmed, or null while it is pending. */
  confirmedAt: number | null;
};

function readFunnel(): UnfundedDepositFunnel | null {
  try {
    const raw = sessionStorage.getItem(UNFUNDED_DEPOSIT_FUNNEL_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<UnfundedDepositFunnel>;
    if (typeof parsed?.address !== 'string') {
      return null;
    }
    return {
      address: parsed.address,
      confirmedAt:
        typeof parsed.confirmedAt === 'number' ? parsed.confirmedAt : null,
    };
  } catch {
    // sessionStorage can throw in locked contexts, and the value can be stale.
    return null;
  }
}

function writeFunnel(funnel: UnfundedDepositFunnel): void {
  try {
    sessionStorage.setItem(UNFUNDED_DEPOSIT_FUNNEL_KEY, JSON.stringify(funnel));
  } catch {
    // sessionStorage can throw in locked or quota-exceeded contexts.
  }
}

/**
 * Marks this tab's session as an unfunded trade-screen deposit for `address`,
 * so later deposit-opened / deposit-confirmed / order-submitted events can be
 * joined. The funnel is not joinable until `confirmUnfundedDepositFunnel` runs.
 *
 * @param address - The unfunded account that started the deposit.
 */
export function markUnfundedDepositFunnel(address: string): void {
  writeFunnel({ address, confirmedAt: null });
}

/**
 * Whether an unfunded deposit is in flight for `address`. Used to tag the
 * deposit-opened and deposit-confirmed events.
 *
 * @param address - The account the event is being emitted for.
 */
export function isUnfundedDepositFunnelActive(
  address: string | undefined | null,
): boolean {
  if (!address) {
    return false;
  }
  return readFunnel()?.address === address;
}

/**
 * Records that the deposit started from the unfunded CTA actually confirmed.
 * Only after this does `consumeUnfundedDepositFunnel` report a joinable funnel.
 *
 * @param address - The account whose deposit confirmed.
 */
export function confirmUnfundedDepositFunnel(
  address: string | undefined | null,
): void {
  if (!address) {
    return;
  }
  const funnel = readFunnel();
  if (funnel?.address !== address) {
    return;
  }
  writeFunnel({ ...funnel, confirmedAt: Date.now() });
}

/** Drops the funnel, e.g. when the deposit failed or was abandoned. */
export function clearUnfundedDepositFunnel(): void {
  try {
    sessionStorage.removeItem(UNFUNDED_DEPOSIT_FUNNEL_KEY);
  } catch {
    // Ignore storage failures; a stale entry is address-scoped anyway.
  }
}

/**
 * Returns whether `address` placed this order after a confirmed deposit that
 * started from the unfunded CTA, then clears the funnel. Call once from the
 * successful order-submit path so a later unrelated order does not inherit it.
 *
 * @param address - The account submitting the order.
 */
export function consumeUnfundedDepositFunnel(
  address: string | undefined | null,
): boolean {
  if (!address) {
    return false;
  }
  const funnel = readFunnel();
  if (funnel?.address !== address || funnel.confirmedAt === null) {
    return false;
  }
  clearUnfundedDepositFunnel();
  return true;
}
