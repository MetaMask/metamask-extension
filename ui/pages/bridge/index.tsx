import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, useHistory } from 'react-router-dom';
import classnames from 'classnames';
import { I18nContext } from '../../contexts/i18n';

import { clearSwapsState } from '../../ducks/swaps/swaps';
import {
  DEFAULT_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../helpers/constants/routes';

import { resetBackgroundSwapsState } from '../../store/actions';

import FeatureToggledRoute from '../../helpers/higher-order-components/feature-toggled-route';
import {
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../components/component-library';
import {
  JustifyContent,
  IconColor,
  Display,
  BlockSize,
} from '../../helpers/constants/design-system';
import { getIsBridgeEnabled } from '../../selectors';
import { PrepareBridgePage } from './prepare/prepare-bridge-page';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();

  const isBridgeEnabled = useSelector(getIsBridgeEnabled);

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
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            marginLeft={4}
            width={BlockSize.OneTwelfth}
            tabIndex={0}
            onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                redirectToDefaultRoute();
              }
            }}
          >
            <Icon
              name={IconName.Arrow2Left}
              size={IconSize.Lg}
              color={IconColor.iconAlternative}
              onClick={redirectToDefaultRoute}
              style={{ cursor: 'pointer' }}
              title={t('cancel')}
            />
          </Box>

          <div className="bridge__title">{t('bridge')}</div>
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
              flag={isBridgeEnabled}
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
