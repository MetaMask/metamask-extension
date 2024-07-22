import React, { useState } from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { useDispatch } from 'react-redux';
import { AddNetworkFields } from '@metamask/network-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  Text,
  AvatarNetwork,
  Button,
  AvatarNetworkSize,
  ButtonVariant,
  IconName,
  Icon,
  IconSize,
  ButtonLinkSize,
  ButtonLink,
  Popover,
  PopoverPosition,
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
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import {
  AlignItems,
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
  IconColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  RPCDefinition,
} from '../../../../../shared/constants/network';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

const PopularNetworkList = ({
  searchAddNetworkResults,
}: {
  searchAddNetworkResults: AddNetworkFields[];
}) => {
  const t = useI18nContext();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const [referenceElement, setReferenceElement] = useState();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setBoxRef = (ref: any) => {
    setReferenceElement(ref);
  };

  return (
    <Box className="new-network-list__networks-container">
      <Box
        marginTop={isPopUp ? 0 : 4}
        marginBottom={1}
        paddingLeft={4}
        paddingRight={4}
        ref={setBoxRef}
      >
        {Object.keys(searchAddNetworkResults).length === 0 ? null : (
          <Box
            marginTop={4}
            marginBottom={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text
              display={Display.InlineFlex}
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
            >
              {t('additionalNetworks')}
              <Box onMouseEnter={handleMouseEnter} style={{ marginTop: 2 }}>
                <Icon
                  className="add-network__warning-icon"
                  name={IconName.Info}
                  color={IconColor.iconMuted}
                  size={IconSize.Sm}
                  marginLeft={2}
                />
                <Popover
                  referenceElement={referenceElement}
                  position={PopoverPosition.Top}
                  isOpen={isOpen}
                  matchWidth
                  flip
                  hasArrow
                  backgroundColor={BackgroundColor.backgroundAlternative}
                  onMouseLeave={handleMouseLeave}
                >
                  {t('popularNetworkAddToolTip', [
                    <Box>
                      <ButtonLink
                        key="security-provider-button-supporturl"
                        size={ButtonLinkSize.Inherit}
                        externalLink
                        onClick={() => {
                          global.platform.openTab({
                            url: ZENDESK_URLS.UNKNOWN_NETWORK,
                          });
                        }}
                      >
                        {t('learnMoreUpperCase')}
                      </ButtonLink>
                    </Box>,
                  ])}
                </Popover>
              </Box>
            </Text>
          </Box>
        )}
        {searchAddNetworkResults.map((network, index) => (
          <Box
            key={index}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            paddingBottom={4}
            paddingTop={4}
            className="new-network-list__list-of-networks"
            onMouseEnter={handleMouseLeave}
          >
            <Box display={Display.Flex} alignItems={AlignItems.center}>
              <AvatarNetwork
                size={AvatarNetworkSize.Sm}
                src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
                name={network.name}
              />
              <Box marginLeft={4}>
                <Text
                  color={TextColor.textDefault}
                  backgroundColor={BackgroundColor.transparent}
                  ellipsis
                >
                  {network.name}
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
                        chainId: network.chainId,
                        rpcUrl:
                          network.rpcEndpoints[network.defaultRpcEndpointIndex]
                            .url,
                        ticker: network.nativeCurrency,
                        rpcPrefs: {
                          blockExplorerUrl:
                            network.defaultBlockExplorerUrlIndex !== undefined
                              ? network.blockExplorerUrls[
                                  network.defaultBlockExplorerUrlIndex
                                ]
                              : undefined,
                        },
                        imageUrl:
                          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId],
                        chainName: network.name,
                        referrer: ORIGIN_METAMASK,
                        source: MetaMetricsNetworkEventSource.NewAddNetworkFlow,
                      },
                    }),
                  );

                  // dispatch(toggleNetworkMenu());
                  // todo
                  // await dispatch(
                  //   requestUserApproval({
                  //     origin: ORIGIN_METAMASK,
                  //     type: ApprovalType.AddEthereumChain,
                  //     requestData: {
                  //       chainId: item.chainId,
                  //       rpcUrl: item.rpcUrl,
                  //       ticker: item.ticker,
                  //       rpcPrefs: item.rpcPrefs,
                  //       imageUrl: item.rpcPrefs?.imageUrl,
                  //       chainName: item.nickname,
                  //       referrer: ORIGIN_METAMASK,
                  //       source: MetaMetricsNetworkEventSource.NewAddNetworkFlow,
                  //     },
                  //   }),
                  // );
                }}
              >
                {t('add')}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PopularNetworkList;
