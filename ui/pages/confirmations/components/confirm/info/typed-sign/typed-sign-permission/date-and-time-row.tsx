import {
  Text,
  TextColor,
  TextVariant,
  Box,
  BoxFlexDirection,
  TextAlign,
} from '@metamask/design-system-react';
import { DateTime } from 'luxon';
import React from 'react';

import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import { DAY } from '../../../../../../../../shared/constants/time';

/**
 * Component for displaying a date and time in a confirm info row. Only shows
 * the time part if the timestamp is within the next day.
 *
 * @param props - The component props
 * @param props.timestamp - The timestamp to display
 * @param props.label - The label to display
 * @param props.tooltip - The tooltip to display
 */
export const DateAndTimeRow: React.FC<{
  timestamp: number;
  label: string;
  tooltip?: string;
}> = ({ timestamp, label, tooltip }) => {
  const timestampUTC = DateTime.fromSeconds(timestamp).toUTC();

  const datePart = timestampUTC.toFormat('dd LLLL yyyy');

  const msUntilTimestamp = Math.abs(timestampUTC.diffNow().toMillis());

  // only show the time part if the timestamp is within the next day
  const showTimePart = msUntilTimestamp < DAY;

  const timePart = DateTime.fromSeconds(timestamp).toUTC().toFormat('HH:mm');

  return (
    <ConfirmInfoRow label={label} tooltip={tooltip}>
      <Box flexDirection={BoxFlexDirection.Column}>
        <Text variant={TextVariant.BodyMd}>{datePart}</Text>
        {showTimePart && (
          <Text
            color={TextColor.TextAlternative}
            variant={TextVariant.BodySm}
            textAlign={TextAlign.Right}
          >
            {timePart}
          </Text>
        )}
      </Box>
    </ConfirmInfoRow>
  );
};
