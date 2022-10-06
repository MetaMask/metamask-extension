import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import CheckBox from '../../../ui/check-box';
import Identicon from '../../../ui/identicon';

const ChooseKeyringAccountsList = ({
  accounts,
  selectedAccounts,
  handleAccountClick,
}) => {
  //   const t = useI18nContext();
  const selectedAccountScrollRef = useRef(null);
  useLayoutEffect(() => {
    selectedAccountScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const List = () => {
    return (
      <div className="choose-keyring-accounts-list__wrapper">
        <div className="choose-keyring-accounts-list__list">
          {accounts.map((account, index) => {
            const { address, snapName, chains } = account;
            const isSelectedAccount = selectedAccounts.has(address);
            return (
              <div
                key={`choose-keyring-accounts-list-${index}`}
                onClick={() => handleAccountClick(address)}
                className="choose-keyring-accounts-list__account"
                ref={isSelectedAccount ? selectedAccountScrollRef : null}
              >
                <div className="choose-keyring-accounts-list__account-info-wrapper">
                  <CheckBox
                    className="choose-keyring-accounts-list__list-check-box"
                    checked={isSelectedAccount}
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
      addressLabel: PropTypes.string,
      lastConnectedDate: PropTypes.string,
      balance: PropTypes.string,
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
