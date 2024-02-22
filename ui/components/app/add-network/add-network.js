import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ApprovalType } from '@metamask/controller-utils';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
  JustifyContent,
  BorderRadius,
  BackgroundColor,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import Button from '../../ui/button';
import Tooltip from '../../ui/tooltip';
import {
  getNetworkConfigurations,
  getUnapprovedConfirmations,
} from '../../../selectors';

import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ORIGIN_METAMASK,
} from '../../../../shared/constants/app';
import { requestUserApproval } from '../../../store/actions';
import Popover from '../../ui/popover';
import ConfirmationPage from '../../../pages/confirmations/confirmation/confirmation';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import { ADD_NETWORK_ROUTE } from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import {
  Icon,
  IconName,
  IconSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Text,
} from '../../component-library';
import { MetaMetricsNetworkEventSource } from '../../../../shared/constants/metametrics';

const AddNetwork = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const networkConfigurations = useSelector(getNetworkConfigurations);

  const networkConfigurationChainIds = Object.values(networkConfigurations).map(
    (net) => net.chainId,
  );

  const infuraRegex = /infura.io/u;

  const nets = FEATURED_RPCS.sort((a, b) =>
    a.nickname > b.nickname ? 1 : -1,
  ).slice(0, FEATURED_RPCS.length);

  const notExistingNetworkConfigurations = nets.filter(
    (net) => networkConfigurationChainIds.indexOf(net.chainId) === -1,
  );
  const unapprovedConfirmations = useSelector(getUnapprovedConfirmations);
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    const anAddNetworkConfirmationFromMetaMaskExists =
      unapprovedConfirmations?.find((confirmation) => {
        return (
          confirmation.origin === 'metamask' &&
          confirmation.type === ApprovalType.AddEthereumChain
        );
      });
    if (!showPopover && anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(true);
    }

    if (showPopover && !anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(false);
    }
  }, [unapprovedConfirmations, showPopover]);

  return (
    <>
      {Object.keys(notExistingNetworkConfigurations).length === 0 ? (
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
            <Text variant={TextVariant.bodySm} as="h6">
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
                <Button
                  key="button"
                  type="inline"
                  onClick={(event) => {
                    event.preventDefault();
                    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                      ? global.platform.openExtensionInBrowser(
                          ADD_NETWORK_ROUTE,
                        )
                      : history.push(ADD_NETWORK_ROUTE);
                  }}
                >
                  <Text
                    variant={TextVariant.bodySm}
                    as="h6"
                    color={TextColor.infoDefault}
                  >
                    {t('addMoreNetworks')}.
                  </Text>
                </Button>,
              ])}
            </Text>
          </Box>
        </Box>
      ) : (
        <Box className="add-network__networks-container">
          {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN && (
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              flexDirection={FlexDirection.Row}
              marginTop={7}
              marginBottom={4}
              paddingBottom={2}
              className="add-network__header"
            >
              <Text
                variant={TextVariant.headingSm}
                color={TextColor.textMuted}
                as="h4"
              >
                {t('networks')}
              </Text>
              <span className="add-network__header__subtitle">{'  >  '}</span>
              <Text
                variant={TextVariant.headingSm}
                as="h4"
                color={TextColor.textDefault}
              >
                {t('addANetwork')}
              </Text>
            </Box>
          )}
          <Box
            marginTop={getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? 0 : 4}
            marginBottom={1}
            className="add-network__main-container"
          >
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              color={TextColor.textAlternative}
              margin={0}
              marginTop={4}
            >
              {t('addFromAListOfPopularNetworks')}
            </Text>
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              color={TextColor.textMuted}
              marginTop={4}
              marginBottom={3}
            >
              {t('popularCustomNetworks')}
            </Text>
            {notExistingNetworkConfigurations.map((item, index) => (
              <Box
                key={index}
                display={Display.Flex}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.spaceBetween}
                marginBottom={6}
                className="add-network__list-of-networks"
              >
                <Box display={Display.Flex} alignItems={AlignItems.center}>
                  <AvatarNetwork
                    size={AvatarNetworkSize.Sm}
                    src={item.rpcPrefs?.imageUrl}
                    name={item.nickname}
                  />
                  <Box marginLeft={2}>
                    <Text
                      variant={TextVariant.bodySmBold}
                      as="h6"
                      color={TextColor.textDefault}
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
                  {
                    // Warning for the networks that doesn't use infura.io as the RPC
                    !infuraRegex.test(item.rpcUrl) && (
                      <Tooltip
                        position="top"
                        interactive
                        html={
                          <Box
                            margin={3}
                            className="add-network__warning-tooltip"
                          >
                            {t('addNetworkTooltipWarning', [
                              <a
                                key="zendesk_page_link"
                                href={ZENDESK_URLS.UNKNOWN_NETWORK}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {t('learnMoreUpperCase')}
                              </a>,
                            ])}
                          </Box>
                        }
                        trigger="mouseenter"
                      >
                        <Icon
                          className="add-network__warning-icon"
                          name={IconName.Danger}
                          color={IconColor.iconMuted}
                          size={IconSize.Sm}
                        />
                      </Tooltip>
                    )
                  }
                  <Button
                    type="inline"
                    className="add-network__add-button"
                    onClick={async () => {
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
                            source:
                              MetaMetricsNetworkEventSource.PopularNetworkList,
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
          <Box
            padding={
              getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                ? [2, 0, 2, 6]
                : [2, 0, 2, 0]
            }
            className="add-network__footer"
          >
            <Button
              type="link"
              data-testid="add-network-manually"
              onClick={(event) => {
                event.preventDefault();
                getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                  ? global.platform.openExtensionInBrowser(ADD_NETWORK_ROUTE)
                  : history.push(ADD_NETWORK_ROUTE);
              }}
            >
              <Text
                variant={TextVariant.bodySm}
                as="h6"
                color={TextColor.primaryDefault}
              >
                {t('addANetworkManually')}
              </Text>
            </Button>
          </Box>
        </Box>
      )}
      {showPopover && (
        <Popover>
          <ConfirmationPage redirectToHomeOnZeroConfirmations={false} />
        </Popover>
      )}
    </>
  );
};

export default AddNetwork;
