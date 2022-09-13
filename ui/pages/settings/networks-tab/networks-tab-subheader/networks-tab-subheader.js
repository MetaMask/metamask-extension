import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ADD_NETWORK_ROUTE,
  ADD_POPULAR_CUSTOM_NETWORK,
} from '../../../../helpers/constants/routes';
import Button from '../../../../components/ui/button';
import { getIsCustomNetworkListEnabled } from '../../../../selectors';

const NetworksFormSubheader = ({ addNewNetwork }) => {
  const t = useI18nContext();
  const history = useHistory();
  const addPopularNetworkFeatureToggledOn = useSelector(
    getIsCustomNetworkListEnabled,
  );

  return addNewNetwork ? (
    <div className="networks-tab__subheader">
      <span className="networks-tab__sub-header-text">{t('networks')}</span>
      <span className="networks-tab__sub-header-text">{'  >  '}</span>
      <div className="networks-tab__sub-header-text">{t('addANetwork')}</div>
      <span>{'  >  '}</span>
      <div className="networks-tab__subheader--break">
        {t('addANetworkManually')}
      </div>
    </div>
  ) : (
    <div className="settings-page__sub-header">
      <span className="settings-page__sub-header-text">{t('networks')}</span>
      <div className="networks-tab__add-network-header-button-wrapper">
        <Button
          type="primary"
          onClick={(event) => {
            event.preventDefault();
            addPopularNetworkFeatureToggledOn
              ? history.push(ADD_POPULAR_CUSTOM_NETWORK)
              : history.push(ADD_NETWORK_ROUTE);
          }}
        >
          {t('addANetwork')}
        </Button>
      </div>
    </div>
  );
};

NetworksFormSubheader.propTypes = {
  addNewNetwork: PropTypes.bool.isRequired,
};

export default NetworksFormSubheader;
