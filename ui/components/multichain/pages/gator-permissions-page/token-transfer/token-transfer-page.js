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
import { REVIEW_TOKEN_TRANSFER_ROUTE } from '../../../../../helpers/constants/routes';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getAggregatedTokenTransferPermissionsByChainId } from '../../../../../selectors/gator-permissions/gator-permissions';
import { GatorAssetItemList } from '../components';
import { extractNetworkName } from '../gator-permissions-page-helper';

export const TokenTransferPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const networks = useSelector(getNetworkConfigurationsByChainId);
  const [totalTokenTransferPermissions, setTotalTokenTransferPermissions] =
    useState(0);

  // Get aggregated token transfer permissions for all chains
  const aggregatedTokenTransferPermissions = useSelector((state) =>
    getAggregatedTokenTransferPermissionsByChainId(state),
  );

  useEffect(() => {
    // Calculate total permissions across all chains
    let total = 0;
    Object.values(aggregatedTokenTransferPermissions).forEach((permissions) => {
      total += permissions.length;
    });

    setTotalTokenTransferPermissions(total);
  }, [aggregatedTokenTransferPermissions]);

  const handleTokenTransferPermissionClick = (chainId) => {
    history.push(`${REVIEW_TOKEN_TRANSFER_ROUTE}/${chainId}`);
  };

  const renderTokenTransferPermissionsList = () => {
    return Object.entries(aggregatedTokenTransferPermissions).map(
      ([chainId, permissions]) => {
        const total = permissions.length;

        // Create a combined description with proper translation and count parameter
        const description = total === 1
          ? t('tokenPermissionCount', [total])
          : t('tokenPermissionsCount', [total]);

        let networkName = t(extractNetworkName(networks, chainId));
        if (!networkName) {
          networkName = extractNetworkName(networks, chainId, true);
        }

        return (
          <GatorAssetItemList
            data-testid="gator-asset-item-list"
            key={chainId}
            chainId={chainId}
            networkName={networkName}
            description={description}
            onClick={() => handleTokenTransferPermissionClick(chainId)}
          />
        );
      },
    );
  };

  return (
    <Page className="main-container" data-testid="token-transfer-page">
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
          {t('tokenTransfer')}
        </Text>
      </Header>
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalTokenTransferPermissions > 0 ? (
          renderTokenTransferPermissionsList()
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
