import React from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { isEqual, shuffle } from 'lodash';
import PrepareSwapPage from '../../swaps/prepare-swap-page/prepare-swap-page';
import { getSelectedAccount, getTokenList } from '../../../selectors';

export const PrepareBridgePage = () => {
  const selectedAccount = useSelector(getSelectedAccount, shallowEqual);
  const { balance: ethBalance, address: selectedAccountAddress } =
    selectedAccount;

  const tokenList = useSelector(getTokenList, isEqual);
  const shuffledTokensList = shuffle(Object.values(tokenList));

  return (
    <div>
      <PrepareSwapPage
        ethBalance={ethBalance}
        selectedAccountAddress={selectedAccountAddress}
        shuffledTokensList={shuffledTokensList}
      />
    </div>
  );
};
