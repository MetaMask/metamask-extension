import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Content, Header, Page } from '../../page';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  REVIEW_TOKEN_STREAMS_ROUTE,
} from '../../../../../helpers/constants/routes';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getGatorAssetListDetail } from '../../../../../selectors/gator-permissions/gator-permissions';
import { GatorAssetItemList } from '../components';
import { extractNetworkName } from '../gator-permissions-page-helper';

export const TokenStreamsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const networks = useSelector(getNetworkConfigurationsByChainId);
  const [totalTokenStreamsPermissions, setTotalTokenStreamsPermissions] =
    useState(0);
  const gatorAssetList = useSelector((state) =>
    getGatorAssetListDetail(state, 'token-streams'),
  );

  useEffect(() => {
    setTotalTokenStreamsPermissions(Object.keys(gatorAssetList).length);
  }, [gatorAssetList]);

  const handleTokenStreamsPermissionClick = (chainId) => {
    history.push(`${REVIEW_TOKEN_STREAMS_ROUTE}/${chainId}`);
  };

  const renderTokenStreamsPermissionsList = (gatorAssetItemList) =>
    Object.entries(gatorAssetItemList).map(([chainId, assetDetails]) => {
      return (
        <GatorAssetItemList
          data-testid="gator-asset-item-list"
          key={chainId}
          chainId={chainId}
          networkName={extractNetworkName(networks, chainId)}
          total={assetDetails.total}
          description={assetDetails.description}
          onClick={() => handleTokenStreamsPermissionClick(chainId)}
        />
      );
    });

  return (
    <Page className="main-container" data-testid="token-streams-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={Color.iconDefault}
            onClick={() => history.goBack()}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
        >
          {t('tokenStreams')}
        </Text>
      </Header>
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalTokenStreamsPermissions > 0 ? (
          renderTokenStreamsPermissionsList(gatorAssetList)
        ) : (
          <Box
            data-testid="no-connections"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            height={BlockSize.Full}
            gap={2}
            padding={4}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              backgroundColor={BackgroundColor.backgroundDefault}
              textAlign={TextAlign.Center}
            >
              {t('permissionsPageEmptyContent')}
            </Text>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              backgroundColor={BackgroundColor.backgroundDefault}
              textAlign={TextAlign.Center}
            >
              {t('permissionsPageEmptySubContent')}
            </Text>
          </Box>
        )}
      </Content>
    </Page>
  );
};
