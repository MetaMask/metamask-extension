import React from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { useDispatch } from 'react-redux';
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
} from '../../../../helpers/constants/design-system';
import { RPCDefinition } from '../../../../../shared/constants/network';
import Tooltip from '../../../ui/tooltip';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

const PopularNetworkList = ({
  searchAddNetworkResults,
}: {
  searchAddNetworkResults: RPCDefinition[];
}) => {
  const t = useI18nContext();
  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const dispatch = useDispatch();

  return (
    <Box className="new-network-list__networks-container">
      <Box
        marginTop={isPopUp ? 0 : 4}
        marginBottom={1}
        paddingLeft={4}
        paddingRight={4}
      >
        {Object.keys(searchAddNetworkResults).length === 0 ? null : (
          <Box
            marginTop={4}
            marginBottom={8}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text display={Display.InlineFlex} as="div">
              {t('additionalNetworks')}
              <Tooltip
                position="top"
                interactive
                html={
                  <Box margin={3} className="add-network__warning-tooltip">
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
                        ,
                      </Box>,
                    ])}
                  </Box>
                }
                trigger="mouseenter"
              >
                <Box paddingTop={1}>
                  <Icon
                    className="add-network__warning-icon"
                    name={IconName.Info}
                    color={IconColor.iconMuted}
                    size={IconSize.Sm}
                    marginLeft={2}
                  />
                </Box>
              </Tooltip>
            </Text>
          </Box>
        )}

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
    </Box>
  );
};

export default PopularNetworkList;
