const VERSION_SEPARATOR_CHAR_CODE = 46;
const VERSION_ZERO_CHAR_CODE = 48;
const VERSION_NINE_CHAR_CODE = 57;

type DottedVersionPart = {
  readonly implicitZero: boolean;
  readonly nextIndex: number;
  readonly normalizedLength: number;
  readonly normalizedStart: number;
};

/**
 * Checks whether a dotted numeric `base` version is strictly lower than both
 * `first` and `second` (`base < first` and `base < second`), parsing `base`
 * only once.
 *
 * @param base - Base version.
 * @param first - First comparison version.
 * @param second - Second comparison version.
 */
export function isDottedNumericVersionLowerThanBoth(
  base: string,
  first: string,
  second: string,
): boolean {
  if (base.length === 0 || first.length === 0 || second.length === 0) {
    return false;
  }

  let baseIndex = 0;
  let firstIndex = 0;
  let secondIndex = 0;
  let baseToFirst: 1 | 0 | -1 = 0;
  let baseToSecond: 1 | 0 | -1 = 0;

  for (let partIndex = 0; partIndex < 4; partIndex += 1) {
    const basePart = readNextDottedVersionPart(base, baseIndex, partIndex);
    const firstPart = readNextDottedVersionPart(first, firstIndex, partIndex);
    const secondPart = readNextDottedVersionPart(
      second,
      secondIndex,
      partIndex,
    );
    if (!basePart || !firstPart || !secondPart) {
      return false;
    }

    baseIndex = basePart.nextIndex;
    firstIndex = firstPart.nextIndex;
    secondIndex = secondPart.nextIndex;

    if (baseToFirst === 0) {
      baseToFirst = compareDottedVersionParts(base, basePart, first, firstPart);

      if (baseToFirst > 0) {
        return false;
      }
    }

    if (baseToSecond === 0) {
      baseToSecond = compareDottedVersionParts(
        base,
        basePart,
        second,
        secondPart,
      );

      if (baseToSecond > 0) {
        return false;
      }
    }
  }

  if (
    baseIndex !== base.length ||
    firstIndex !== first.length ||
    secondIndex !== second.length
  ) {
    return false;
  }

  return baseToFirst < 0 && baseToSecond < 0;
}

function compareDottedVersionParts(
  leftVersion: string,
  leftPart: DottedVersionPart,
  rightVersion: string,
  rightPart: DottedVersionPart,
): 1 | 0 | -1 {
  if (leftPart.normalizedLength > rightPart.normalizedLength) {
    return 1;
  }
  if (leftPart.normalizedLength < rightPart.normalizedLength) {
    return -1;
  }

  for (let index = 0; index < leftPart.normalizedLength; index += 1) {
    const leftCharCode = leftPart.implicitZero
      ? VERSION_ZERO_CHAR_CODE
      : leftVersion.charCodeAt(leftPart.normalizedStart + index);
    const rightCharCode = rightPart.implicitZero
      ? VERSION_ZERO_CHAR_CODE
      : rightVersion.charCodeAt(rightPart.normalizedStart + index);

    if (leftCharCode > rightCharCode) {
      return 1;
    }
    if (leftCharCode < rightCharCode) {
      return -1;
    }
  }

  return 0;
}

function readNextDottedVersionPart(
  version: string,
  index: number,
  partIndex: number,
): DottedVersionPart | null {
  const versionLength = version.length;

  if (index === versionLength) {
    if (partIndex === 3) {
      return {
        implicitZero: true,
        nextIndex: index,
        normalizedLength: 1,
        normalizedStart: 0,
      };
    }

    return null;
  }

  if (version.charCodeAt(index) === VERSION_SEPARATOR_CHAR_CODE) {
    return null;
  }

  let cursor = index;
  while (cursor < versionLength) {
    const charCode = version.charCodeAt(cursor);

    if (
      charCode >= VERSION_ZERO_CHAR_CODE &&
      charCode <= VERSION_NINE_CHAR_CODE
    ) {
      cursor += 1;
      continue;
    }

    if (charCode !== VERSION_SEPARATOR_CHAR_CODE) {
      return null;
    }

    break;
  }

  const rawPartEnd = cursor;
  if (rawPartEnd === index) {
    return null;
  }

  if (cursor < versionLength) {
    if (partIndex === 3 || cursor + 1 === versionLength) {
      return null;
    }
    cursor += 1;
  } else if (partIndex < 2) {
    return null;
  }

  let normalizedStart = index;
  while (
    normalizedStart < rawPartEnd - 1 &&
    version.charCodeAt(normalizedStart) === VERSION_ZERO_CHAR_CODE
  ) {
    normalizedStart += 1;
  }

  return {
    implicitZero: false,
    nextIndex: cursor,
    normalizedLength: rawPartEnd - normalizedStart,
    normalizedStart,
  };
}
