import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import CopyContractDetails from '../../../ui/icon/copy-contract-details';
import IconBlockExplorer from '../../../ui/icon/icon-block-explorer';
import Button from '../../../ui/button/button.component';
import Tooltip from '../../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Identicon from '../../../ui/identicon/identicon.component';
import { ellipsify } from '../../../../pages/send/send.utils';
import Popover from '../../../ui/popover';

export default function ContractDetailsModal({ onClose, address, tokenName }) {
  const t = useI18nContext();

  return (
    <Popover className="contract-details-modal">
      <Box className="contract-details-modal__content">
        <div className="contract-details-modal__content__header">
          {t('contractTitle')}
        </div>
        <div className="contract-details-modal__content__description">
          {t('contractDescription')} {t('contractDescriptionLink')}
        </div>

        <div className="contract-details-modal__content__contract-subtitle">
          {t('contractToken')}
        </div>
        <Box className="contract-details-modal__content__contract">
          <Identicon
            className="contract-details-modal__content__contract__identicon"
            address={address}
            diameter={24}
          />
          <div data-testid="recipient">
            <div className="contract-details-modal__content__contract__title">
              {tokenName || ellipsify(address)}
            </div>
            {tokenName && (
              <div className="contract-details-modal__content__contract__addresss">
                {ellipsify(address)}
              </div>
            )}
          </div>
          <div className="contract-details-modal__content__contract__buttons">
            <Tooltip title={t('copyToClipboard')}>
              <button
                className="contract-details-modal__content__contract__buttonCopy"
                type="link"
              >
                <CopyContractDetails size={16} />
              </button>
            </Tooltip>
            <Tooltip title={t('openInBlockExplorer')}>
              <button
                className="contract-details-modal__content__contract__button"
                type="link"
              >
                <IconBlockExplorer
                  size={14}
                  color="var(--color-icon-default)"
                />
              </button>
            </Tooltip>
          </div>
        </Box>

        <div className="contract-details-modal__content__contract-subtitle">
          {t('contractRequestingSpendingCap')}
        </div>
        <Box className="contract-details-modal__content__contract">
          <Identicon
            className="contract-details-modal__content__contract__identicon"
            address={address}
            diameter={24}
          />
          <div data-testid="recipient">
            <div className="contract-details-modal__content__contract__title">
              {tokenName || ellipsify(address)}
            </div>
            {tokenName && (
              <div className="contract-details-modal__content__contract__addresss">
                {ellipsify(address)}
              </div>
            )}
          </div>
          <div className="contract-details-modal__content__contract__buttons">
            <Tooltip title={t('copyToClipboard')}>
              <button
                className="contract-details-modal__content__contract__buttonCopy"
                type="link"
              >
                <CopyContractDetails size={16} />
              </button>
            </Tooltip>
            <Tooltip title={t('openInBlockExplorer')}>
              <button
                className="contract-details-modal__content__contract__button"
                type="link"
              >
                <IconBlockExplorer
                  size={14}
                  color="var(--color-icon-default)"
                />
              </button>
            </Tooltip>
          </div>
        </Box>
      </Box>
      <Box className="contract-details-modal__footer">
        <Button
          type="secondary"
          onClick={() => {
            onClose();
          }}
        >
          {t('cancel')}
        </Button>
        <Button type="primary">{t('confirm')}</Button>
      </Box>
    </Popover>
  );
}

ContractDetailsModal.propTypes = {
  onClose: PropTypes.func,
  address: PropTypes.string,
  tokenName: PropTypes.string,
};
