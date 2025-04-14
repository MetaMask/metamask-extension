import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Tooltip from '../tooltip';
import { getSelectedAccount } from '../../../selectors';
import InfoIcon from '../icon/info-icon.component';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Severity } from '../../../helpers/constants/design-system';

export default function AccountMismatchWarning({ address }) {
  const selectedAccount = useSelector(getSelectedAccount);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  if (selectedAccount.address === address) {
    return null;
  }

  return (
    <Tooltip
      position="bottom"
      html={<p>{t('notCurrentAccount')}</p>}
      wrapperClassName="account-mismatch-warning__tooltip-wrapper"
      containerClassName="account-mismatch-warning__tooltip-container"
    >
      <div
        className="account-mismatch-warning__tooltip-container-icon"
        data-testid="account-mismatch-warning-tooltip"
      >
        <InfoIcon severity={Severity.Warning} />
      </div>
    </Tooltip>
  );
}

AccountMismatchWarning.propTypes = {
  address: PropTypes.string.isRequired,
};
