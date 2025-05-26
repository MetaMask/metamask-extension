import React from 'react';
import { useHistory } from 'react-router-dom';

import {
  BackgroundColor,
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Card from '../../../../components/ui/card';
import { Text } from '../../../../components/component-library';
import { REMOTE_ROUTE } from '../../../../helpers/constants/routes';
import { DailyAllowance } from '../../../../../shared/lib/remote-mode';

type SendAllowanceBannerProps = {
  allowance: DailyAllowance;
};

export default function SendAllowanceBanner({
  allowance,
}: SendAllowanceBannerProps) {
  const history = useHistory();

  return (
    <Card backgroundColor={BackgroundColor.backgroundMuted} marginBottom={3}>
      <Text color={TextColor.textDefault} variant={TextVariant.bodyMd}>
        Send {`${allowance.amount} ${allowance.symbol}`} without connecting
        hardware wallet.
        <Text
          display={Display.InlineBlock}
          color={TextColor.infoDefault}
          variant={TextVariant.bodyMd}
          onClick={() => history.push(REMOTE_ROUTE)}
          style={{ cursor: 'pointer', paddingLeft: 2 }}
        >
          View permissions
        </Text>
      </Text>
    </Card>
  );
}
