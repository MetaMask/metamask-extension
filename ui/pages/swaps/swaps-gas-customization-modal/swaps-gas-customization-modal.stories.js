import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { formatETHFee } from '../../../helpers/utils/formatters';
import {
  addHexes,
  getValueFromWeiHex,
  getWeiHexFromDecimalValue,
  sumHexWEIsToRenderableFiat,
} from '../../../helpers/utils/conversions.util';
import { ETH } from '../../../helpers/constants/common';
import { calcGasTotal, isBalanceSufficient } from '../../send/send.utils';
import { conversionLessThan } from '../../../../shared/modules/conversion.utils';
import GasModalPageContainer from './swaps-gas-customization-modal.component';
// Using Test Data For Redux
const store = configureStore(testData);

export default {
  title: 'Pages/Swaps/GasModalPageContainer',
  id: __filename,
  component: GasModalPageContainer,
  argTypes: {
    sendAmountArg: {
      name: 'Send Amount (this should be static)',
      control: { type: 'number', min: 0, step: 0.01 },
    },
    walletBalance: {
      name: 'Wallet Balance (this should be static)',
      control: { type: 'number', min: 0, step: 0.01 },
    },
    averageGasPrice: {
      name: 'Average Gas Price',
      control: { type: 'number', min: 0, step: 0.01 },
    },
    insufficientBalance: {
      table: {
        disable: true,
      },
    },
    gasPriceButtonGroupProps: {
      table: {
        disable: true,
      },
    },
    infoRowProps: {
      table: {
        disable: true,
      },
    },
    onSubmit: {
      table: {
        disable: true,
      },
    },
    cancelAndClose: {
      table: {
        disable: true,
      },
    },
    showCustomPriceTooLowWarning: {
      table: {
        disable: true,
      },
    },
    disableSave: {
      table: {
        disable: true,
      },
    },
    customGasLimitMessage: {
      table: {
        disable: true,
      },
    },
    usdConversionRate: {
      table: {
        disable: true,
      },
    },
    customGasPrice: {
      table: {
        disable: true,
      },
    },
    customGasLimit: {
      table: {
        disable: true,
      },
    },
    setSwapsCustomizationModalLimit: {
      table: {
        disable: true,
      },
    },
    setSwapsCustomizationModalPrice: {
      table: {
        disable: true,
      },
    },
    customTotalSupplement: {
      table: {
        disable: true,
      },
    },
    gasEstimateLoadingHasFailed: {
      table: {
        disable: true,
      },
    },
    minimumGasLimit: {
      table: {
        disable: true,
      },
    },
  },
  args: {
    sendAmountArg: 0.01,
    walletBalance: 10,
    averageGasPrice: 2,
  },
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

// Convert Hex Wei to Decimal ETH
const sumHexWEIsToRenderableEth = (hexWEIs, currencySymbol = 'ETH') => {
  const hexWEIsSum = hexWEIs.filter(Boolean).reduce(addHexes);
  return formatETHFee(
    getValueFromWeiHex({
      value: hexWEIsSum,
      fromCurrency: currencySymbol,
      toCurrency: currencySymbol,
      numberOfDecimals: 6,
    }),
    currencySymbol,
  );
};

export const DefaultStory = (args) => {
  const { sendAmountArg, walletBalance, averageGasPrice } = args;

  const hexWei = getWeiHexFromDecimalValue({
    value: sendAmountArg,
    fromCurrency: ETH,
    fromDenomination: ETH,
  });

  // ETH Balance
  const balanceHexWei = getWeiHexFromDecimalValue({
    value: walletBalance,
    fromCurrency: ETH,
    fromDenomination: ETH,
  });

  const sendAmount = sumHexWEIsToRenderableEth([hexWei, '0x0']);
  const [gasLimit, setGasLimit] = useState('5208');
  const [gasPrice, setGasPrice] = useState('ee6b2800');
  const [transactionFee, setTransactionFee] = useState('');
  const [totalETH, setTotalETH] = useState('');
  const [totalFiat, setTotalFiat] = useState('');
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false);

  const { metamask } = store.getState();
  const { currentCurrency, conversionRate } = metamask;

  useEffect(() => {
    // Transfer Fee
    const customGasTotal = calcGasTotal(gasLimit, gasPrice);
    setTransactionFee(sumHexWEIsToRenderableEth(['0x0', customGasTotal]));

    // New Total ETH
    setTotalETH(sumHexWEIsToRenderableEth([hexWei, customGasTotal, '']));

    // New Total Fiat
    setTotalFiat(
      sumHexWEIsToRenderableFiat(
        [hexWei, customGasTotal, ''],
        currentCurrency,
        conversionRate,
      ),
    );

    // Check If Balance is Sufficient
    setIsInsufficientBalance(
      !isBalanceSufficient({
        amount: hexWei,
        gasTotal: customGasTotal,
        balance: balanceHexWei,
        conversionRate,
      }),
    );
  }, [
    gasPrice,
    gasLimit,
    hexWei,
    totalETH,
    conversionRate,
    currentCurrency,
    totalFiat,
    balanceHexWei,
  ]);

  // Check If Gas Price Is Too Low
  const shouldShowCustomPriceTooLowWarning = () => {
    const customGasPrice = gasPrice;

    if (!customGasPrice || averageGasPrice === undefined) {
      return false;
    }

    const customPriceRisksSwapFailure = conversionLessThan(
      {
        value: customGasPrice,
        fromNumericBase: 'hex',
        fromDenomination: 'WEI',
        toDenomination: 'GWEI',
      },
      { value: averageGasPrice, fromNumericBase: 'dec' },
    );

    return customPriceRisksSwapFailure;
  };

  return (
    <GasModalPageContainer
      insufficientBalance={isInsufficientBalance}
      showCustomPriceTooLowWarning={shouldShowCustomPriceTooLowWarning()}
      minimumGasLimit={21000}
      infoRowProps={{
        sendAmount,
        transactionFee,
        newTotalEth: totalETH,
        newTotalFiat: totalFiat,
      }}
      gasPriceButtonGroupProps={{
        buttonDataLoading: true,
      }}
      setSwapsCustomizationModalPrice={(newPrice) => {
        setGasPrice(newPrice);
      }}
      setSwapsCustomizationModalLimit={(newLimit) => {
        setGasLimit(newLimit);
      }}
      customGasPrice={gasPrice}
      customGasLimit={gasLimit}
      disableSave={
        isInsufficientBalance || shouldShowCustomPriceTooLowWarning()
      }
    />
  );
};

DefaultStory.storyName = 'Default';
