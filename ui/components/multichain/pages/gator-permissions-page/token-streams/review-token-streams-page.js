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
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { TOKEN_STREAMS_ROUTE } from '../../../../../helpers/constants/routes';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getGatorPermissionByPermissionTypeAndChainId } from '../../../../../selectors/gator-permissions/gator-permissions';
import { extractNetworkName } from '../gator-permissions-page-helper';
import { ReviewGatorAssetItem } from '../components';
import { useRevokeGatorPermissions } from '../../../../../hooks/gator-permissions/useRevokeGatorPermissions';
import { getSelectedInternalAccount } from '../../../../../selectors';

export const ReviewTokenStreamsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const { chainId } = useParams();
  const [networkName, setNetworkName] = useState('');
  const [totalTokenStreams, setTotalTokenStreams] = useState(0);

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { revokeGatorPermission } = useRevokeGatorPermissions({
    accountAddress: selectedAccount.address,
    chainId,
  });

  const networks = useSelector(getNetworkConfigurationsByChainId);
  const nativeTokenStreams = useSelector((state) =>
    getGatorPermissionByPermissionTypeAndChainId(
      state,
      'native-token-stream',
      chainId,
    ),
  );
  const erc20TokenStreams = useSelector((state) =>
    getGatorPermissionByPermissionTypeAndChainId(
      state,
      'erc20-token-stream',
      chainId,
    ),
  );

  useEffect(() => {
    setNetworkName(extractNetworkName(networks, chainId));
    setTotalTokenStreams(nativeTokenStreams.length + erc20TokenStreams.length);
  }, [chainId, nativeTokenStreams, erc20TokenStreams, networks]);

  const handleRevokeClick = async (permissionContext, delegationManager) => {
    await revokeGatorPermission(permissionContext, delegationManager);
  };

  const renderTokenStreams = (streams) =>
    streams.map((stream) => {
      const { permissionResponse, siteOrigin } = stream;
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
          onRevokeClick={() =>
            handleRevokeClick(
              permissionResponse.context,
              permissionResponse.signerMeta.delegationManager,
            )
          }
        />
      );
    });

  return (
    <Page className="main-container" data-testid="review-token-streams-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={Color.iconDefault}
            onClick={() => history.push(TOKEN_STREAMS_ROUTE)}
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
        {totalTokenStreams > 0 ? (
          <>
            {renderTokenStreams(nativeTokenStreams)}
            {renderTokenStreams(erc20TokenStreams)}
          </>
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
