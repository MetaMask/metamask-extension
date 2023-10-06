import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderStyle,
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  HeaderBase,
  IconName,
  TagUrl,
} from '../../component-library';
import { getURLHost, isExtensionUrl } from '../../../helpers/utils/util';
import {
  getConnectedSubjectsForAllAddresses,
  getOriginOfCurrentTab,
  getSelectedAddress,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

export const ConnectionsHeader = ({ hostName }) => {
  const selectedAddress = useSelector(getSelectedAddress);
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const t = useI18nContext();
  const history = useHistory();
  const currentTabURLHost =
    hostName ??
    (isExtensionUrl(currentTabOrigin)
      ? t('currentExtension')
      : getURLHost(currentTabOrigin));
  const connectedSites = useSelector(getConnectedSubjectsForAllAddresses);
  const connectedSite = connectedSites[selectedAddress]?.find(
    ({ origin }) => origin === currentTabOrigin,
  );
  const connectedAvatar = connectedSite?.iconUrl;
  return (
    <HeaderBase
      className="connections-header"
      width={BlockSize.Full}
      startAccessory={
        <ButtonIcon
          ariaLabel="Back"
          iconName={IconName.ArrowLeft}
          className="connections-header__start-accessory"
          color={Color.iconDefault}
          onClick={() => history.push(DEFAULT_ROUTE)}
          size={ButtonIconSize.Sm}
        />
      }
      startAccessoryWrapperProps={{
        className: 'connections-header__start-accessory-wrapper',
        display: Display.Flex,
        alignItems: AlignItems.center,
        justifyContent: JustifyContent.center,
        padding: 4,
      }}
      endAccessory={
        <ButtonLink color={TextColor.primaryDefault} onClick>
          {t('allButtonLink')}
        </ButtonLink>
      }
      endAccessoryWrapperProps={{
        className: 'connections-header-end-accessory-wrapper',
        display: Display.Flex,
        alignItems: AlignItems.center,
        justifyContent: JustifyContent.flexEnd,
        padding: 4,
      }}
      childrenWrapperProps={{
        className: 'connections-header__child-accessory-wrapper',
        display: Display.Flex,
        justifyContent: JustifyContent.center,
        paddingTop: 4,
        paddingBottom: 4,
        flexDirection: FlexDirection.Row,
      }}
    >
      <TagUrl
        className="connections-header-tag-url"
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        width={BlockSize.Full}
        label={currentTabURLHost}
        borderStyle={BorderStyle.none}
        labelProps={{
          className: 'connections-header__title',
        }}
        avatarFaviconProps={{
          backgroundColor: BackgroundColor.transparent,
        }}
        src={connectedAvatar}
        backgroundColor={BackgroundColor.transparent}
        showLockIcon
      />
    </HeaderBase>
  );
};

ConnectionsHeader.propTypes = {
  hostName: PropTypes.string,
};
