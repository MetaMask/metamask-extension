import React from 'react';
import { Box, Text } from '../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

/**
 * Subset of the `Revert` type from `@metamask/transaction-controller`. Reproduced
 * here because the type is not exported from the package's public entrypoint.
 */
export type RevertInfo = {
  message?: string;
  data?: string;
};

export type RevertReasonProps = {
  revert: RevertInfo;
  'data-testid'?: string;
};

export function RevertReason({
  revert,
  'data-testid': dataTestId = 'revert-reason',
}: RevertReasonProps) {
  const { message } = revert;

  if (!message) {
    return null;
  }

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundMuted}
      borderRadius={BorderRadius.SM}
      paddingInline={2}
      paddingTop={2}
      paddingBottom={2}
      data-testid={dataTestId}
    >
      <Text
        as="code"
        variant={TextVariant.bodySm}
        color={TextColor.textAlternative}
        style={{ fontFamily: 'monospace', wordBreak: 'break-word' }}
        data-testid={`${dataTestId}-message`}
      >
        {message}
      </Text>
    </Box>
  );
}
