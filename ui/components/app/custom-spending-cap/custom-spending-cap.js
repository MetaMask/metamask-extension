import React, { useState, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box';

import Typography from '../../ui/typography';
import {
  ButtonLink,
  FormTextField,
  Text,
  Icon,
  TEXT_FIELD_TYPES,
  ICON_NAMES,
} from '../../component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  TypographyVariant,
  JustifyContent,
  Size,
  BLOCK_SIZES,
  BackgroundColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getCustomTokenAmount } from '../../../selectors';
import { setCustomTokenAmount } from '../../../ducks/app/app';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import {
  DECIMAL_REGEX,
  MAX_TOKEN_ALLOWANCE_AMOUNT,
} from '../../../../shared/constants/tokens';
import { CustomSpendingCapTooltip } from './custom-spending-cap-tooltip';

export default function CustomSpendingCap({
  tokenName,
  currentTokenBalance,
  dappProposedValue,
  siteOrigin,
  passTheErrorText,
  decimals,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const value = useSelector(getCustomTokenAmount);

  const [error, setError] = useState('');
  const [showUseDefaultButton, setShowUseDefaultButton] = useState(
    value !== String(dappProposedValue) && true,
  );
  const inputLogicEmptyStateText = t('inputLogicEmptyState');

  const getInputTextLogic = (inputNumber) => {
    if (parseFloat(inputNumber) <= currentTokenBalance) {
      return {
        className: 'custom-spending-cap__lowerValue',
        description: t('inputLogicEqualOrSmallerNumber', [
          <Typography
            key="custom-spending-cap"
            variant={TypographyVariant.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            className="custom-spending-cap__input-value-and-token-name"
          >
            {inputNumber} {tokenName}
          </Typography>,
        ]),
      };
    } else if (parseFloat(inputNumber) > currentTokenBalance) {
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

  const [customSpendingCapText, setCustomSpendingCapText] = useState(
    getInputTextLogic(value).description,
  );

  const handleChange = (e, buttonInput) => {
    const valueInput = e.target.value || buttonInput;
    let spendingCapError = '';
    const inputTextLogic = getInputTextLogic(valueInput);
    const inputTextLogicDescription = inputTextLogic.description;
    const match = DECIMAL_REGEX.exec(valueInput);
    if (match?.[1]?.length > decimals) {
      return;
    }

    if (valueInput < 0 || isNaN(valueInput)) {
      spendingCapError = t('spendingCapError');
      setCustomSpendingCapText(t('spendingCapErrorDescription', [siteOrigin]));
      setError(spendingCapError);
    } else {
      setCustomSpendingCapText(inputTextLogicDescription);
      setError('');
    }

    const maxTokenAmount = calcTokenAmount(
      MAX_TOKEN_ALLOWANCE_AMOUNT,
      decimals,
    );
    if (valueInput) {
      const customSpendLimitNumber = new BigNumber(valueInput);
      if (customSpendLimitNumber.greaterThan(maxTokenAmount)) {
        spendingCapError = t('spendLimitTooLarge');
        setError(spendingCapError);
      }
    }

    dispatch(setCustomTokenAmount(String(valueInput)));
  };

  useEffect(() => {
    if (value !== String(dappProposedValue)) {
      setShowUseDefaultButton(true);
    }
  }, [value, dappProposedValue]);

  useEffect(() => {
    passTheErrorText(error);
  }, [error, passTheErrorText]);

  const chooseTooltipContentText =
    parseFloat(value) > currentTokenBalance
      ? t('warningTooltipText', [
          <Typography
            key="tooltip-text"
            variant={TypographyVariant.H7}
            fontWeight={FONT_WEIGHT.BOLD}
            color={TextColor.errorDefault}
          >
            <Icon name={ICON_NAMES.WARNING} /> {t('beCareful')}
          </Typography>,
        ])
      : t('inputLogicEmptyState');

  let helpText;
  if (value) {
    if (error) {
      helpText = (
        <Box>
          <Box marginBottom={2}>{error}</Box> <Box>{customSpendingCapText}</Box>
        </Box>
      );
    } else {
      helpText = customSpendingCapText;
    }
  } else {
    helpText = inputLogicEmptyStateText;
  }

  return (
    <>
      <Box
        className="custom-spending-cap"
        borderRadius={Size.SM}
        paddingTop={4}
        paddingRight={6}
        paddingLeft={6}
        display={DISPLAY.FLEX}
        alignItems={AlignItems.flexStart}
        flexDirection={FLEX_DIRECTION.COLUMN}
        backgroundColor={BackgroundColor.backgroundAlternative}
        gap={2}
      >
        <Box
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.spaceBetween}
          className="custom-spending-cap__input"
        >
          <FormTextField
            id={
              parseFloat(value) > currentTokenBalance || error
                ? 'custom-spending-cap-input-value'
                : 'custom-spending-cap'
            }
            className="custom-spending-cap__input__text"
            placeholder={t('enterANumber')}
            value={value}
            error={error}
            onChange={handleChange}
            label={
              <Box
                justifyContent={JustifyContent.spaceBetween}
                display={DISPLAY.FLEX}
                width={BLOCK_SIZES.FULL}
                marginBottom={2}
              >
                <Text variant={TextVariant.bodyMdBold}>
                  <span>{t('customSpendingCap')} </span>
                  <CustomSpendingCapTooltip
                    tooltipContentText={value ? chooseTooltipContentText : ''}
                    tooltipIcon={
                      value ? parseFloat(value) > currentTokenBalance : ''
                    }
                  />
                </Text>
                {showUseDefaultButton && (
                  <ButtonLink
                    size={Size.auto}
                    onClick={(e) => {
                      setShowUseDefaultButton(false);
                      handleChange(e, dappProposedValue);
                    }}
                  >
                    {t('useDefault')}
                  </ButtonLink>
                )}
              </Box>
            }
            endAccessory={
              <ButtonLink
                size={Size.auto}
                onClick={(e) => {
                  e.preventDefault();
                  handleChange(e, currentTokenBalance);
                }}
              >
                {t('max')}
              </ButtonLink>
            }
            marginBottom={4}
            type={TEXT_FIELD_TYPES.NUMBER}
            helpText={helpText}
            helpTextProps={{ variant: TextVariant.bodySm, marginTop: 3 }}
          />
        </Box>
      </Box>
    </>
  );
}

CustomSpendingCap.propTypes = {
  /**
   * Displayed the token name currently tracked in description related to the input state
   */
  tokenName: PropTypes.string,
  /**
   * The current token balance of the token
   */
  currentTokenBalance: PropTypes.string,
  /**
   * The dapp suggested amount
   */
  dappProposedValue: PropTypes.string,
  /**
   * The origin of the site generally the URL
   */
  siteOrigin: PropTypes.string,
  /**
   * Parent component's callback function passed in order to get the error text
   */
  passTheErrorText: PropTypes.func,
  /**
   * Number of decimals
   */
  decimals: PropTypes.string,
};
