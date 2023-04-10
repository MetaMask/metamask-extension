import React, { useState, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import BigNumber from 'bignumber.js';
import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box';
import FormField from '../../ui/form-field';
import { Text, ButtonLink } from '../../component-library';
import { Icon, ICON_NAMES } from '../../component-library/icon/deprecated';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  TEXT_ALIGN,
  TextVariant,
  JustifyContent,
  Size,
  BLOCK_SIZES,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { getCustomTokenAmount } from '../../../selectors';
import { setCustomTokenAmount } from '../../../ducks/app/app';
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import {
  MAX_TOKEN_ALLOWANCE_AMOUNT,
  NUM_W_OPT_DECIMAL_COMMA_OR_DOT_REGEX,
  DECIMAL_REGEX,
} from '../../../../shared/constants/tokens';
import { Numeric } from '../../../../shared/modules/Numeric';
import { estimateGas } from '../../../store/actions';
import { getCustomTxParamsData } from '../../../pages/confirm-approve/confirm-approve.util';
import { useGasFeeContext } from '../../../contexts/gasFee';
import { CustomSpendingCapTooltip } from './custom-spending-cap-tooltip';

export default function CustomSpendingCap({
  txParams,
  tokenName,
  currentTokenBalance,
  dappProposedValue,
  siteOrigin,
  passTheErrorText,
  decimals,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const { updateTransaction } = useGasFeeContext();

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
          <Text
            key="custom-spending-cap"
            variant={TextVariant.bodySmBold}
            as="h6"
            className="custom-spending-cap__input-value-and-token-name"
          >
            {replaceCommaToDot(inputNumber)} {tokenName}
          </Text>,
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

  const handleChange = async (valueInput) => {
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

    const newData = getCustomTxParamsData(txParams.data, {
      customPermissionAmount: valueInput,
      decimals,
    });
    const { from, to, value: txValue } = txParams;
    let estimatedGasLimit = await estimateGas({
      from,
      to,
      value: txValue,
      data: newData,
    });
    estimatedGasLimit = addHexPrefix(estimatedGasLimit);
    await updateTransaction({ gasLimit: estimatedGasLimit });
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
        <Text
          key="tooltip-text"
          variant={TextVariant.bodySmBold}
          as="h6"
          color={TextColor.errorDefault}
        >
          <Icon name={ICON_NAMES.WARNING} /> {t('beCareful')}
        </Text>,
      ])
    : t('inputLogicEmptyState');

  return (
    <>
      <Box
        className="custom-spending-cap"
        borderRadius={Size.SM}
        paddingTop={2}
        paddingRight={6}
        paddingLeft={6}
        display={DISPLAY.FLEX}
        alignItems={AlignItems.flexStart}
        flexDirection={FLEX_DIRECTION.COLUMN}
        backgroundColor={BackgroundColor.backgroundAlternative}
        gap={2}
      >
        <Box
          justifyContent={JustifyContent.center}
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
                    size={Size.auto}
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
                size={Size.auto}
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
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.bodySm}
                as="h6"
                paddingTop={2}
                paddingBottom={2}
              >
                {replaceCommaToDot(value)
                  ? customSpendingCapText
                  : inputLogicEmptyStateText}
              </Text>
            </Box>
          </label>
        </Box>
      </Box>
    </>
  );
}

CustomSpendingCap.propTypes = {
  /**
   * Transaction params
   */
  txParams: PropTypes.object,
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
