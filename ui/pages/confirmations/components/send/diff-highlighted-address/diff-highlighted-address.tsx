import React, { useMemo } from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

type DiffHighlightedAddressProps = Readonly<{
  address: string;
  diffIndices: readonly number[];
  label: string;
  dotBackgroundColor: BoxBackgroundColor;
  highlightBackgroundColor?: BoxBackgroundColor;
  diffTextColor?: TextColor;
}>;

type Segment = {
  text: string;
  isDiff: boolean;
};

function getSegments(
  address: string,
  diffIndices: readonly number[],
): Segment[] {
  const diffSet = new Set(diffIndices);
  const segments: Segment[] = [];

  for (let i = 0; i < address.length; i++) {
    const isDiff = diffSet.has(i);
    const previousSegment = segments.at(-1);

    if (previousSegment?.isDiff === isDiff) {
      previousSegment.text += address[i];
    } else {
      segments.push({ text: address[i], isDiff });
    }
  }

  return segments;
}

export function DiffHighlightedAddress({
  address,
  diffIndices,
  label,
  dotBackgroundColor,
  highlightBackgroundColor = BoxBackgroundColor.ErrorMuted,
  diffTextColor = TextColor.ErrorDefault,
}: DiffHighlightedAddressProps) {
  const segments = useMemo(
    () => getSegments(address, diffIndices),
    [address, diffIndices],
  );

  return (
    <Box
      backgroundColor={BoxBackgroundColor.BackgroundAlternative}
      className="rounded-lg"
      padding={3}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className="mb-2"
      >
        <Box
          backgroundColor={dotBackgroundColor}
          className="w-2 h-2 mr-2 rounded-full"
        />
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {label}
        </Text>
      </Box>
      <Text
        asChild
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        className="break-all"
      >
        <span>
          {segments.map((segment, index) => (
            <span
              key={`${index}-${segment.isDiff}`}
              className={classnames(
                segment.isDiff
                  ? [diffTextColor, highlightBackgroundColor, 'font-bold']
                  : TextColor.TextAlternative,
              )}
            >
              {segment.text}
            </span>
          ))}
        </span>
      </Text>
    </Box>
  );
}
