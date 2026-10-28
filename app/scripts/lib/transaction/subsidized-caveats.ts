import { Hex } from '@metamask/utils';
import { NestedTransactionMetadata } from '@metamask/transaction-controller';
import {
  Caveat,
  DeleGatorEnvironment,
  ExecutionStruct,
} from '../../../../shared/lib/delegation';

/**
 * Must match the placeholder used by the Intents / Relay execute API so
 * subsidized quotes can inject the real order ID after signing.
 */
export const SUBSIDIZED_ORDER_ID_PLACEHOLDER =
  '0x07cece46d0aec658b12c9d194b3ac3cc74aadf102176005c76f96422b57328b2' as Hex;

/** The number of bytes in a function selector. */
const SELECTOR_BYTES = 4;

type ByteRange = {
  end: number;
  start: number;
};

type EnforcedSegment = {
  startIndex: number;
  value: Hex;
};

/**
 * Builds the caveats specific to a subsidized transaction.
 *
 * Restricts the delegation to the batch target and enforces all calldata
 * except the order ID placeholder, so the order ID can be injected after
 * signing.
 *
 * @param environment - DeleGator environment.
 * @param execution - Batch execution the delegation will be redeemed with.
 * @param nestedTransactions - Calls within the batch, used to find the order ID.
 * @returns The subsidized caveats.
 */
export function getSubsidizedCaveats(
  environment: DeleGatorEnvironment,
  execution: ExecutionStruct | undefined,
  nestedTransactions: NestedTransactionMetadata[] = [],
): Caveat[] {
  try {
    return buildSubsidizedCaveats(environment, execution, nestedTransactions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Subsidized Caveats: ${message}`, { cause: error });
  }
}

function buildSubsidizedCaveats(
  environment: DeleGatorEnvironment,
  execution: ExecutionStruct | undefined,
  nestedTransactions: NestedTransactionMetadata[],
): Caveat[] {
  const { callData, target } = execution ?? {};

  if (!target || !callData || callData === '0x') {
    throw new Error('Missing batch target or calldata');
  }

  const allowedTargetsCaveat: Caveat = {
    args: '0x',
    enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
    terms: concatHex([target]),
  };

  const allowedCalldataCaveats: Caveat[] = getEnforcedSegments(
    callData,
    nestedTransactions,
  ).map(({ startIndex, value }) => ({
    args: '0x',
    enforcer: environment.caveatEnforcers.AllowedCalldataEnforcer,
    terms: concatHex([toUint256Hex(startIndex), value]),
  }));

  return [allowedTargetsCaveat, ...allowedCalldataCaveats];
}

function getEnforcedSegments(
  calldata: Hex,
  nestedTransactions: { data?: string }[],
): EnforcedSegment[] {
  const freeRanges = findByteRanges(calldata, [
    SUBSIDIZED_ORDER_ID_PLACEHOLDER,
  ]);

  const splitPoints = getSplitPoints(calldata, nestedTransactions);

  return getSegmentsBetweenFreeRanges(calldata, freeRanges, splitPoints);
}

function getSplitPoints(
  calldata: Hex,
  nestedTransactions: { data?: string }[],
): number[] {
  const placeholderBody =
    SUBSIDIZED_ORDER_ID_PLACEHOLDER.slice(2).toLowerCase();

  const nestedData = nestedTransactions
    .map((tx) => tx.data)
    .filter((data): data is string => data !== undefined && data.length >= 10)
    .map((data) => data.toLowerCase() as Hex)
    .filter((data) => data.includes(placeholderBody));

  const ranges = findByteRanges(calldata, nestedData);

  const points = ranges.map((range) => range.start + SELECTOR_BYTES);

  return [...new Set(points)].sort((a, b) => a - b);
}

function findByteRanges(calldata: Hex, needles: Hex[]): ByteRange[] {
  const haystack = calldata.slice(2).toLowerCase();

  return needles.flatMap((needle) => {
    const body = needle.slice(2).toLowerCase();
    const byteLength = body.length / 2;
    const ranges: ByteRange[] = [];

    let charIndex = haystack.indexOf(body);
    while (charIndex !== -1) {
      if (charIndex % 2 === 0) {
        const start = charIndex / 2;
        ranges.push({ start, end: start + byteLength });
      }
      charIndex = haystack.indexOf(body, charIndex + 1);
    }

    return ranges;
  });
}

function getSegmentsBetweenFreeRanges(
  calldata: Hex,
  freeRanges: ByteRange[],
  splitPoints: number[],
): EnforcedSegment[] {
  const totalBytes = (calldata.length - 2) / 2;
  const sliceValue = (start: number, end: number): Hex =>
    `0x${calldata.slice(2 + start * 2, 2 + end * 2)}` as Hex;

  const sortedFree = [...freeRanges].sort((a, b) => a.start - b.start);
  const sortedSplitPoints = [...splitPoints].sort((a, b) => a - b);

  const segments: EnforcedSegment[] = [];

  let cursor = 0;
  for (const free of [...sortedFree, { start: totalBytes, end: totalBytes }]) {
    addSegments(cursor, free.start, sortedSplitPoints, segments, sliceValue);
    cursor = Math.max(cursor, free.end);
  }

  return segments;
}

function addSegments(
  start: number,
  end: number,
  sortedSplitPoints: number[],
  segments: EnforcedSegment[],
  sliceValue: (from: number, to: number) => Hex,
): void {
  const pushSegment = (from: number, to: number) => {
    if (to > from) {
      segments.push({ startIndex: from, value: sliceValue(from, to) });
    }
  };

  const pointsInRange = sortedSplitPoints.filter(
    (point) => point > start && point < end,
  );

  let cursor = start;
  for (const point of pointsInRange) {
    pushSegment(cursor, point);
    cursor = point;
  }

  pushSegment(cursor, end);
}

function toUint256Hex(value: number): Hex {
  return `0x${value.toString(16).padStart(64, '0')}` as Hex;
}

function concatHex(values: Hex[]): Hex {
  return `0x${values.map((value) => value.slice(2).toLowerCase()).join('')}` as Hex;
}
