import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
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
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getAggregatedGatorPermissionByChainId } from '../../../../../selectors/gator-permissions/gator-permissions';
import { extractNetworkName } from '../gator-permissions-page-helper';
import { ReviewGatorAssetItem } from '../components';
import type { Hex } from '@metamask/utils';
import type { GatorPermissionState } from '../../../../../selectors/gator-permissions/gator-permissions';

interface RouteParams {
  chainId: string;
  [key: string]: string | undefined;
}

interface PermissionWithSiteOrigin {
  permissionResponse: {
    chainId: Hex;
    context: string;
    permission: {
      type: string;
    };
  };
  siteOrigin: string;
}

export const ReviewTokenTransferPage = (): React.ReactElement => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef<HTMLDivElement>(null);
  const { chainId } = useParams<RouteParams>();
  const [networkName, setNetworkName] = useState<string>('');
  const [totalTokenTransferPermissions, setTotalTokenTransferPermissions] =
    useState<number>(0);

  const networks = useSelector(getNetworkConfigurationsByChainId);

  // Get aggregated token transfer permissions for the specific chain
  const aggregatedTokenTransferPermissions = useSelector((state: GatorPermissionState) =>
    getAggregatedGatorPermissionByChainId(state, 'token-transfer', chainId as Hex),
  );

  useEffect(() => {
    if (chainId) {
      setNetworkName(extractNetworkName(networks, chainId));
      setTotalTokenTransferPermissions(aggregatedTokenTransferPermissions.length);
    }
  }, [chainId, aggregatedTokenTransferPermissions, networks]);

  const handlePermissionRevokeClick = (permission: PermissionWithSiteOrigin): void => {
    // TODO: Implement revoke logic
    console.log('Permission to revoke:', permission);
  };

  const renderTokenTransferPermissions = (): React.ReactElement[] =>
    aggregatedTokenTransferPermissions.map((permission) => {
      const { permissionResponse, siteOrigin } = permission as PermissionWithSiteOrigin;
      const fullNetworkName = extractNetworkName(
        networks,
        permissionResponse.chainId,
        true,
      );

      return (
        <ReviewGatorAssetItem
          key={`${siteOrigin}-${permissionResponse.context}`}
          chainId={permissionResponse.chainId}
          networkName={fullNetworkName}
          permissionType={permissionResponse.permission.type}
          siteOrigin={siteOrigin}
          onRevokeClick={() => handlePermissionRevokeClick(permission as PermissionWithSiteOrigin)}
        />
      );
    });

  return (
    <Page className="main-container" data-testid="review-token-transfer-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.iconDefault}
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
          {t(networkName)}
        </Text>
      </Header>
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalTokenTransferPermissions > 0 ? (
          renderTokenTransferPermissions()
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
