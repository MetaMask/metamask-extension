import React, { memo, useEffect, useRef, useState } from 'react';
import { AvatarAccountSize } from '@metamask/design-system-react';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../component-library';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { PreferredAvatar } from '../../../preferred-avatar';
import { useFallbackDisplayName } from './hook';

const ELLIPSIS = '\u2026';

function useMiddleTruncation(text: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const availableWidth = el.clientWidth;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const style = getComputedStyle(el);
    ctx.font = `${style.fontSize} ${style.fontFamily}`;

    if (ctx.measureText(text).width <= availableWidth) {
      setDisplay(text);
      return;
    }

    const ellipsisWidth = ctx.measureText(ELLIPSIS).width;
    const halfWidth = (availableWidth - ellipsisWidth) / 2;

    let startEnd = 0;
    let w = 0;
    for (let i = 0; i < text.length; i++) {
      w += ctx.measureText(text[i]).width;
      if (w > halfWidth) {
        break;
      }
      startEnd = i + 1;
    }

    let tailStart = text.length;
    w = 0;
    for (let i = text.length - 1; i >= 0; i--) {
      w += ctx.measureText(text[i]).width;
      if (w > halfWidth) {
        break;
      }
      tailStart = i;
    }

    setDisplay(`${text.slice(0, startEnd)}${ELLIPSIS}${text.slice(tailStart)}`);
  }, [text]);

  return { containerRef, display };
}

export type ConfirmInfoRowAddressDisplayProps = {
  address: string;
};

export const ConfirmInfoRowAddressDisplay = memo(
  ({ address }: ConfirmInfoRowAddressDisplayProps) => {
    const { displayName, hexAddress } = useFallbackDisplayName(address);

    const isUnknown = displayName === shortenAddress(hexAddress);
    const { containerRef, display } = useMiddleTruncation(hexAddress);

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        {isUnknown ? (
          <Text
            ref={containerRef}
            variant={TextVariant.bodyMd}
            color={TextColor.textDefault}
            data-testid="confirm-info-row-display-name"
            style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
          >
            {display}
          </Text>
        ) : (
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textDefault}
            data-testid="confirm-info-row-display-name"
            style={{ whiteSpace: 'nowrap', flex: 1 }}
          >
            {displayName}
          </Text>
        )}
        <PreferredAvatar
          address={hexAddress}
          size={AvatarAccountSize.Sm}
          style={{ flexShrink: 0 }}
        />
      </Box>
    );
  },
);
