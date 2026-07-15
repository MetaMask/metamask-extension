import React from 'react';
import {
  AvatarIcon,
  AvatarIconSeverity,
  AvatarIconSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { LEDGER_CONNECTION_STATUS_CONTENT } from '../ledger-connection-status.constants';
import type { LedgerConnectionStatusInstructionsProps } from './ledger-connection-status-instructions.types';

/**
 * Renders troubleshooting steps when a Ledger device is not detected.
 * @param props - Component props.
 * @param props.status - Device-not-found connection state.
 */
export const LedgerConnectionStatusInstructions = ({
  status,
}: Readonly<LedgerConnectionStatusInstructionsProps>) => {
  const t = useI18nContext();
  const { instructions } = LEDGER_CONNECTION_STATUS_CONTENT[status];

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingTop={2}
      paddingBottom={2}
      className="rounded-xl w-full max-w-[20rem]"
      data-testid="ledger-connection-status-instructions"
    >
      {instructions?.map(({ iconName, messageKey }) => (
        <Box
          key={messageKey}
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={4}
          paddingTop={2}
          paddingBottom={2}
          data-testid={`ledger-connection-status-instruction-${messageKey}`}
        >
          <AvatarIcon
            iconName={iconName}
            size={AvatarIconSize.Lg}
            severity={AvatarIconSeverity.Neutral}
          />
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t(messageKey)}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default LedgerConnectionStatusInstructions;
