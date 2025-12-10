import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../../shared/constants/gas';
import { PRIORITY_LEVEL_ICON_MAP } from '../../../../../helpers/constants/gas';
import { PRIMARY } from '../../../../../helpers/constants/common';
import { toHumanReadableTime } from '../../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTransactionEventFragment } from '../../../hooks/useTransactionEventFragment';
import { useTransactionModalContext } from '../../../../../contexts/transaction-modal';
import InfoTooltip from '../../../../../components/ui/info-tooltip';
import LoadingHeartBeat from '../../../../../components/ui/loading-heartbeat';
import UserPreferencedCurrencyDisplay from '../../../../../components/app/user-preferenced-currency-display';
import EditGasToolTip from '../edit-gas-tooltip/edit-gas-tooltip';
import { Box, Text } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

import { useGasItemFeeDetails } from './useGasItemFeeDetails';

const getTitleAndIcon = (priorityLevel, editGasMode) => {
  let icon = priorityLevel;
  let title = priorityLevel;
  if (priorityLevel === PriorityLevels.dAppSuggested) {
    title = 'dappSuggestedShortLabel';
  } else if (priorityLevel === PriorityLevels.dappSuggestedHigh) {
    title = 'dappSuggestedHighShortLabel';
  } else if (priorityLevel === PriorityLevels.tenPercentIncreased) {
    icon = null;
    title = 'tenPercentIncreased';
  } else if (
    priorityLevel === PriorityLevels.high &&
    editGasMode === EditGasModes.swaps
  ) {
    icon = 'swapSuggested';
    title = 'swapSuggested';
  }
  return {
    title,
    icon,
  };
};

const EditGasItem = ({ priorityLevel }) => {
  const {
    editGasMode,
    estimateUsed,
    gasLimit,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingDAPPSuggestedValues,
    updateTransactionUsingEstimate,
    transaction,
  } = useGasFeeContext();
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const t = useI18nContext();
  const { closeModal, openModal } = useTransactionModalContext();
  const { dappSuggestedGasFees } = transaction;

  const {
    // for cancel or speedup estimateGreaterThaGasUse is true if previous gas used
    // was more than estimate for the priorityLevel
    estimateGreaterThanGasUse,
    hexMaximumTransactionFee,
    maxFeePerGas,
    maxPriorityFeePerGas,
    minWaitTime,
  } = useGasItemFeeDetails(priorityLevel);

  if (
    priorityLevel === PriorityLevels.dAppSuggested &&
    !dappSuggestedGasFees?.maxFeePerGas &&
    !dappSuggestedGasFees?.gasPrice
  ) {
    return null;
  }

  const onOptionSelect = () => {
    if (priorityLevel === PriorityLevels.custom) {
      updateTransactionEventFragment({
        properties: {
          gas_edit_attempted: 'advanced',
        },
      });
      openModal('advancedGasFee');
    } else {
      updateTransactionEventFragment({
        properties: {
          gas_edit_type: 'basic',
        },
      });

      closeModal(['editGasFee']);

      if (priorityLevel === PriorityLevels.tenPercentIncreased) {
        updateTransactionToTenPercentIncreasedGasFee();
      } else if (priorityLevel === PriorityLevels.dAppSuggested) {
        updateTransactionUsingDAPPSuggestedValues();
      } else {
        updateTransactionUsingEstimate(priorityLevel);
      }
    }
  };

  const { title, icon } = getTitleAndIcon(priorityLevel, editGasMode);

  return (
    <Box
      as="button"
      className={classNames('edit-gas-item', {
        'edit-gas-item--selected': priorityLevel === estimateUsed,
        'edit-gas-item--disabled': estimateGreaterThanGasUse,
      })}
      onClick={onOptionSelect}
      aria-label={priorityLevel}
      autoFocus={priorityLevel === estimateUsed}
      disabled={estimateGreaterThanGasUse}
      data-testid={`edit-gas-fee-item-${priorityLevel}`}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.SpaceBetween}
      alignItems="center"
      width="100%"
      padding={0}
      border="none"
      backgroundColor="transparent"
      style={{ cursor: estimateGreaterThanGasUse ? 'not-allowed' : 'pointer' }}
    >
      <Box
        className="edit-gas-item__name"
        display={Display.Flex}
        alignItems="center"
        gap={2}
      >
        {icon && (
          <Box
            className={`edit-gas-item__icon edit-gas-item__icon-${priorityLevel}`}
          >
            {PRIORITY_LEVEL_ICON_MAP[icon]}
          </Box>
        )}
        <Text variant={TextVariant.bodySm}>{t(title)}</Text>
      </Box>
      <Text
        className={`edit-gas-item__time-estimate edit-gas-item__time-estimate-${priorityLevel}`}
        variant={TextVariant.bodySm}
      >
        {editGasMode !== EditGasModes.swaps &&
          (minWaitTime ? toHumanReadableTime(t, minWaitTime) : '--')}
      </Text>
      <Box
        className={`edit-gas-item__fee-estimate edit-gas-item__fee-estimate-${priorityLevel}`}
        display={Display.Flex}
        alignItems="center"
      >
        {hexMaximumTransactionFee ? (
          <Box
            className="edit-gas-item__maxfee"
            display={Display.Flex}
            alignItems="center"
          >
            <LoadingHeartBeat
              backgroundColor={
                priorityLevel === estimateUsed
                  ? 'var(--color-background-alternative)'
                  : 'var(--color-background-default)'
              }
              estimateUsed={priorityLevel}
            />
            <UserPreferencedCurrencyDisplay
              key="editGasSubTextFeeAmount"
              type={PRIMARY}
              value={hexMaximumTransactionFee}
            />
          </Box>
        ) : (
          <Text variant={TextVariant.bodySm}>--</Text>
        )}
      </Box>
      <Box className="edit-gas-item__tooltip" data-testid="gas-tooltip">
        <InfoTooltip
          contentText={
            <EditGasToolTip
              t={t}
              priorityLevel={priorityLevel}
              maxFeePerGas={maxFeePerGas}
              maxPriorityFeePerGas={maxPriorityFeePerGas}
              editGasMode={editGasMode}
              gasLimit={gasLimit}
              transaction={transaction}
              estimateGreaterThanGasUse={estimateGreaterThanGasUse}
            />
          }
          position="top"
        />
      </Box>
    </Box>
  );
};

EditGasItem.propTypes = {
  priorityLevel: PropTypes.string,
};

export default EditGasItem;
