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
        <Box className="contract-details-modal__content__header">
          {t('contractTitle')}
        </Box>
        <div className="contract-details-modal__content__description">
          {t('contractDescription')}
        </div>

        <Box className="contract-details-modal__content__contract-subtitle">
          {t('contractToken')}
        </Box>
        <Box className="contract-details-modal__content__contract">
          <Identicon
            className="contract-details-modal__content__contract__identicon"
            address={address}
            diameter={24}
          />
          <Box data-testid="recipient">
            <Box className="contract-details-modal__content__contract__title">
              {tokenName || ellipsify(address)}
            </Box>
            {tokenName && (
              <div className="contract-details-modal__content__contract__address">
                {ellipsify(address)}
              </div>
            )}
          </Box>
          <Box className="contract-details-modal__content__contract__buttons">
            <Tooltip title={t('copyToClipboard')}>
              <button
                className="contract-details-modal__content__contract__buttonCopy"
                type="link"
              >
                <CopyContractDetails size={18} />
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
          </Box>
        </Box>

        <Box className="contract-details-modal__content__contract-subtitle">
          {t('contractRequestingSpendingCap')}
        </Box>
        <Box className="contract-details-modal__content__contract">
          <Identicon
            className="contract-details-modal__content__contract__identicon"
            address={address}
            diameter={24}
          />
          <Box data-testid="recipient">
            <Box className="contract-details-modal__content__contract__title">
              {tokenName || ellipsify(address)}
            </Box>
            {tokenName && (
              <div className="contract-details-modal__content__contract__address">
                {ellipsify(address)}
              </div>
            )}
          </Box>
          <Box className="contract-details-modal__content__contract__buttons">
            <Tooltip title={t('copyToClipboard')}>
              <button
                className="contract-details-modal__content__contract__buttonCopy"
                type="link"
              >
                <CopyContractDetails size={18} />
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
          </Box>
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
