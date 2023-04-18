import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import Modal from '../../../modal';
import CustodyAccountList from '../../../../../pages/create-account/institutional/connect-custody/account-list';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { removeAccount } from '../../../../../store/actions';
import withModalProps from '../../../../../helpers/higher-order-components/with-modal-props';
import { Text } from '../../../../component-library';
import Box from '../../../../ui/box';

const ConfirmRemoveJWT = ({
  custodyAccountDetails,
  accounts,
  token,
  hideModal,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [showMore, setShowMore] = useState(false);
  const [tokenAccounts, setTokenAccounts] = useState([]);

  useEffect(() => {
    const tokens = custodyAccountDetails
      .filter((item) =>
        accounts.find((acc) => acc.address === item.address.toLowerCase()),
      )
      .map((item) => ({
        address: item.address,
        name: item.name,
        labels: item.labels,
        balance: accounts.find(
          (acc) => acc.address === item.address.toLowerCase(),
        )?.balance,
        token:
          item.authDetails?.token ||
          item.authDetails?.jwt ||
          item.authDetails?.refreshToken,
      }))
      .filter((acc) => acc.token === token);
    setTokenAccounts({ tokens });
  }, [accounts, custodyAccountDetails, token]);

  const handleCancel = () => {
    hideModal();
  };

  const handleRemove = () => {
    tokenAccounts.forEach(async (account) => {
      await dispatch(removeAccount(account.address.toLowerCase()));
    });
    handleCancel();
  };

  const renderSelectedJWT = () => {
    return (
      <>
        <Box padding={2} className="confirm-action-jwt__jwt">
          <span>{showMore && token ? token : `...${token.slice(-9)}`}</span>
        </Box>
        {!showMore && (
          <Box marginLeft={2} className="confirm-action-jwt__show-more">
            <a
              rel="noopener noreferrer"
              onClick={() => {
                setShowMore(true);
              }}
            >
              <Text>{t('showMore')}</Text>
            </a>
          </Box>
        )}
      </>
    );
  };

  return (
    <Modal
      headerText={`${t('removeJWT')}?`}
      onClose={handleCancel}
      onSubmit={handleRemove}
      onCancel={handleCancel}
      submitText={t('remove')}
      cancelText={t('nevermind')}
      submitType="primary"
    >
      {renderSelectedJWT()}
      <Box marginTop={2} className="confirm-action-jwt__description">
        <Text>{t('removeJWTDescription')}</Text>
      </Box>
      <Box className="confirm-action-jwt__accounts-list">
        <CustodyAccountList accounts={tokenAccounts} rawList />
      </Box>
    </Modal>
  );
};

ConfirmRemoveJWT.propTypes = {
  hideModal: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  custodyAccountDetails: PropTypes.array.isRequired,
  accounts: PropTypes.array.isRequired,
};

export default withModalProps(ConfirmRemoveJWT);
