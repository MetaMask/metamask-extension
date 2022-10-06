import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CheckBox from '../../../ui/check-box';
import Identicon from '../../../ui/identicon';

const ChooseKeyringAccountsList = ({
  accounts,
  selectedAccounts,
  handleAccountClick,
}) => {
  const selectedAccountScrollRef = useRef(null);
  useLayoutEffect(() => {
    selectedAccountScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const checkIfConflict = (accountObj) => {
    if (
      selectedAccounts[accountObj.namespace] &&
      selectedAccounts[accountObj.namespace][accountObj.snapId].snapId !==
        accountObj.snapId
    ) {
      return true;
    }
    return false;
  };

  const List = () => {
    return (
      <div className="choose-keyring-accounts-list__wrapper">
        <div className="choose-keyring-accounts-list__list">
          {accounts.map((account, index) => {
            const { address, snapId, suggestedChainNames, namespace } = account;
            const isSelectedAccount = Boolean(
              selectedAccounts[namespace][snapId][address],
            );
            const isConflict = checkIfConflict(account);
            return (
              <div
                key={`choose-keyring-accounts-list-${index}`}
                onClick={() => handleAccountClick(account, isConflict)}
                className="choose-keyring-accounts-list__account"
                ref={isSelectedAccount ? selectedAccountScrollRef : null}
              >
                <div className="choose-keyring-accounts-list__account-info-wrapper">
                  <CheckBox
                    className="choose-keyring-accounts-list__list-check-box"
                    checked={isSelectedAccount}
                    disabled={isConflict}
                  />
                  <Identicon diameter={34} address={address} />
                  <div className="choose-keyring-accounts-list__account__info">
                    <div className="choose-keyring-accounts-list__account__label">
                      {address}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="choose-keyring-accounts-list">
      <List />
    </div>
  );
};

ChooseKeyringAccountsList.propTypes = {
  /**
   * Array of user account objects
   */
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string,
      snapId: PropTypes.string,
      namespace: PropTypes.string,
      suggestedChainNames: PropTypes.arrayOf(PropTypes.string),
    }),
  ).isRequired,
  /**
   * Currently selected accounts
   */
  selectedAccounts: PropTypes.object.isRequired,
  /**
   * Function to handle account click
   */
  handleAccountClick: PropTypes.func.isRequired,
};

export default ChooseKeyringAccountsList;
