import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { isEqual, shuffle } from 'lodash';
import PropTypes from 'prop-types';
import { getSelectedAccount, getTokenList } from '../../../selectors';
import useSwapsData from './useSwapsData';
import PrepareSendAndSwapPage from './prepare-send-and-swap-page';

const SendAndSwap = ({ recipient }) => {
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
      recipient={recipient}
    />
  );
};

SendAndSwap.propTypes = {
  recipient: PropTypes.object,
};

export default SendAndSwap;
