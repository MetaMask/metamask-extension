import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useEffect, useRef, useState } from 'react';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { Box, Text } from '../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransferRecipient } from '../hooks/useTransferRecipient';
import { PreferredAvatar } from '../../../../../../components/app/preferred-avatar';
import { useFallbackDisplayName } from '../../../../../../components/app/confirm/info/row/hook';
import { shortenAddress } from '../../../../../../helpers/utils/util';

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

const AddressDisplay = ({ address }: { address: string }) => {
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
};

export const TransactionFlowSection = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const recipientAddress = useTransferRecipient();

  return (
    <ConfirmInfoSection data-testid="confirmation__transaction-flow">
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.SigningInWith}
          label={t('from')}
          ownerId={transactionMeta.id}
          style={{ flexDirection: FlexDirection.Column, width: '100%' }}
        >
          <Box marginTop={2} data-testid="sender-address" className="w-full">
            <AddressDisplay address={transactionMeta.txParams.from} />
          </Box>
        </ConfirmInfoAlertRow>

        <Box style={{ borderTop: `1px solid var(--color-border-muted)` }}>
          <ConfirmInfoAlertRow
            alertKey={RowAlertKey.InteractingWith}
            label={t('to')}
            ownerId={transactionMeta.id}
            style={{ flexDirection: FlexDirection.Column, width: '100%' }}
          >
            <Box
              marginTop={2}
              data-testid="recipient-address"
              className="w-full"
            >
              <AddressDisplay address={recipientAddress ?? ''} />
            </Box>
          </ConfirmInfoAlertRow>
        </Box>
      </Box>
    </ConfirmInfoSection>
  );
};
