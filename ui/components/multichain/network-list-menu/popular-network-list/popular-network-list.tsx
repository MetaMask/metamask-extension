import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  Text,
  AvatarNetwork,
  Button,
  AvatarNetworkSize,
  ButtonVariant,
  ButtonPrimary,
  ButtonPrimarySize,
} from '../../../component-library';
import { MetaMetricsNetworkEventSource } from '../../../../../shared/constants/metametrics';
import {
  ENVIRONMENT_TYPE_POPUP,
  ORIGIN_METAMASK,
} from '../../../../../shared/constants/app';
import {
  requestUserApproval,
  toggleNetworkMenu,
} from '../../../../store/actions';
import { ADD_NETWORK_ROUTE } from '../../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { RPCDefinition } from '../../../../../shared/constants/network';

const PopularNetworkList = ({
  searchAddNetworkResults,
}: {
  searchAddNetworkResults: RPCDefinition[];
}) => {
  const t = useI18nContext();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const dispatch = useDispatch();
  const history = useHistory();

  if (Object.keys(searchAddNetworkResults).length === 0) {
    return (
      <Box
        className="add-network__edge-case-box"
        borderRadius={BorderRadius.MD}
        padding={4}
        marginTop={4}
        marginRight={6}
        marginLeft={6}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        backgroundColor={BackgroundColor.backgroundAlternative}
      >
        <Box marginRight={4}>
          <img src="images/info-fox.svg" />
        </Box>
        <Box>
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            data-testid="all-networks-added"
          >
            {t('youHaveAddedAll', [
              <a
                key="link"
                className="add-network__edge-case-box__link"
                href="https://chainlist.wtf/"
                target="_blank"
                rel="noreferrer"
              >
                {t('here')}.
              </a>,
              <ButtonPrimary
                // backgroundColor={BackgroundColor.backgroundDefault}
                textAlign={TextAlign.Center}
                variant={TextVariant.bodyMd}
                size={ButtonPrimarySize.Md}
                width={BlockSize.Full}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  if (isPopUp) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment, spaced-comment
                    //@ts-ignore
                    platform.openExtensionInBrowser(ADD_NETWORK_ROUTE);
                  } else {
                    history.push(ADD_NETWORK_ROUTE);
                  }
                }}
              >
                {t('addMoreNetworks')}
              </ButtonPrimary>,
            ])}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="new-network-list__networks-container">
      <Box
        marginTop={isPopUp ? 0 : 4}
        marginBottom={1}
        paddingLeft={4}
        paddingRight={4}
      >
        <Box
          marginTop={4}
          marginBottom={8}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Text> {t('additionalNetworks')}</Text>
        </Box>
        {searchAddNetworkResults.map((item: RPCDefinition, index: number) => (
          <Box
            key={index}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            marginBottom={6}
            className="new-network-list__list-of-networks"
          >
            <Box display={Display.Flex} alignItems={AlignItems.center}>
              <AvatarNetwork
                size={AvatarNetworkSize.Md}
                src={item.rpcPrefs?.imageUrl}
                name={item.nickname}
              />
              <Box marginLeft={2}>
                <Text
                  color={TextColor.textDefault}
                  backgroundColor={BackgroundColor.transparent}
                  ellipsis
                >
                  {item.nickname}
                </Text>
              </Box>
            </Box>
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              marginLeft={1}
            >
              <Button
                type={ButtonVariant.Link}
                className="add-network__add-button"
                variant={ButtonVariant.Link}
                data-testid="test-add-button"
                onClick={async () => {
                  dispatch(toggleNetworkMenu());
                  await dispatch(
                    requestUserApproval({
                      origin: ORIGIN_METAMASK,
                      type: ApprovalType.AddEthereumChain,
                      requestData: {
                        chainId: item.chainId,
                        rpcUrl: item.rpcUrl,
                        ticker: item.ticker,
                        rpcPrefs: item.rpcPrefs,
                        imageUrl: item.rpcPrefs?.imageUrl,
                        chainName: item.nickname,
                        referrer: ORIGIN_METAMASK,
                        source: MetaMetricsNetworkEventSource.NewAddNetworkFlow,
                      },
                    }),
                  );
                }}
              >
                {t('add')}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
      <Box padding={isPopUp ? [2, 0, 2, 6] : [2, 0, 2, 0]}></Box>
    </Box>
  );
};

export default PopularNetworkList;
