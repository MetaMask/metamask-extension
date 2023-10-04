import React from 'react';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderStyle,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { HeaderBase, TagUrl, Text } from '../../component-library';
import { getURLHost, isExtensionUrl } from '../../../helpers/utils/util';
import {
  getConnectedSubjectsForAllAddresses,
  getOriginOfCurrentTab,
  getSelectedAddress,
} from '../../../selectors';
// import { useI18nContext } from '../../../hooks/useI18nContext';

export const ConnectionsHeader = () => {
  // const t = useI18nContext();
  const selectedAddress = useSelector(getSelectedAddress);
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const currentTabURLHost = isExtensionUrl(currentTabOrigin)
    ? 'MetaMask'
    : getURLHost(currentTabOrigin);
  // TODO change from 'Metamask' to  default for extension
  const connectedSites = useSelector(getConnectedSubjectsForAllAddresses);
  const connectedSite = connectedSites[selectedAddress]?.find(
    ({ origin }) => origin === currentTabOrigin,
  );
  const connectedAvatar = connectedSite?.iconUrl;
  return (
    <HeaderBase
      style={{ 'box-shadow': '0px 2px 16px 0px rgba(0, 0, 0, 0.10)' }}
      // TODO take out inline style
      endAccessory={<Text as="a">All</Text>}
      // TODO use t('all') instead of 'All'
      childrenWrapperProps={{
        className: 'connections-header-children-wrapper',
        display: Display.Flex,
        alignItems: AlignItems.center,
        justifyContent: JustifyContent.center,
        padding: 4,
      }}
      endAccessoryWrapperProps={{
        className: 'connections-header-end-accessory-wrapper',
        display: Display.Flex,
        alignItems: AlignItems.center,
        justifyContent: JustifyContent.flexEnd,
        padding: 4,
      }}
      width={BlockSize.Full}
    >
      {/* TODO handle overflow for long sitenames */}
      <TagUrl
        className="connections-header-tag-url"
        label={currentTabURLHost}
        borderStyle={BorderStyle.none}
        labelProps={{ ellipsis: true }}
        avatarFaviconProps={{
          backgroundColor: BackgroundColor.backgroundDefault,
        }}
        src={connectedAvatar}
        showLockIcon
      />
    </HeaderBase>
  );
};
