import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../../components/ui/menu';

const AssetOptions = ({
  onRemove,
  onClickBlockExplorer,
  onViewAccountDetails,
  tokenSymbol,
  isNativeAsset,
  isEthNetwork,
}) => {
  const t = useContext(I18nContext);
  const [assetOptionsButtonElement, setAssetOptionsButtonElement] = useState(
    null,
  );
  const [assetOptionsOpen, setAssetOptionsOpen] = useState(false);

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
            {isEthNetwork ? t('viewOnEtherscan') : t('viewinExplorer')}
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
        </Menu>
      ) : null}
    </>
  );
};

AssetOptions.propTypes = {
  isEthNetwork: PropTypes.bool,
  isNativeAsset: PropTypes.bool,
  onRemove: PropTypes.func.isRequired,
  onClickBlockExplorer: PropTypes.func.isRequired,
  onViewAccountDetails: PropTypes.func.isRequired,
  tokenSymbol: PropTypes.string,
};

export default AssetOptions;
