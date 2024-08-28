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
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../components/component-library';
import { getIsBridgeEnabled } from '../../selectors';
import useBridging from '../../hooks/bridge/useBridging';
import { Content, Header } from '../../components/multichain/pages/page';
import PrepareBridgePage from './prepare/prepare-bridge-page';

const CrossChainSwap = () => {
  const t = useContext(I18nContext);

  useBridging();

  const history = useHistory();
  const dispatch = useDispatch();

  const isBridgeEnabled = useSelector(getIsBridgeEnabled);

  const redirectToDefaultRoute = async () => {
    history.push({
      pathname: DEFAULT_ROUTE,
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
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Sm}
              ariaLabel={t('back')}
              onClick={redirectToDefaultRoute}
            />
          }
          endAccessory={
            <ButtonIcon
              iconName={IconName.Setting}
              size={ButtonIconSize.Sm}
              ariaLabel={t('settings')}
              // onClick={TODO open advanced settings}
            />
          }
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
