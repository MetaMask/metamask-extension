import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ADD_NETWORK_ROUTE } from '../../../helpers/constants/routes';
import { setSelectedSettingsRpcUrl } from '../../../store/actions';
import Button from '../../../components/ui/button';
import NetworkForm from './network-form';
import NetworkTabContent from './network-tab-content';

const SubHeader = ({ addNewNetwork }) => {
  const t = useI18nContext();
  const history = useHistory();
  return addNewNetwork ? (
    <div className="networks-tab__subheader">
      <span className="networks-tab__sub-header-text">{t('networks')}</span>
      <span>{'  >  '}</span>
      <div className="networks-tab__subheader--break">{t('addANetwork')}</div>
    </div>
  ) : (
    <div className="settings-page__sub-header">
      <span className="settings-page__sub-header-text">{t('networks')}</span>
      <div className="networks-tab__add-network-header-button-wrapper">
        <Button
          type="primary"
          onClick={(event) => {
            event.preventDefault();
            history.push(ADD_NETWORK_ROUTE);
          }}
        >
          {t('addANetwork')}
        </Button>
      </div>
    </div>
  );
};

SubHeader.propTypes = {
  addNewNetwork: PropTypes.bool.isRequired,
};

const NetworkTab = ({
  addNewNetwork,
  isFullScreen,
  networkDefaultedToProvider,
  networkIsSelected,
  networksToRender,
  providerType,
  providerUrl,
  selectedNetwork,
  shouldRenderNetworkForm,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(setSelectedSettingsRpcUrl(''));
    };
  }, [dispatch]);

  return (
    <div className="networks-tab__body">
      {isFullScreen ? <SubHeader addNewNetwork={addNewNetwork} /> : null}
      <div className="networks-tab__content">
        {addNewNetwork ? (
          <NetworkForm
            networksToRender={networksToRender}
            addNewNetwork={addNewNetwork}
          />
        ) : (
          <>
            <NetworkTabContent
              isFullScreen={isFullScreen}
              networkDefaultedToProvider={networkDefaultedToProvider}
              networkIsSelected={networkIsSelected}
              networksToRender={networksToRender}
              providerType={providerType}
              providerUrl={providerUrl}
              selectedNetwork={selectedNetwork}
              shouldRenderNetworkForm={shouldRenderNetworkForm}
            />
            {!isFullScreen && !shouldRenderNetworkForm ? (
              <div className="networks-tab__networks-list-popup-footer">
                <Button
                  type="primary"
                  onClick={(event) => {
                    event.preventDefault();
                    global.platform.openExtensionInBrowser(ADD_NETWORK_ROUTE);
                  }}
                >
                  {t('addNetwork')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

NetworkTab.propTypes = {
  addNewNetwork: PropTypes.bool,
  isFullScreen: PropTypes.bool.isRequired,
  networkDefaultedToProvider: PropTypes.bool,
  networkIsSelected: PropTypes.bool,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  providerType: PropTypes.string,
  providerUrl: PropTypes.string,
  selectedNetwork: PropTypes.object,
  shouldRenderNetworkForm: PropTypes.bool.isRequired,
};

export default NetworkTab;
