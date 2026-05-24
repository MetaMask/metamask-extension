import React, { useMemo } from 'react';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../../components/component-library';

type DiffHighlightedAddressProps = {
  address: string;
  diffIndices: number[];
  label: string;
  dotBackgroundColor: BackgroundColor;
  highlightBackgroundColor?: BackgroundColor;
  diffTextColor?: TextColor;
};

type Segment = {
  text: string;
  isDiff: boolean;
};

function getSegments(address: string, diffIndices: number[]): Segment[] {
  const diffSet = new Set(diffIndices);
  const segments: Segment[] = [];

  for (let i = 0; i < address.length; i++) {
    const isDiff = diffSet.has(i);
    const previousSegment = segments[segments.length - 1];

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
  highlightBackgroundColor = BackgroundColor.errorMuted,
  diffTextColor = TextColor.errorDefault,
}: DiffHighlightedAddressProps) {
  const segments = useMemo(
    () => getSegments(address, diffIndices),
    [address, diffIndices],
  );

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.LG}
      padding={3}
    >
      <Box display={Display.Flex} className="items-center mb-2">
        <Box
          backgroundColor={dotBackgroundColor}
          borderRadius={BorderRadius.full}
          className="w-2 h-2 mr-2"
        />
        <Text
          variant={TextVariant.bodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.textAlternative}
        >
          {label}
        </Text>
      </Box>
      <Text
        as="span"
        variant={TextVariant.bodySm}
        color={TextColor.textAlternative}
        className="break-all"
      >
        {segments.map((segment, index) => (
          <Text
            as="span"
            key={`${index}-${segment.isDiff}`}
            variant={TextVariant.inherit}
            color={segment.isDiff ? diffTextColor : TextColor.textAlternative}
            backgroundColor={
              segment.isDiff ? highlightBackgroundColor : undefined
            }
            fontWeight={segment.isDiff ? FontWeight.Bold : undefined}
          >
            {segment.text}
          </Text>
        ))}
      </Text>
    </Box>
  );
}
