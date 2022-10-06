import React, { useLayoutEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import CheckBox from '../../../ui/check-box';
import Identicon from '../../../ui/identicon';
import { getSnaps } from '../../../../selectors';
import Typography from '../../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../../helpers/constants/design-system';

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
      Object.entries(selectedAccounts[accountObj.namespace]).some(
        ([snapId, snapAccounts]) =>
          snapId !== accountObj.snapId &&
          Object.values(snapAccounts).length > 0,
      )
    ) {
      return true;
    }
    return false;
  };

  const snaps = useSelector(getSnaps);

  // TODO: add tooltip to show ChainId, add Icons, add chain count (IF past 3), add extra div to display chain names
  const List = () => {
    return (
      <div className="choose-keyring-accounts-list__wrapper">
        <div className="choose-keyring-accounts-list__list">
          {accounts.map((account, index) => {
            // eslint-disable-next-line no-unused-vars
            const { address, snapId, suggestedChainNames, namespace } = account;
            const isSelectedAccount = Boolean(
              selectedAccounts[namespace]?.[snapId]?.[address],
            );
            const isConflict = checkIfConflict(account);
            const snap = snaps[snapId];
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
                    <div>
                      <Typography
                        className="choose-keyring-accounts-list__account__snap"
                        color={COLORS.TEXT_ALTERNATIVE}
                        variant={TYPOGRAPHY.H6}
                        fontWeight={FONT_WEIGHT.NORMAL}
                      >
                        via {snap.manifest.proposedName}
                      </Typography>
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
