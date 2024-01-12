import React, { useState, useContext, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { addHexPrefix } from 'ethereumjs-util';
import { I18nContext } from '../../../contexts/i18n';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
  Size,
  BackgroundColor,
  TextColor,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  Text,
  TextField,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Label,
  HelpText,
  Box,
} from '../../component-library';
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
          <Icon name={IconName.Danger} size={IconSize.Inherit} />{' '}
          {t('beCareful')}
        </Text>,
      ])
    : t('inputLogicEmptyState');

  return (
    <>
      <Box
        className="custom-spending-cap"
        display={Display.Flex}
        alignItems={AlignItems.flexStart}
        flexDirection={FlexDirection.Column}
        gap={2}
        padding={4}
        backgroundColor={BackgroundColor.backgroundAlternative}
        borderRadius={Size.SM}
      >
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={1}
          width={BlockSize.Full}
        >
          <div>
            <Label
              htmlFor="custom-spending-cap"
              display={Display.Inline}
              marginRight={1}
            >
              {t('customSpendingCap')}
            </Label>
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
          </div>
          {showUseSiteSuggestionButton && (
            <ButtonLink
              marginLeft="auto"
              size={Size.auto}
              onClick={(e) => {
                e.preventDefault();
                setShowUseSiteSuggestionButton(false);
                handleChange(dappProposedValue);
              }}
            >
              {t('useSiteSuggestion')}
            </ButtonLink>
          )}
        </Box>
        <TextField
          inputRef={inputRef}
          inputProps={{
            'data-testid': 'custom-spending-cap-input',
            color: decConversionGreaterThan(
              customSpendingCap,
              currentTokenBalance,
            )
              ? TextColor.errorDefault
              : TextColor.textDefault,
            paddingInlineEnd: 4,
          }}
          id="custom-spending-cap"
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t('enterANumber')}
          value={customSpendingCap}
          endAccessory={
            <ButtonLink
              onClick={(e) => {
                e.preventDefault();
                handleChange(currentTokenBalance);
              }}
              data-testid="custom-spending-cap-max-button"
            >
              {t('max')}
            </ButtonLink>
          }
          width={BlockSize.Full}
        />
        <HelpText
          color={error ? TextColor.errorDefault : TextColor.textDefault}
          variant={TextVariant.bodySm}
        >
          {error ||
            (replaceCommaToDot(customSpendingCap)
              ? customSpendingCapText
              : inputLogicEmptyStateText)}
        </HelpText>
        <ButtonLink
          size={Size.SM}
          href={ZENDESK_URLS.TOKEN_ALLOWANCE_WITH_SPENDING_CAP}
          externalLink
        >
          {t('learnMoreUpperCase')}
        </ButtonLink>
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
