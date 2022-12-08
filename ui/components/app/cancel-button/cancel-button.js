import { Tooltip } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import Button from '../../ui/button';
import { getMaximumGasTotalInHexWei } from '../../../../shared/modules/gas.utils';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useIncrementedGasFees } from '../../../hooks/useIncrementedGasFees';
import { isBalanceSufficient } from '../../../pages/send/send.utils';
import { getSelectedAccount } from '../../../selectors';

export default function CancelButton({
  cancelTransaction,
  transaction,
  detailsModal,
}) {
  const t = useI18nContext();

  const customCancelGasSettings = useIncrementedGasFees(transaction);

  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);

  const hasEnoughCancelGas = isBalanceSufficient({
    amount: '0x0',
    gasTotal: getMaximumGasTotalInHexWei(customCancelGasSettings),
    balance: selectedAccount.balance,
    conversionRate,
  });

  const btn = (
    <Button
      onClick={cancelTransaction}
      type="secondary"
      className={classnames({
        'transaction-list-item__header-button': !detailsModal,
        'transaction-list-item-details__header-button-rounded-button':
          detailsModal,
      })}
      disabled={!hasEnoughCancelGas}
      data-testid="cancel-button"
    >
      {t('cancel')}
    </Button>
  );
  return hasEnoughCancelGas ? (
    btn
  ) : (
    <Tooltip
      title={t('notEnoughGas')}
      data-testid="not-enough-gas__tooltip"
      position="bottom"
    >
      <div>{btn}</div>
    </Tooltip>
  );
}

CancelButton.propTypes = {
  transaction: PropTypes.object,
  cancelTransaction: PropTypes.func,
  detailsModal: PropTypes.bool,
};
