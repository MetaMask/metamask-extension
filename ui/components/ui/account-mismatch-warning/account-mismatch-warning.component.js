import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Tooltip from '../tooltip';
import { getSelectedAddress } from '../../../selectors';
import InfoIcon from '../icon/info-icon.component';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SEVERITIES } from '../../../helpers/constants/design-system';

export default function AccountMismatchWarning({ address }) {
  const selectedAddress = useSelector(getSelectedAddress);
  const t = useI18nContext();
  if (selectedAddress === address) {
    return null;
  }

  return (
    <Tooltip
      position="bottom"
      html={<p>{t('notCurrentAccount')}</p>}
      wrapperClassName="account-mismatch-warning__tooltip-wrapper"
      containerClassName="account-mismatch-warning__tooltip-container"
    >
      <div className="account-mismatch-warning__tooltip-container-icon">
        <InfoIcon severity={SEVERITIES.WARNING} />
      </div>
    </Tooltip>
  );
}

AccountMismatchWarning.propTypes = {
  address: PropTypes.string.isRequired,
};
