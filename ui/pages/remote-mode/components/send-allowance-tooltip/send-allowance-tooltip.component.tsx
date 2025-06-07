import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsRemoteModeEnabled } from '../../../../selectors/remote-mode';

type SendAllowanceBannerProps = {
  hasAllowance: boolean;
};

export default function SendAllowanceTooltip({
  hasAllowance,
}: SendAllowanceBannerProps) {
  const history = useHistory();
  const t = useI18nContext();
  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);

  if (!isRemoteModeEnabled) {
    return null;
  }

  return (
    <Tooltip
      interactive
      html={
        <Box>
          <Text color={TextColor.textDefault} variant={TextVariant.bodyMd}>
            {t('sendAllowanceTooltipDescription')}
            <Text
              display={Display.Inline}
              color={TextColor.infoDefault}
              variant={TextVariant.bodyMd}
              onClick={() => history.push(REMOTE_ROUTE)}
              style={{ cursor: 'pointer' }}
            >
              {hasAllowance ? t('viewPermissions') : t('enable')}
            </Text>
          </Text>
        </Box>
      }
    >
      <Icon size={IconSize.Md} name={IconName.RemoteMode} />
    </Tooltip>
  );
}
