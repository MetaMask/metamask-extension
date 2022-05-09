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
import IconCaretLeft from '../../ui/icon/icon-caret-left';
import Tooltip from '../../ui/tooltip';
import IconWithFallback from '../../ui/icon-with-fallback';
import IconBorder from '../../ui/icon-border';
import {
  getTheme,
  getFrequentRpcListDetail,
  getUnapprovedConfirmations,
} from '../../../selectors';
import { THEME_TYPE } from '../../../pages/settings/experimental-tab/experimental-tab.constant';

import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  MESSAGE_TYPE,
} from '../../../../shared/constants/app';
import { requestUserApproval } from '../../../store/actions';
import Popover from '../../ui/popover';
import ConfirmationPage from '../../../pages/confirmation/confirmation';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import {
  ADD_NETWORK_ROUTE,
  NETWORKS_ROUTE,
} from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';

const AddNetwork = () => {
  const t = useContext(I18nContext);
  const theme = useSelector(getTheme);
  const dispatch = useDispatch();
  const history = useHistory();
  const frequentRpcList = useSelector(getFrequentRpcListDetail);

  const frequentRpcListChainIds = frequentRpcList.map((net) => net.chainId);

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
    const anAddNetworkConfirmationFromMetaMaskExists = unapprovedConfirmations.find(
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
                  key="link"
                  type="link"
                  className="add-network__edge-case-box__button"
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
                    className="add-network__edge-case-box__button"
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
        <Box>
          {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN && (
            <Box
              display={DISPLAY.FLEX}
              alignItems={ALIGN_ITEMS.CENTER}
              flexDirection={FLEX_DIRECTION.ROW}
              margin={[7, 0, 4, -2]}
              paddingBottom={2}
              className="add-network__header"
            >
              <IconCaretLeft
                aria-label={t('back')}
                onClick={() => history.push(NETWORKS_ROUTE)}
                className="add-network__header__back-icon"
              />
              <Typography variant={TYPOGRAPHY.H3} color={COLORS.TEXT_DEFAULT}>
                {t('addNetwork')}
              </Typography>
            </Box>
          )}
          <Box
            margin={
              getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                ? [0, 6, 1, 6]
                : [4, 0, 1, 0]
            }
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
                  <IconBorder size={24}>
                    <IconWithFallback
                      icon={item.rpcPrefs.imageUrl}
                      name={item.nickname}
                      size={24}
                    />
                  </IconBorder>
                  <Typography
                    variant={TYPOGRAPHY.H7}
                    color={COLORS.TEXT_DEFAULT}
                    fontWeight={FONT_WEIGHT.BOLD}
                    boxProps={{ marginLeft: 2 }}
                  >
                    {item.nickname}
                  </Typography>
                </Box>
                <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.CENTER}>
                  {
                    // Warning for the networks that doesn't use infura.io as the RPC
                    !infuraRegex.test(item.rpcUrl) && (
                      <Tooltip
                        className="add-network__warning-tooltip"
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
                        theme={theme === THEME_TYPE.DEFAULT ? 'light' : 'dark'}
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
                      await dispatch(requestUserApproval(item));
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
                ? [4, 4, 4, 4]
                : [4, 4, 4, 0]
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
