import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Tooltip from '../../../ui/tooltip';
import Button from '../../../ui/button';
import Copy from '../../../ui/icon/copy-icon.component';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import Popover from '../../../ui/popover';

const TransactionErrorDetailsModal = ({ message, closePopover }) => {
  const [copied, handleCopy] = useCopyToClipboard();

  const t = useI18nContext();

  return (
    <Popover title={t('details')} onClose={closePopover}>
      <div className="transaction-error-details__main">
        <p>{message}</p>
        <br />
        <Tooltip
          position="bottom"
          title={copied ? t('copiedExclamation') : t('copyToClipboard')}
        >
          <Button
            type="link"
            onClick={() => {
              handleCopy(message);
            }}
          >
            <Copy size={17} color="#3098DC" />
            {t('copyToClipboard')}
          </Button>
        </Tooltip>
      </div>
    </Popover>
  );
};

TransactionErrorDetailsModal.propTypes = {
  message: PropTypes.string,
  closePopover: PropTypes.func,
};

export default TransactionErrorDetailsModal;
