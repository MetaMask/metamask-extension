import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  Icon,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextVariant,
  Box,
} from '@metamask/design-system-react';
import {
  BackgroundColor,
  TextVariant as LegacyTextVariant,
} from '../../../helpers/constants/design-system';
import { Header } from '../pages/page';
import { getURLHost } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';

export const PermissionsHeader = ({
  securedOrigin,
  connectedSubjectsMetadata,
}: {
  securedOrigin: string;
  connectedSubjectsMetadata?: { name: string; iconUrl: string };
}) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  return (
    <Header
      textProps={{
        variant: LegacyTextVariant.headingSm,
      }}
      backgroundColor={BackgroundColor.backgroundDefault}
      startAccessory={
        <ButtonIcon
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          iconProps={{ className: IconColor.IconDefault }}
          onClick={() => navigate(PREVIOUS_ROUTE)}
          data-testid="back-button"
        />
      }
    >
      <Box className="flex items-center justify-center gap-2">
        {connectedSubjectsMetadata?.iconUrl ? (
          <AvatarFavicon
            name={connectedSubjectsMetadata.name}
            size={AvatarFaviconSize.Sm}
            src={connectedSubjectsMetadata.iconUrl}
          />
        ) : (
          <Icon
            name={IconName.Global}
            size={IconSize.Sm}
            color={IconColor.IconDefault}
          />
        )}
        <Text
          variant={TextVariant.HeadingSm}
          textAlign={TextAlign.Center}
          ellipsis
        >
          {getURLHost(securedOrigin)}
        </Text>
      </Box>
    </Header>
  );
};
