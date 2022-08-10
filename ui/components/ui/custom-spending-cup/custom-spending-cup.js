import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../box';
import FormField from '../form-field';
import Typography from '../typography';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  SIZES,
} from '../../../helpers/constants/design-system';

export default function CustomSpendingCup({
  tokenName,
  currentTokenBalance,
  dappProposedValue,
}) {
  const t = useContext(I18nContext);
  const [value, setValue] = useState('');
  const [customSpendingCupText, setCustomSpendingCupText] = useState('');
  const [error, setError] = useState('');
  const inputLogicEmptyStateText = t('inputLogicEmptyState');

  const getInputTextLogic = (inputNumber) => {
    if (inputNumber <= currentTokenBalance) {
      return {
        className: 'custom-spending-cup__lowerValue',
        description: t('inputLogicEqualOrSmallerNumber', [
          <span
            key="custom-spending-cup"
            className="custom-spending-cup__input-value-and-token-name"
          >
            {inputNumber} {tokenName}
          </span>,
        ]),
      };
    } else if (inputNumber > currentTokenBalance) {
      return {
        className: 'custom-spending-cup__higherValue',
        description: t('inputLogicHigherNumber'),
      };
    }
    return {
      className: 'custom-spending-cup__emptyState',
      description: t('inputLogicEmptyState'),
    };
  };

  const handleChange = (valueInput) => {
    let spendingCupInvalid = '';
    const inputTextLogic = getInputTextLogic(valueInput);
    const inputTextLogicDescription = inputTextLogic.description;

    if (valueInput < 0 || isNaN(valueInput)) {
      spendingCupInvalid = t('spendingCupInvalid');
      setCustomSpendingCupText('');
      setError(spendingCupInvalid);
    } else {
      setCustomSpendingCupText(inputTextLogicDescription);
      setError('');
    }

    setValue(valueInput);
  };

  const chooseTooltipContentText =
    value > currentTokenBalance
      ? t('warningTooltipText', [
          <Typography
            key="tooltip-text"
            variant={TYPOGRAPHY.H7}
            fontWeight={FONT_WEIGHT.BOLD}
            color={COLORS.ERROR_DEFAULT}
            className="custom-spending-cup__warning-text-colour"
          >
            <i className="fa fa-exclamation-circle" /> {t('beCareful')}
          </Typography>,
        ])
      : t('inputLogicEmptyState');

  return (
    <Box
      className="custom-spending-cup"
      borderRadius={SIZES.SM}
      padding={[4, 2, 6, 2]}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.FLEX_START}
      flexDirection={FLEX_DIRECTION.COLUMN}
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
      gap={2}
    >
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        margin={[4, 6, 4, 6]}
        className="custom-spending-cup__input"
      >
        <FormField
          dataTestId="custom-spending-cup-input"
          autoFocus
          customSpendingCupText={
            value ? customSpendingCupText : inputLogicEmptyStateText
          }
          tooltipIcon={value ? value > currentTokenBalance : ''}
          tooltipContentText={value ? chooseTooltipContentText : ''}
          onChange={handleChange}
          titleText={t('customSpendingCup')}
          placeholder={t('enterANumber')}
          error={error}
          coloredValue={
            value === dappProposedValue && value > currentTokenBalance
          }
          value={value}
          titleDetail={
            <button
              className="custom-spending-cup__input--button"
              type="link"
              onClick={(e) => {
                e.preventDefault();
                handleChange(dappProposedValue);
                setValue(dappProposedValue);
              }}
            >
              {value > currentTokenBalance ? t('edit') : t('useDefault')}
            </button>
          }
          maxButton={
            <button
              className="custom-spending-cup__input--max-button"
              type="link"
              onClick={(e) => {
                e.preventDefault();
                handleChange(currentTokenBalance);
                setValue(currentTokenBalance);
              }}
            >
              {t('max')}
            </button>
          }
        />
      </Box>
    </Box>
  );
}

CustomSpendingCup.propTypes = {
  tokenName: PropTypes.string,
  currentTokenBalance: PropTypes.number,
  dappProposedValue: PropTypes.number,
};
