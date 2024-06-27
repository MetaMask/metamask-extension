import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, useLocation, useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { I18nContext } from '../../contexts/i18n';

import {
  clearSwapsState,
  getSwapsFeatureIsLive,
  setTransactionSettingsOpened,
} from '../../ducks/swaps/swaps';
import {
  AWAITING_SIGNATURES_ROUTE,
  AWAITING_SWAP_ROUTE,
  SMART_TRANSACTION_STATUS_ROUTE,
  DEFAULT_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../helpers/constants/routes';

import { resetBackgroundSwapsState } from '../../store/actions';

import FeatureToggledRoute from '../../helpers/higher-order-components/feature-toggled-route';
import { Icon, IconName, IconSize } from '../../components/component-library';
import Box from '../../components/ui/box';
import {
  DISPLAY,
  JustifyContent,
  IconColor,
  FRACTIONS,
} from '../../helpers/constants/design-system';
import useUpdateSwapsState from '../../hooks/useUpdateSwapsState';
import PrepareBridgePage from './prepare/prepare-bridge-page';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();

  const { pathname } = useLocation();
  const isAwaitingSwapRoute = pathname === AWAITING_SWAP_ROUTE;
  const isAwaitingSignaturesRoute = pathname === AWAITING_SIGNATURES_ROUTE;
  const isSmartTransactionStatusRoute =
    pathname === SMART_TRANSACTION_STATUS_ROUTE;
  const isPrepareSwapRoute = pathname === PREPARE_SWAP_ROUTE;
  const swapsEnabled = useSelector(getSwapsFeatureIsLive);

  useUpdateSwapsState();

  const redirectToDefaultRoute = async () => {
    history.push({
      pathname: DEFAULT_ROUTE,
      // @ts-expect-error - property 'state' does not exist on type PartialPath.
      state: { stayOnHomePage: true },
    });
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
  };

  return (
    <div className="bridge">
      <div className="bridge__container">
        <div className="bridge__header">
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.center}
            marginLeft={4}
            width={FRACTIONS.ONE_TWELFTH}
            tabIndex={0}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                redirectToDefaultRoute();
              }
            }}
          >
            {!isAwaitingSwapRoute &&
              !isAwaitingSignaturesRoute &&
              !isSmartTransactionStatusRoute && (
                <Icon
                  name={IconName.Arrow2Left}
                  size={IconSize.Lg}
                  color={IconColor.iconAlternative}
                  onClick={redirectToDefaultRoute}
                  style={{ cursor: 'pointer' }}
                  title={t('cancel')}
                />
              )}
          </Box>

          <div className="bridge__title">{t('bridge')}</div>

          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.center}
            marginRight={4}
            width={FRACTIONS.ONE_TWELFTH}
            tabIndex={0}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                dispatch(setTransactionSettingsOpened(true));
              }
            }}
          >
            {isPrepareSwapRoute && (
              <Icon
                name={IconName.Setting}
                size={IconSize.Lg}
                color={IconColor.iconAlternative}
                onClick={() => {
                  dispatch(setTransactionSettingsOpened(true));
                }}
                style={{ cursor: 'pointer' }}
                title={t('transactionSettings')}
              />
            )}
          </Box>
        </div>
        <div
          className={classnames(
            'bridge__content',
            'bridge__content--redesign-enabled',
          )}
        >
          <Switch>
            <FeatureToggledRoute
              redirectRoute={SWAPS_MAINTENANCE_ROUTE}
              flag={swapsEnabled}
              path={CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE}
              render={() => {
                return <PrepareBridgePage />;
              }}
            />
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default CrossChainSwap;
