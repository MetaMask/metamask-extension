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

export const ReviewTokenStreamsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const { chainId } = useParams();
  const [networkName, setNetworkName] = useState('');
  const [totalTokenStreams, setTotalTokenStreams] = useState(0);

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
    const network = networks[chainId];
    if (network?.name && network?.name !== '') {
      setNetworkName(`networkName${network.name.split(' ')[0]}`);
    } else {
      setNetworkName('unknownNetworkForGatorPermissions');
    }

    setTotalTokenStreams(nativeTokenStreams.length + erc20TokenStreams.length);
  }, [chainId, nativeTokenStreams, erc20TokenStreams, networks]);

  const handleNativeTokenStreamRevokeClick = (nativeTokenStream) => {
    // TODO: Implement revoke logic
    console.log('nativeTokenStream to revoke:', nativeTokenStream);
  };

  const handleErc20TokenStreamRevokeClick = (erc20TokenStream) => {
    console.log('erc20TokenStream to revoke:', erc20TokenStream);
  };

  const renderTokenStreams = (nativeStreams, erc20Streams) => {
    return (
      <>
        <Box>
          <Text>{JSON.stringify(nativeStreams)}</Text>
          <ButtonIcon
            iconName={IconName.Trash}
            onClick={() => handleNativeTokenStreamRevokeClick(nativeStreams)}
          />
        </Box>
        <Box>
          <Text>{JSON.stringify(erc20Streams)}</Text>
          <ButtonIcon
            iconName={IconName.Trash}
            onClick={() => handleErc20TokenStreamRevokeClick(erc20Streams)}
          />
        </Box>
      </>
    );
  };

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
          renderTokenStreams(nativeTokenStreams, erc20TokenStreams)
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
