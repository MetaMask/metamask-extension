import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box';
import FormField from '../../ui/form-field';
import Typography from '../../ui/typography';
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
import { CustomSpendingCapTooltip } from './custom-spending-cap-tooltip';

export default function CustomSpendingCap({
  tokenName,
  currentTokenBalance,
  dappProposedValue,
  onEdit,
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

  const customSpendingCapMarginProps = {
    marginBottom: 2,
    marginRight: 0,
  };

  return (
    <Box
      className="custom-spending-cap"
      borderRadius={SIZES.SM}
      paddingTop={2}
      paddingRight={6}
      paddingLeft={6}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.FLEX_START}
      flexDirection={FLEX_DIRECTION.COLUMN}
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
      gap={2}
    >
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        display={DISPLAY.BLOCK}
        className="custom-spending-cap__input"
      >
        <label htmlFor="custom-spending-cap">
          <FormField
            dataTestId="custom-spending-cap-input"
            autoFocus
            wrappingLabelProps={{ as: 'div' }}
            id="custom-spending-cap"
            customSpendingCapText={
              value ? customSpendingCapText : inputLogicEmptyStateText
            }
            TooltipCustomComponent={
              <CustomSpendingCapTooltip
                tooltipContentText={value ? chooseTooltipContentText : ''}
                tooltipIcon={value ? value > currentTokenBalance : ''}
              />
            }
            onChange={handleChange}
            titleText={t('customSpendingCap')}
            placeholder={t('enterANumber')}
            error={error}
            coloredValue={value > currentTokenBalance}
            value={value}
            titleDetail={
              <button
                className="custom-spending-cap__input--button"
                type="link"
                onClick={(e) => {
                  e.preventDefault();
                  if (value <= currentTokenBalance) {
                    handleChange(dappProposedValue);
                    setValue(dappProposedValue);
                  } else {
                    onEdit();
                  }
                }}
              >
                {value > currentTokenBalance ? t('edit') : t('useDefault')}
              </button>
            }
            titleDetailWrapperProps={customSpendingCapMarginProps}
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
        </label>
      </Box>
    </Box>
  );
}

CustomSpendingCap.propTypes = {
  tokenName: PropTypes.string,
  currentTokenBalance: PropTypes.number,
  dappProposedValue: PropTypes.number,
  onEdit: PropTypes.func,
};
