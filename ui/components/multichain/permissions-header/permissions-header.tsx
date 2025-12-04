import React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  AlignItems,
  BackgroundColor,
  Display,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarFavicon,
  AvatarFaviconSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
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
        variant: TextVariant.headingSm,
      }}
      backgroundColor={BackgroundColor.backgroundDefault}
      startAccessory={
        <ButtonIcon
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          className="connections-header__start-accessory"
          color={IconColor.iconDefault}
          onClick={() => navigate(PREVIOUS_ROUTE)}
          data-testid="back-button"
        />
      }
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        gap={2}
        justifyContent={JustifyContent.center}
        className="connections-header__title"
      >
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
            color={IconColor.iconDefault}
          />
        )}
        <Text
          as="span"
          variant={TextVariant.headingSm}
          textAlign={TextAlign.Center}
          ellipsis
        >
          {getURLHost(securedOrigin)}
        </Text>
      </Box>
    </Header>
  );
};
