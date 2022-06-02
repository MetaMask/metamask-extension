import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../../components/ui/menu';

const noop = () => {};

const AssetOptions = ({
  onRemove,
  onClickBlockExplorer,
  onViewAccountDetails,
  onViewTokenDetails,
  tokenSymbol,
  isNativeAsset,
  isEthNetwork,
}) => {
  const t = useContext(I18nContext);
  const [assetOptionsButtonElement, setAssetOptionsButtonElement] = useState(
    null,
  );
  const [assetOptionsOpen, setAssetOptionsOpen] = useState(false);

  if (props.onRemove === undefined) { props.onRemove = noop; }
  if (props.onViewTokenDetails === undefined) { props.onViewTokenDetails = noop; }

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
            onClick={() => {
              setAssetOptionsOpen(false);
              onClickBlockExplorer();
            }}
          >
            {isEthNetwork
              ? t('viewOnEtherscan', [t('blockExplorerAssetAction')])
              : t('viewinExplorer', [t('blockExplorerAssetAction')])}
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
  isEthNetwork: PropTypes.bool,
  isNativeAsset: PropTypes.bool,
  onClickBlockExplorer: PropTypes.func.isRequired,
  onViewAccountDetails: PropTypes.func.isRequired,
  onRemove: (props, propName, componentName) => {
    if (props.isNativeAsset === false && typeof(onRemove) !== "function") {
      throw new Error("When isNativeAsset is true, onRemove is a required prop");
    }
  },
  onViewTokenDetails: (props, propName, componentName) => {
    if (props.isNativeAsset === false && typeof(onViewTokenDetails) !== "function") {
      throw new Error("When isNativeAsset is true, onViewTokenDetails is a required prop");
    }
  },
  tokenSymbol: (props, propName, componentName) => {
    if (props.isNativeAsset === false && typeof(tokenSymbol) !== "string") {
      throw new Error("When isNativeAsset is true, tokenSymbol is a required prop");
    }
  }
};

export default AssetOptions;
