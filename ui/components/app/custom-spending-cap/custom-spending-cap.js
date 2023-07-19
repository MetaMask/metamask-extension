import React, { useState, useContext, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import BigNumber from 'bignumber.js';
import { addHexPrefix } from 'ethereumjs-util';

import { I18nContext } from '../../../contexts/i18n';
import Box from '../../ui/box';
import FormField from '../../ui/form-field';
import { ButtonLink, Icon, IconName, Text } from '../../component-library';

import {
  AlignItems,
  TextAlign,
  TextVariant,
  JustifyContent,
  Size,
  BLOCK_SIZES,
  BackgroundColor,
  TextColor,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { setCustomTokenAmount } from '../../../ducks/app/app';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import {
  MAX_TOKEN_ALLOWANCE_AMOUNT,
  NUM_W_OPT_DECIMAL_COMMA_OR_DOT_REGEX,
  DECIMAL_REGEX,
} from '../../../../shared/constants/tokens';
import { Numeric } from '../../../../shared/modules/Numeric';
import { estimateGas } from '../../../store/actions';
import { getCustomTxParamsData } from '../../../pages/confirm-approve/confirm-approve.util';
import { useGasFeeContext } from '../../../contexts/gasFee';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { CustomSpendingCapTooltip } from './custom-spending-cap-tooltip';

export default function CustomSpendingCap({
  txParams,
  tokenName,
  currentTokenBalance,
  dappProposedValue,
  siteOrigin,
  passTheErrorText,
  decimals,
  setInputChangeInProgress,
  customSpendingCap,
  setCustomSpendingCap,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const { updateTransaction } = useGasFeeContext();
  const inputRef = useRef(null);

  const [error, setError] = useState('');
  const [showUseSiteSuggestionButton, setShowUseSiteSuggestionButton] =
    useState(customSpendingCap !== String(dappProposedValue) && true);
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
            as="span"
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
    getInputTextLogic(customSpendingCap).description,
  );

  const handleChange = async (valueInput) => {
    if (!txParams) {
      return;
    }
    setInputChangeInProgress(true);
    let spendingCapError = '';
    const inputTextLogic = getInputTextLogic(valueInput);
    const inputTextLogicDescription = inputTextLogic.description;
    const match = DECIMAL_REGEX.exec(replaceCommaToDot(valueInput));
    if (match?.[1]?.length > decimals) {
      setInputChangeInProgress(false);
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
    setCustomSpendingCap(String(valueInput));
    dispatch(setCustomTokenAmount(String(valueInput)));

    if (String(valueInput) !== '') {
      try {
        const newData = getCustomTxParamsData(txParams.data, {
          customPermissionAmount: valueInput,
          decimals,
        });
        const { from, to, value: txValue } = txParams;
        const estimatedGasLimit = await estimateGas({
          from,
          to,
          value: txValue,
          data: newData,
        });
        if (estimatedGasLimit) {
          await updateTransaction({
            gasLimit: hexToDecimal(addHexPrefix(estimatedGasLimit)),
          });
        }
      } catch (exp) {
        console.error('Error in trying to update gas limit', exp);
      }
    }

    setInputChangeInProgress(false);
  };

  useEffect(() => {
    if (customSpendingCap === String(dappProposedValue)) {
      setShowUseSiteSuggestionButton(false);
    } else {
      setShowUseSiteSuggestionButton(true);
    }
  }, [customSpendingCap, dappProposedValue]);

  useEffect(() => {
    passTheErrorText(error);
  }, [error, passTheErrorText]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus({
        preventScroll: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef.current]);

  const chooseTooltipContentText = decConversionGreaterThan(
    customSpendingCap,
    currentTokenBalance,
  )
    ? t('warningTooltipText', [
        <Text
          key="tooltip-text"
          variant={TextVariant.bodySmBold}
          as="span"
          color={TextColor.errorDefault}
        >
          <Icon name={IconName.Warning} /> {t('beCareful')}
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
        display={Display.Flex}
        alignItems={AlignItems.flexStart}
        flexDirection={FlexDirection.Column}
        backgroundColor={BackgroundColor.backgroundAlternative}
        gap={2}
      >
        <Box
          justifyContent={JustifyContent.center}
          display={Display.Block}
          className="custom-spending-cap__input"
        >
          <label
            htmlFor={
              decConversionGreaterThan(customSpendingCap, currentTokenBalance)
                ? 'custom-spending-cap-input-value'
                : 'custom-spending-cap'
            }
          >
            <FormField
              inputRef={inputRef}
              dataTestId="custom-spending-cap-input"
              wrappingLabelProps={{ as: 'div' }}
              id={
                decConversionGreaterThan(customSpendingCap, currentTokenBalance)
                  ? 'custom-spending-cap-input-value'
                  : 'custom-spending-cap'
              }
              TooltipCustomComponent={
                <CustomSpendingCapTooltip
                  tooltipContentText={
                    replaceCommaToDot(customSpendingCap)
                      ? chooseTooltipContentText
                      : ''
                  }
                  tooltipIcon={
                    replaceCommaToDot(customSpendingCap)
                      ? decConversionGreaterThan(
                          customSpendingCap,
                          currentTokenBalance,
                        )
                      : ''
                  }
                />
              }
              onChange={handleChange}
              titleText={t('customSpendingCap')}
              placeholder={t('enterANumber')}
              error={error}
              value={customSpendingCap}
              titleDetail={
                showUseSiteSuggestionButton && (
                  <ButtonLink
                    size={Size.auto}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowUseSiteSuggestionButton(false);
                      handleChange(dappProposedValue);
                    }}
                  >
                    {t('useSiteSuggestion')}
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
              textAlign={TextAlign.End}
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
              >
                {replaceCommaToDot(customSpendingCap)
                  ? customSpendingCapText
                  : inputLogicEmptyStateText}
              </Text>
              <ButtonLink
                size={Size.SM}
                href={ZENDESK_URLS.TOKEN_ALLOWANCE_WITH_SPENDING_CAP}
                target="_blank"
                marginBottom={2}
              >
                {t('learnMoreUpperCase')}
              </ButtonLink>
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
  txParams: PropTypes.object.isRequired,
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
  /**
   * Updating input state to changing
   */
  setInputChangeInProgress: PropTypes.func.isRequired,
  /**
   * Custom token amount or The dapp suggested amount
   */
  customSpendingCap: PropTypes.string,
  /**
   * State method to update the custom token value
   */
  setCustomSpendingCap: PropTypes.func.isRequired,
};
