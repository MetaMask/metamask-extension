import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Menu, MenuItem } from '../../../components/ui/menu';
import { getBlockExplorerLinkText } from '../../../selectors';
import { NETWORKS_ROUTE } from '../../../helpers/constants/routes';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import { Color } from '../../../helpers/constants/design-system';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsEventLocation,
} from '../../../../shared/constants/metametrics';
import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';

const AssetOptions = ({
  onRemove,
  onClickBlockExplorer,
  onViewTokenDetails,
  token,
  isNativeAsset,
}) => {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const [assetOptionsOpen, setAssetOptionsOpen] = useState(false);
  const navigate = useNavigate();
  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);
  const ref = useRef(false);

  const routeToAddBlockExplorerUrl = () => {
    navigate(`${NETWORKS_ROUTE}#blockExplorerUrl`);
  };

  const openBlockExplorer = () => {
    setAssetOptionsOpen(false);
    onClickBlockExplorer();
  };

  const handleRemoveToken = () => {
    // Track the TokenHidden event before calling onRemove
    trackEvent({
      event: MetaMetricsEventName.TokenHidden,
      category: MetaMetricsEventCategory.Wallet,
      sensitiveProperties: {
        token_symbol: token?.symbol,
        token_contract_address: token?.address,
        token_decimal_precision: token?.decimals,
        location: MetaMetricsEventLocation.TokenDetails,
        token_standard: TokenStandard.ERC20,
        asset_type: AssetType.token,
        chain_id: token?.chainId,
      },
    });

    setAssetOptionsOpen(false);
    onRemove();
  };

  return (
    <div ref={ref}>
      <ButtonIcon
        className="asset-options__button"
        data-testid="asset-options__button"
        onClick={() => setAssetOptionsOpen(true)}
        ariaLabel={t('assetOptions')}
        iconName={IconName.MoreVertical}
        color={Color.textDefault}
        size={ButtonIconSize.Sm}
      />
      {assetOptionsOpen ? (
        <Menu
          anchorElement={ref.current}
          onHide={() => setAssetOptionsOpen(false)}
        >
          <MenuItem
            iconName={IconName.Export}
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
          {!isNativeAsset && (
            <MenuItem
              iconName={IconName.Trash}
              data-testid="asset-options__hide"
              onClick={handleRemoveToken}
            >
              {t('hideTokenSymbol', [token?.symbol])}
            </MenuItem>
          )}
          {isNativeAsset || !onViewTokenDetails ? null : (
            <MenuItem
              iconName={IconName.Info}
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
  onRemove: (props) => {
    if (props.isNativeAsset === false && isNotFunc(props.onRemove)) {
      throw new Error(
        'When isNativeAsset is true, onRemove is a required prop',
      );
    }
  },
  onViewTokenDetails: PropTypes.func,
  token: (props) => {
    if (props.isNativeAsset === false && typeof props.token !== 'object') {
      throw new Error('When isNativeAsset is false, token is a required prop');
    }
  },
};

export default AssetOptions;
