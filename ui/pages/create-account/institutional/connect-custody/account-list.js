import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import copy from 'copy-to-clipboard';
import Button from '../../../../components/ui/button';
import CustodyLabels from '../../../../components/app/institutional/custody-labels';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { SECOND } from '../../../../../shared/constants/time';
import { shortenAddress } from '../../../../helpers/utils/util';
import Tooltip from '../../../../components/ui/tooltip';
import { Color } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Icon,
  ICON_NAMES,
  ICON_SIZES,
} from '../../../../components/component-library';

export default function CustodyAccountList({
  rawList,
  accounts,
  onAccountChange,
  selectedAccounts,
  onCancel,
  onAddAccounts,
  custody,
}) {
  const timerRef = useRef(null);
  const t = useI18nContext();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const renderAccounts = () => {
    const tooltipText = copied ? t('copiedExclamation') : t('copyToClipboard');

    return (
      <div className="custody-account-list" data-testid="custody-account-list">
        {accounts.map((account, idx) => (
          <div className="custody-account-list__item" key={account.address}>
            <div
              data-testid="custody-account-list-item-radio-button"
              className="custody-account-list__item__radio"
            >
              {!rawList && (
                <input
                  type="checkbox"
                  name="selectedAccount"
                  id={`address-${idx}`}
                  value={account.address}
                  onChange={(e) =>
                    onAccountChange({
                      name: account.name,
                      address: e.target.value,
                      custodianDetails: account.custodianDetails,
                      labels: account.labels,
                      chainId: account.chainId,
                    })
                  }
                  checked={
                    selectedAccounts && selectedAccounts[account.address]
                  }
                />
              )}
            </div>
            <div className="custody-account-list__item__body">
              <label
                htmlFor={`address-${idx}`}
                className="custody-account-list__item__title"
              >
                <span className="custody-account-list__item__name">
                  {account.name}
                </span>
              </label>
              <label
                htmlFor={`address-${idx}`}
                className="custody-account-list__item__subtitle"
              >
                <span className="custody-account-list__item__address">
                  <a
                    className="custody-account-list__item__address-link"
                    href={`${
                      SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[
                        CHAIN_IDS.MAINNET
                      ]
                    }address/${account.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {shortenAddress(account.address)}
                    <Icon
                      name={ICON_NAMES.OpenInNewTab}
                      size={ICON_SIZES.SM}
                      color={Color.primaryDefault}
                      marginLeft={1}
                    />
                  </a>
                  <Tooltip position="bottom" title={tooltipText}>
                    <button
                      className="custody-account-list__item__address-clipboard"
                      onClick={() => {
                        setCopied(true);
                        timerRef.current = setTimeout(
                          () => setCopied(false),
                          SECOND * 3,
                        );
                        copy(account.address);
                      }}
                    >
                      <Icon
                        name={ICON_NAMES.COPY}
                        size={ICON_SIZES.XS}
                        color={Color.iconMuted}
                      />
                    </button>
                  </Tooltip>
                </span>
              </label>
              <div className="custody-account-list__item-details">
                {account.labels && (
                  <CustodyLabels
                    labels={account.labels}
                    index={idx.toString()}
                    hideNetwork
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderButtons = () => {
    const disabled = Object.keys(selectedAccounts).length === 0;
    const buttonProps = {};
    if (disabled) {
      buttonProps.disabled = true;
    }

    return (
      <div className="new-custody-account-form__buttons">
        <Button
          type="default"
          large
          className="new-custody-account-form__button"
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          data-testid="custody-account-connect-button"
          type="primary"
          large
          className="new-custody-account-form__button unlock"
          disabled={disabled}
          onClick={() => onAddAccounts(custody)}
        >
          {t('connect')}
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="custody-account-list-container">{renderAccounts()}</div>
      {!rawList && renderButtons()}
    </>
  );
}

CustodyAccountList.propTypes = {
  custody: PropTypes.string,
  accounts: PropTypes.array.isRequired,
  onAccountChange: PropTypes.func,
  selectedAccounts: PropTypes.object,
  onAddAccounts: PropTypes.func,
  onCancel: PropTypes.func,
  // eslint-disable-next-line react/no-unused-prop-types
  provider: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  rawList: PropTypes.bool,
};
