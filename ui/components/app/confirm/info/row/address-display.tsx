import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { AvatarAccountSize } from '@metamask/design-system-react';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../component-library';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { PreferredAvatar } from '../../../preferred-avatar';
import NameDetails from '../../../name/name-details/name-details';
import { useConfirmContext } from '../../../../../pages/confirmations/context/confirm';
import { useDisplayName } from '../../../../../hooks/useDisplayName';

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
    const { currentConfirmation: transactionMeta } =
      useConfirmContext<TransactionMeta>();

    const hexAddress = toChecksumHexAddress(address);
    const chainId = transactionMeta.chainId;

    const { name, isAccount } = useDisplayName({
      value: hexAddress,
      type: NameType.ETHEREUM_ADDRESS,
      preferContractSymbol: true,
      variation: chainId,
    });

    const [modalOpen, setModalOpen] = useState(false);

    const isClickable = !isAccount;
    const { containerRef, display } = useMiddleTruncation(hexAddress);

    const handleClick = useCallback(() => {
      if (!isClickable) {
        return;
      }
      setModalOpen(true);
    }, [isClickable]);

    const handleModalClose = useCallback(() => {
      setModalOpen(false);
    }, []);

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        gap={2}
      >
        {modalOpen && (
          <NameDetails
            value={hexAddress}
            type={NameType.ETHEREUM_ADDRESS}
            variation={chainId}
            onClose={handleModalClose}
          />
        )}
        {name ? (
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textDefault}
            data-testid="confirm-info-row-display-name"
            className={
              isClickable
                ? 'confirm-info-row-address-display__clickable'
                : undefined
            }
            style={{ whiteSpace: 'nowrap', flex: 1 }}
            onClick={handleClick}
          >
            {name}
          </Text>
        ) : (
          <Text
            ref={containerRef}
            variant={TextVariant.bodyMd}
            color={TextColor.textDefault}
            data-testid="confirm-info-row-display-name"
            className={
              isClickable
                ? 'confirm-info-row-address-display__clickable'
                : undefined
            }
            style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
            onClick={handleClick}
          >
            {display}
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
