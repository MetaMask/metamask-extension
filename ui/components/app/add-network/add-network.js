import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box';
import Typography from '../../ui/typography';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  SIZES,
} from '../../../helpers/constants/design-system';
import Button from '../../ui/button';
import Tooltip from '../../ui/tooltip';
import IconWithFallback from '../../ui/icon-with-fallback';
import IconBorder from '../../ui/icon-border';
import {
  getFrequentRpcListDetail,
  getUnapprovedConfirmations,
} from '../../../selectors';

import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  MESSAGE_TYPE,
} from '../../../../shared/constants/app';
import { requestUserApproval } from '../../../store/actions';
import Popover from '../../ui/popover';
import ConfirmationPage from '../../../pages/confirmation/confirmation';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import { ADD_NETWORK_ROUTE } from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';

const AddNetwork = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const frequentRpcList = useSelector(getFrequentRpcListDetail);

  const frequentRpcListChainIds = Object.values(frequentRpcList).map(
    (net) => net.chainId,
  );

  const infuraRegex = /infura.io/u;

  const nets = FEATURED_RPCS.sort((a, b) =>
    a.ticker > b.ticker ? 1 : -1,
  ).slice(0, FEATURED_RPCS.length);

  const notFrequentRpcNetworks = nets.filter(
    (net) => frequentRpcListChainIds.indexOf(net.chainId) === -1,
  );
  const unapprovedConfirmations = useSelector(getUnapprovedConfirmations);
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    const anAddNetworkConfirmationFromMetaMaskExists = unapprovedConfirmations?.find(
      (confirmation) => {
        return (
          confirmation.origin === 'metamask' &&
          confirmation.type === MESSAGE_TYPE.ADD_ETHEREUM_CHAIN
        );
      },
    );
    if (!showPopover && anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(true);
    }

    if (showPopover && !anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(false);
    }
  }, [unapprovedConfirmations, showPopover]);

  return (
    <>
      {Object.keys(notFrequentRpcNetworks).length === 0 ? (
        <Box
          className="add-network__edge-case-box"
          borderRadius={SIZES.MD}
          padding={4}
          margin={[4, 6, 0, 6]}
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.ROW}
          backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
        >
          <Box marginRight={4}>
            <img src="images/info-fox.svg" />
          </Box>
          <Box>
            <Typography variant={TYPOGRAPHY.H7}>
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
                  <Typography
                    variant={TYPOGRAPHY.H7}
                    color={COLORS.INFO_DEFAULT}
                  >
                    {t('addMoreNetworks')}.
                  </Typography>
                </Button>,
              ])}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box className="add-network__networks-container">
          {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN && (
            <Box
              display={DISPLAY.FLEX}
              alignItems={ALIGN_ITEMS.CENTER}
              flexDirection={FLEX_DIRECTION.ROW}
              marginTop={7}
              marginBottom={4}
              paddingBottom={2}
              className="add-network__header"
            >
              <Typography variant={TYPOGRAPHY.H4} color={COLORS.TEXT_MUTED}>
                {t('networks')}
              </Typography>
              <span className="add-network__header__subtitle">{'  >  '}</span>
              <Typography variant={TYPOGRAPHY.H4} color={COLORS.TEXT_DEFAULT}>
                {t('addANetwork')}
              </Typography>
            </Box>
          )}
          <Box
            margin={
              getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                ? [0, 0, 1, 0]
                : [4, 0, 1, 0]
            }
            className="add-network__main-container"
          >
            <Typography
              variant={TYPOGRAPHY.H6}
              color={COLORS.TEXT_ALTERNATIVE}
              margin={[4, 0, 0, 0]}
            >
              {t('addFromAListOfPopularNetworks')}
            </Typography>
            <Typography
              variant={TYPOGRAPHY.H7}
              color={COLORS.TEXT_MUTED}
              margin={[4, 0, 3, 0]}
            >
              {t('popularCustomNetworks')}
            </Typography>
            {notFrequentRpcNetworks.map((item, index) => (
              <Box
                key={index}
                display={DISPLAY.FLEX}
                alignItems={ALIGN_ITEMS.CENTER}
                justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
                marginBottom={6}
                className="add-network__list-of-networks"
              >
                <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
                  <Box>
                    <IconBorder size={24}>
                      <IconWithFallback
                        icon={item.rpcPrefs.imageUrl}
                        name={item.nickname}
                        size={24}
                      />
                    </IconBorder>
                  </Box>
                  <Box marginLeft={2}>
                    <Typography
                      variant={TYPOGRAPHY.H7}
                      color={COLORS.TEXT_DEFAULT}
                      fontWeight={FONT_WEIGHT.BOLD}
                    >
                      {item.nickname}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  display={DISPLAY.FLEX}
                  alignItems={ALIGN_ITEMS.CENTER}
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
                                href="https://metamask.zendesk.com/hc/en-us/articles/4417500466971"
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
                        <i
                          className="fa fa-exclamation-triangle add-network__warning-icon"
                          title={t('warning')}
                        />
                      </Tooltip>
                    )
                  }
                  <Button
                    type="inline"
                    className="add-network__add-button"
                    onClick={async () => {
                      await dispatch(requestUserApproval(item, true));
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
              onClick={(event) => {
                event.preventDefault();
                getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                  ? global.platform.openExtensionInBrowser(ADD_NETWORK_ROUTE)
                  : history.push(ADD_NETWORK_ROUTE);
              }}
            >
              <Typography
                variant={TYPOGRAPHY.H6}
                color={COLORS.PRIMARY_DEFAULT}
              >
                {t('addANetworkManually')}
              </Typography>
            </Button>
          </Box>
        </Box>
      )}
      {showPopover && (
        <Popover>
          <ConfirmationPage />
        </Popover>
      )}
    </>
  );
};

export default AddNetwork;
