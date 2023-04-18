import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { I18nContext } from '../../../contexts/i18n';
import { Menu, MenuItem } from '../../../components/ui/menu';
import { getBlockExplorerLinkText } from '../../../selectors';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import { ICON_NAMES } from '../../../components/component-library/icon/deprecated';
import { ButtonIcon } from '../../../components/component-library/button-icon/deprecated';
import { Color } from '../../../helpers/constants/design-system';

const AssetOptions = ({
  onRemove,
  onClickBlockExplorer,
  onViewAccountDetails,
  onViewTokenDetails,
  tokenSymbol,
  isNativeAsset,
}) => {
  const t = useContext(I18nContext);
  const [assetOptionsOpen, setAssetOptionsOpen] = useState(false);
  const history = useHistory();
  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);
  const ref = useRef(false);

  const routeToAddBlockExplorerUrl = () => {
    history.push(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

  const openBlockExplorer = () => {
    setAssetOptionsOpen(false);
    onClickBlockExplorer();
  };

  return (
    <div ref={ref}>
      <ButtonIcon
        className="asset-options__button"
        data-testid="asset-options__button"
        onClick={() => setAssetOptionsOpen(true)}
        ariaLabel={t('assetOptions')}
        iconName={ICON_NAMES.MORE_VERTICAL}
        color={Color.textDefault}
      />
      {assetOptionsOpen ? (
        <Menu
          anchorElement={ref.current}
          onHide={() => setAssetOptionsOpen(false)}
        >
          <MenuItem
            iconName={ICON_NAMES.SCAN_BARCODE}
            data-testid="asset-options__account-details"
            onClick={() => {
              setAssetOptionsOpen(false);
              onViewAccountDetails();
            }}
          >
            {t('accountDetails')}
          </MenuItem>
          <MenuItem
            iconName={ICON_NAMES.EXPORT}
            data-testid="asset-options__etherscan"
            onClick={
              blockExplorerLinkText.firstPart === 'addBlockExplorer'
                ? routeToAddBlockExplorerUrl
                : openBlockExplorer
            }
          >
            {t(
              blockExplorerLinkText.firstPart,
              blockExplorerLinkText.secondPart === ''
                ? null
                : [t('blockExplorerAssetAction')],
            )}
          </MenuItem>
          {isNativeAsset ? null : (
            <MenuItem
              iconName={ICON_NAMES.TRASH}
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
              iconName={ICON_NAMES.INFO}
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
    </div>
  );
};

const isNotFunc = (p) => {
  return typeof p !== 'function';
};

AssetOptions.propTypes = {
  isNativeAsset: PropTypes.bool,
  onClickBlockExplorer: PropTypes.func.isRequired,
  onViewAccountDetails: PropTypes.func.isRequired,
  onRemove: (props) => {
    if (props.isNativeAsset === false && isNotFunc(props.onRemove)) {
      throw new Error(
        'When isNativeAsset is true, onRemove is a required prop',
      );
    }
  },
  onViewTokenDetails: (props) => {
    if (props.isNativeAsset === false && isNotFunc(props.onViewTokenDetails)) {
      throw new Error(
        'When isNativeAsset is true, onViewTokenDetails is a required prop',
      );
    }
  },
  tokenSymbol: (props) => {
    if (
      props.isNativeAsset === false &&
      typeof props.tokenSymbol !== 'string'
    ) {
      throw new Error(
        'When isNativeAsset is true, tokenSymbol is a required prop',
      );
    }
  },
};

export default AssetOptions;
