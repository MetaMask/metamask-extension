import React from 'react';
import { useHistory } from 'react-router-dom';

import { DailyAllowance } from '../../../../../shared/lib/remote-mode';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import Tooltip from '../../../../components/ui/tooltip';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { REMOTE_ROUTE } from '../../../../helpers/constants/routes';

type SendAllowanceBannerProps = {
  allowance: DailyAllowance | null;
};

export default function SendAllowanceTooltip({
  allowance,
}: SendAllowanceBannerProps) {
  const history = useHistory();

  return (
    <Tooltip
      interactive
      html={
        <Box>
          <Text color={TextColor.textDefault} variant={TextVariant.bodyMd}>
            Send authorized tokens without plugging in your hardware wallet.
            <Text
              display={Display.Inline}
              color={TextColor.infoDefault}
              variant={TextVariant.bodyMd}
              onClick={() => history.push(REMOTE_ROUTE)}
              style={{ cursor: 'pointer' }}
            >
              {allowance ? 'View permissions' : 'Enable'}
            </Text>
          </Text>
        </Box>
      }
    >
      <Icon size={IconSize.Md} name={IconName.RemoteMode} />
    </Tooltip>
  );
}
