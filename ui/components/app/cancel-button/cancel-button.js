import Tooltip from '@material-ui/core/Tooltip';
import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { TransactionStatus } from '@metamask/transaction-controller';
import { Button, ButtonVariant } from '../../component-library';
import { getMaximumGasTotalInHexWei } from '../../../../shared/modules/gas.utils';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useIncrementedGasFees } from '../../../pages/confirmations/hooks/useIncrementedGasFees';
import { isBalanceSufficient } from '../../../pages/confirmations/send-legacy/send.utils';
import { getSelectedAccount } from '../../../selectors';

export default function CancelButton({
  cancelTransaction,
  transaction,
  detailsModal,
}) {
  const t = useI18nContext();
  const { status } = transaction;
  const customCancelGasSettings = useIncrementedGasFees(transaction);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);

  const isDisabled =
    status === TransactionStatus.approved
      ? false
      : !isBalanceSufficient({
          amount: '0x0',
          gasTotal: getMaximumGasTotalInHexWei(customCancelGasSettings),
          balance: selectedAccount.balance,
          conversionRate,
        });

  const btn = (
    <Button
      onClick={cancelTransaction}
      variant={ButtonVariant.Secondary}
      block
      className={classnames({
        'transaction-list-item__header-button': !detailsModal,
        'transaction-list-item-details__header-button-rounded-button':
          detailsModal,
      })}
      disabled={isDisabled}
      data-testid="cancel-button"
    >
      {t('cancel')}
    </Button>
  );
  return isDisabled ? (
    <Tooltip
      title={t('notEnoughGas')}
      data-testid="not-enough-gas__tooltip"
      position="bottom"
    >
      <div>{btn}</div>
    </Tooltip>
  ) : (
    btn
  );
}

CancelButton.propTypes = {
  transaction: PropTypes.object,
  cancelTransaction: PropTypes.func,
  detailsModal: PropTypes.bool,
};
