import React, { useState, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import BigNumber from 'bignumber.js';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box';
import FormField from '../../ui/form-field';
import Typography from '../../ui/typography';
import { ButtonLink } from '../../component-library';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  FLEX_DIRECTION,
  TEXT_ALIGN,
  FONT_WEIGHT,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  SIZES,
  BLOCK_SIZES,
} from '../../../helpers/constants/design-system';
import { getCustomTokenAmount } from '../../../selectors';
import { setCustomTokenAmount } from '../../../ducks/app/app';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import {
  MAX_TOKEN_ALLOWANCE_AMOUNT,
  NUM_W_OPT_DECIMAL_COMMA_OR_DOT_REGEX,
  DECIMAL_REGEX,
} from '../../../../shared/constants/tokens';
import { Numeric } from '../../../../shared/modules/Numeric';
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

  const replaceCommaToDot = (inputValue) => {
    return inputValue.replace(/,/gu, '.');
  };

  const decConversionGreaterThan = (tokenValue, tokenBalance) => {
    return new Numeric(Number(replaceCommaToDot(tokenValue)), 10).greaterThan(
      Number(tokenBalance),
      10,
    );
  };

  const getInputTextLogic = (inputNumber) => {
    if (
      new Numeric(Number(replaceCommaToDot(inputNumber)), 10).lessThanOrEqualTo(
        new Numeric(Number(currentTokenBalance), 10),
      )
    ) {
      return {
        className: 'custom-spending-cap__lowerValue',
        description: t('inputLogicEqualOrSmallerNumber', [
          <Typography
            key="custom-spending-cap"
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            className="custom-spending-cap__input-value-and-token-name"
          >
            {replaceCommaToDot(inputNumber)} {tokenName}
          </Typography>,
        ]),
      };
    } else if (decConversionGreaterThan(inputNumber, currentTokenBalance)) {
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

  const handleChange = (valueInput) => {
    let spendingCapError = '';
    const inputTextLogic = getInputTextLogic(valueInput);
    const inputTextLogicDescription = inputTextLogic.description;
    const match = DECIMAL_REGEX.exec(replaceCommaToDot(valueInput));
    if (match?.[1]?.length > decimals) {
      return;
    }

    if (valueInput && !NUM_W_OPT_DECIMAL_COMMA_OR_DOT_REGEX.test(valueInput)) {
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
    if (Number(valueInput.length) > 1 && Number(valueInput)) {
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

  const chooseTooltipContentText = decConversionGreaterThan(
    value,
    currentTokenBalance,
  )
    ? t('warningTooltipText', [
        <Typography
          key="tooltip-text"
          variant={TYPOGRAPHY.H7}
          fontWeight={FONT_WEIGHT.BOLD}
          color={COLORS.ERROR_DEFAULT}
        >
          <i className="fa fa-exclamation-circle" /> {t('beCareful')}
        </Typography>,
      ])
    : t('inputLogicEmptyState');

  return (
    <>
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
          <label
            htmlFor={
              decConversionGreaterThan(value, currentTokenBalance)
                ? 'custom-spending-cap-input-value'
                : 'custom-spending-cap'
            }
          >
            <FormField
              dataTestId="custom-spending-cap-input"
              autoFocus
              wrappingLabelProps={{ as: 'div' }}
              id={
                decConversionGreaterThan(value, currentTokenBalance)
                  ? 'custom-spending-cap-input-value'
                  : 'custom-spending-cap'
              }
              TooltipCustomComponent={
                <CustomSpendingCapTooltip
                  tooltipContentText={
                    replaceCommaToDot(value) ? chooseTooltipContentText : ''
                  }
                  tooltipIcon={
                    replaceCommaToDot(value)
                      ? decConversionGreaterThan(value, currentTokenBalance)
                      : ''
                  }
                />
              }
              onChange={handleChange}
              titleText={t('customSpendingCap')}
              placeholder={t('enterANumber')}
              error={error}
              value={value}
              titleDetail={
                showUseDefaultButton && (
                  <ButtonLink
                    size={SIZES.AUTO}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowUseDefaultButton(false);
                      handleChange(dappProposedValue);
                    }}
                  >
                    {t('useDefault')}
                  </ButtonLink>
                )
              }
              titleDetailWrapperProps={{ marginBottom: 2, marginRight: 0 }}
            />
            <Box
              width={BLOCK_SIZES.MAX}
              marginLeft="auto"
              paddingRight={4}
              paddingBottom={2}
              textAlign={TEXT_ALIGN.END}
              className={classnames('custom-spending-cap__max', {
                'custom-spending-cap__max--with-error-message': error,
              })}
            >
              <ButtonLink
                size={SIZES.AUTO}
                onClick={(e) => {
                  e.preventDefault();
                  handleChange(currentTokenBalance);
                }}
              >
                {t('max')}
              </ButtonLink>
            </Box>
            <Box
              className={classnames('custom-spending-cap__description', {
                'custom-spending-cap__description--with-error-message': error,
              })}
            >
              <Typography
                color={COLORS.TEXT_DEFAULT}
                variant={TYPOGRAPHY.H7}
                boxProps={{ paddingTop: 2, paddingBottom: 2 }}
              >
                {replaceCommaToDot(value)
                  ? customSpendingCapText
                  : inputLogicEmptyStateText}
              </Typography>
            </Box>
          </label>
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
