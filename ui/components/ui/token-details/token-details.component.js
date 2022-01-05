import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Tooltip from '../tooltip';
import Button from '../button';
import CopyIcon from '../icon/copy-icon.component';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

const TokenDetails = ({
  address,
  onClose = null,
  onHideToken = null,
  value,
  icon,
  currentCurrency,
  decimals,
  network,
}) => {
  const t = useContext(I18nContext);

  const onHideTokenClick = useCallback(() => {
    onHideToken();
  }, [onHideToken]);

  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <div className="page-container token-details">
      <div className="token-details__wrapper">
        <div className="token-details__token-details-title" onClick={onClose}>
          {t('tokenDetailsTitle')}
        </div>
        <div className="token-details__address">
          <div className="token-details__address__token-value">{value}</div>
          {icon}
        </div>
        <div className="token-details__token-current-currency">
          {currentCurrency}
        </div>
        <div className="token-details__token-contract-address-title">
          {t('tokenContractAddress')}
        </div>
        <div className="token-details__copy-token-contract-address">
          <div className="token-details__copy-token-contract-address__token-address">
            {address}
          </div>
          <Tooltip
            position="bottom"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            containerClassName="token-details__copy-token-contract-address__copy-icon"
          >
            <button
              type="link"
              onClick={() => {
                handleCopy(address);
              }}
              title=""
            >
              <CopyIcon size={11} color="#037DD6" />
            </button>
          </Tooltip>
        </div>
        <div className="token-details__token-decimal-title">
          {t('tokenDecimalTitle')}
        </div>
        <div className="token-details__token-decimals">{decimals}</div>
        <div className="token-details__token-network-title">{t('network')}</div>
        <div className="token-details__token-network">{network}</div>
        <Button
          type="primary"
          className="token-details__hide-token-button"
          onClick={onHideTokenClick}
        >
          <span className="token-details__hide-token-button__hide-token-text">
            {t('hideToken')}
          </span>
        </Button>
      </div>
    </div>
  );
};

TokenDetails.propTypes = {
  address: PropTypes.string,
  onClose: PropTypes.func,
  onHideToken: PropTypes.func,
  value: PropTypes.string,
  icon: PropTypes.element.isRequired,
  currentCurrency: PropTypes.string,
  decimals: PropTypes.number,
  network: PropTypes.string,
};

export default TokenDetails;
