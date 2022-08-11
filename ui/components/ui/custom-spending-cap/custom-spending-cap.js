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

export default function CustomSpendingCap({
  tokenName,
  currentTokenBalance,
  dappProposedValue,
}) {
  const t = useContext(I18nContext);
  const [value, setValue] = useState('');
  const [customSpendingCapText, setCustomSpendingCapText] = useState('');
  const [error, setError] = useState('');
  const inputLogicEmptyStateText = t('inputLogicEmptyState');

  const getInputTextLogic = (inputNumber) => {
    if (inputNumber <= currentTokenBalance) {
      return {
        className: 'custom-spending-cap__lowerValue',
        description: t('inputLogicEqualOrSmallerNumber', [
          <Typography
            key="custom-spending-cap"
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            className="custom-spending-cap__input-value-and-token-name"
          >
            {inputNumber} {tokenName}
          </Typography>,
        ]),
      };
    } else if (inputNumber > currentTokenBalance) {
      return {
        className: 'custom-spending-cap__higherValue',
        description: t('inputLogicHigherNumber'),
      };
    }
    return {
      className: 'custom-spending-cap__emptyState',
      description: t('inputLogicEmptyState'),
    };
  };

  const handleChange = (valueInput) => {
    let spendingCapInvalid = '';
    const inputTextLogic = getInputTextLogic(valueInput);
    const inputTextLogicDescription = inputTextLogic.description;

    if (valueInput < 0 || isNaN(valueInput)) {
      spendingCapInvalid = t('spendingCapInvalid');
      setCustomSpendingCapText('');
      setError(spendingCapInvalid);
    } else {
      setCustomSpendingCapText(inputTextLogicDescription);
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
            color={COLORS.WARNING_DEFAULT}
          >
            <i className="fa fa-exclamation-circle" /> {t('beCareful')}
          </Typography>,
        ])
      : t('inputLogicEmptyState');

  return (
    <Box
      className="custom-spending-cap"
      borderRadius={SIZES.SM}
      paddingTop={4}
      paddingRight={2}
      paddingLeft={2}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.FLEX_START}
      flexDirection={FLEX_DIRECTION.COLUMN}
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
      gap={2}
    >
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        marginTop={4}
        marginRight={6}
        marginLeft={6}
        marginBottom={4}
        className="custom-spending-cap__input"
      >
        <FormField
          dataTestId="custom-spending-cap-input"
          autoFocus
          customSpendingCapText={
            value ? customSpendingCapText : inputLogicEmptyStateText
          }
          tooltipIcon={value ? value > currentTokenBalance : ''}
          tooltipContentText={value ? chooseTooltipContentText : ''}
          onChange={handleChange}
          titleText={t('customSpendingCap')}
          placeholder={t('enterANumber')}
          error={error}
          coloredValue={
            value === dappProposedValue && value > currentTokenBalance
          }
          value={value}
          titleDetail={
            <button
              className="custom-spending-cap__input--button"
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
              className="custom-spending-cap__input--max-button"
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

CustomSpendingCap.propTypes = {
  tokenName: PropTypes.string,
  currentTokenBalance: PropTypes.number,
  dappProposedValue: PropTypes.number,
};
