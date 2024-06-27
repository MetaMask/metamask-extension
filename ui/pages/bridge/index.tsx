import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, useHistory } from 'react-router-dom';
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
import { Icon, IconName, IconSize } from '../../components/component-library';
import { IconColor } from '../../helpers/constants/design-system';
import { getIsBridgeEnabled } from '../../selectors';
import useBridging from '../../hooks/bridge/useBridging';
import useUpdateSwapsState from '../swaps/hooks/useUpdateSwapsState';
import { Content, Header } from '../../components/multichain/pages/page';
import PrepareBridgePage from './prepare/prepare-bridge-page';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);

  useBridging();
  useUpdateSwapsState();

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
        <Header
          className="bridge__header"
          startAccessory={
            <Icon
              name={IconName.Arrow2Left}
              size={IconSize.Lg}
              color={IconColor.iconAlternative}
              onClick={redirectToDefaultRoute}
              style={{ cursor: 'pointer' }}
              title={t('cancel')}
            />
          }
          endAccessory={<Icon name={IconName.Setting} />}
        >
          {t('bridge')}
        </Header>
        <Content className="bridge__content">
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
        </Content>
      </div>
    </div>
  );
};

export default CrossChainSwap;
