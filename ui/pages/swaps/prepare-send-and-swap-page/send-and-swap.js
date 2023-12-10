import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { isEqual, shuffle } from 'lodash';
import { getSelectedAccount, getTokenList } from '../../../selectors';
import useSwapsData from './useSwapsData';
import PrepareSendAndSwapPage from './prepare-send-and-swap-page';

const SendAndSwap = () => {
  const selectedAccount = useSelector(getSelectedAccount, shallowEqual);
  const { balance: ethBalance, address: selectedAccountAddress } =
    selectedAccount;
  const tokenList = useSelector(getTokenList, isEqual);
  const shuffledTokensList = shuffle(Object.values(tokenList));

  useSwapsData();

  return (
    <PrepareSendAndSwapPage
      ethBalance={ethBalance}
      selectedAccountAddress={selectedAccountAddress}
      shuffledTokensList={shuffledTokensList}
    />
  );
};

export default SendAndSwap;
