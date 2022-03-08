import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../../components/ui/menu';
import { getRpcPrefsForCurrentProvider } from '../../../selectors';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';

const AssetOptions = ({
  onRemove,
  onClickBlockExplorer,
  onViewAccountDetails,
  onViewTokenDetails,
  tokenSymbol,
  isNativeAsset,
  isCustomNetwork,
}) => {
  const t = useContext(I18nContext);
  const [assetOptionsButtonElement, setAssetOptionsButtonElement] = useState(
    null,
  );
  const [assetOptionsOpen, setAssetOptionsOpen] = useState(false);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const history = useHistory();

  return (
    <>
      <button
        className="fas fa-ellipsis-v asset-options__button"
        data-testid="asset-options__button"
        onClick={() => setAssetOptionsOpen(true)}
        ref={setAssetOptionsButtonElement}
        title={t('assetOptions')}
      />
      {assetOptionsOpen ? (
        <Menu
          anchorElement={assetOptionsButtonElement}
          onHide={() => setAssetOptionsOpen(false)}
        >
          <MenuItem
            iconClassName="fas fa-qrcode"
            data-testid="asset-options__account-details"
            onClick={() => {
              setAssetOptionsOpen(false);
              onViewAccountDetails();
            }}
          >
            {t('accountDetails')}
          </MenuItem>
          <MenuItem
            iconClassName="fas fa-external-link-alt asset-options__icon"
            data-testid="asset-options__etherscan"
            onClick={
              !rpcPrefs.blockExplorerUrl && isCustomNetwork
                ? () => {
                    history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
                  }
                : () => {
                    setAssetOptionsOpen(false);
                    onClickBlockExplorer();
                  }
            }
          >
            {rpcPrefs.blockExplorerUrl &&
              t('viewinExplorer', [t('blockExplorerAssetAction')])}
            {!rpcPrefs.blockExplorerUrl &&
              isCustomNetwork &&
              t('addBlockExplorer')}
            {!rpcPrefs.blockExplorerUrl &&
              !isCustomNetwork &&
              t('viewOnEtherscan', [t('blockExplorerAssetAction')])}
          </MenuItem>
          {isNativeAsset ? null : (
            <MenuItem
              iconClassName="fas fa-trash-alt asset-options__icon"
              data-testid="asset-options__hide"
              onClick={() => {
                setAssetOptionsOpen(false);
                onRemove();
              }}
            >
              {t('hideTokenSymbol', [tokenSymbol])}
            </MenuItem>
          )}
          {isNativeAsset ? null : (
            <MenuItem
              iconClassName="fas fa-info-circle asset-options__icon"
              data-testid="asset-options__token-details"
              onClick={() => {
                setAssetOptionsOpen(false);
                onViewTokenDetails();
              }}
            >
              {t('tokenDetails')}
            </MenuItem>
          )}
        </Menu>
      ) : null}
    </>
  );
};

AssetOptions.propTypes = {
  isNativeAsset: PropTypes.bool,
  onRemove: PropTypes.func.isRequired,
  onClickBlockExplorer: PropTypes.func.isRequired,
  onViewAccountDetails: PropTypes.func.isRequired,
  onViewTokenDetails: PropTypes.func.isRequired,
  tokenSymbol: PropTypes.string,
  isCustomNetwork: PropTypes.bool,
};

export default AssetOptions;
