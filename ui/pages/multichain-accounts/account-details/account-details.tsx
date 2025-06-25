import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { AppSliceState } from '../../../ducks/app/app';
import { getInternalAccountByAddress } from '../../../selectors';
import { setAccountDetailsAddress } from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { BaseAccountDetails } from '../base-account-details/base-account-details';
import { EVMAccountDetails } from './evm-account-details';
import { getAccountTypeCategory } from './account-type-utils';

// Import specific account type components (to be created)
// import { SolanaAccountDetails } from './solana-account-details';
// import { HardwareAccountDetails } from './hardware-account-details';
// import { PrivateKeyAccountDetails } from './private-key-account-details';
// import { InstitutionalAccountDetails } from './institutional-account-details';

type AccountDetailsProps = {
  children?: React.ReactNode | React.ReactNode[];
};

export const AccountDetails = ({ children }: AccountDetailsProps) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const address = useSelector(
    (state: AppSliceState) => state.appState.accountDetailsAddress,
  );

  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );

  const handleNavigation = useCallback(() => {
    dispatch(setAccountDetailsAddress(''));
    history.push(DEFAULT_ROUTE);
  }, [history, dispatch]);

  useEffect(() => {
    if (!address) {
      history.push(DEFAULT_ROUTE);
    }
  }, [dispatch, address, history]);

  if (!account) {
    return null;
  }

  const accountTypeCategory = getAccountTypeCategory(account);

  const renderAccountDetailsByType = () => {
    switch (accountTypeCategory) {
      case 'evm':
        return <EVMAccountDetails>{children}</EVMAccountDetails>;

      case 'solana':
        // TODO: Create SolanaAccountDetails component
        return <BaseAccountDetails>{children}</BaseAccountDetails>;

      case 'hardware':
        // TODO: Create HardwareAccountDetails component
        return <BaseAccountDetails>{children}</BaseAccountDetails>;

      case 'private-key':
        // TODO: Create PrivateKeyAccountDetails component
        return <BaseAccountDetails>{children}</BaseAccountDetails>;

      case 'institutional-evm':
        // TODO: Create InstitutionalAccountDetails component
        return <BaseAccountDetails>{children}</BaseAccountDetails>;

      case 'bitcoin':
        // TODO: Create BitcoinAccountDetails component
        return <BaseAccountDetails>{children}</BaseAccountDetails>;

      case 'snap':
        // TODO: Create SnapAccountDetails component
        return <BaseAccountDetails>{children}</BaseAccountDetails>;

      default:
        // Fallback to base account details for unknown types
        return <BaseAccountDetails>{children}</BaseAccountDetails>;
    }
  };

  return renderAccountDetailsByType();
};