import React, { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import Modal from '../../app/modal';
import CustodyAccountList from '../../../pages/create-account/institutional/connect-custody/account-list';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { removeAccount } from '../../../store/actions';
import withModalProps from '../../../helpers/higher-order-components/with-modal-props';
import { Text } from '../../component-library';
import Box from '../../ui/box';
import {
  BorderRadius,
  DISPLAY,
  TEXT_ALIGN,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

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
    const filteredAccounts = custodyAccountDetails.filter((item) => {
      const addressLower = item.address.toLowerCase();
      return accounts.find((acc) => acc.address.toLowerCase() === addressLower);
    });

    const tokens = filteredAccounts
      .map(({ address, name, labels, authDetails }) => {
        const addressLower = address.toLowerCase();
        const account = accounts.find(
          ({ address: adressAcc }) => adressAcc.toLowerCase() === addressLower,
        );
        const balance = account && account.balance;
        const getToken =
          authDetails?.token ?? authDetails?.jwt ?? authDetails?.refreshToken;
        return { address, name, labels, balance, token: getToken };
      })
      .filter(
        ({ token: tokenAcc }) =>
          tokenAcc.toLowerCase() === token.address.toLowerCase(),
      );

    setTokenAccounts(tokens);
  }, [accounts, custodyAccountDetails, token]);

  const handleRemove = async () => {
    try {
      for (const account of tokenAccounts) {
        await dispatch(removeAccount(account.address.toLowerCase()));
      }
      hideModal();
    } catch (error) {
      console.error(error);
    }
  };

  const handleShowMore = () => {
    setShowMore(true);
  };

  return (
    <Modal
      headerText={`${t('removeJWT')}?`}
      onClose={hideModal}
      onSubmit={handleRemove}
      onCancel={hideModal}
      submitText={t('remove')}
      cancelText={t('nevermind')}
      submitType="primary"
    >
      <Box
        display={DISPLAY.FLEX}
        padding={2}
        borderRadius={BorderRadius.SM}
        className="confirm-action-jwt__jwt"
      >
        {showMore && token ? token.address : `...${token.address.slice(-9)}`}
      </Box>
      {!showMore && (
        <Text
          color={TextColor.goerli}
          marginLeft={2}
          className="confirm-action-jwt__show-more"
        >
          <a rel="noopener noreferrer" onClick={handleShowMore}>
            {t('showMore')}
          </a>
        </Text>
      )}
      <Text
        as="h6"
        textAlign={TEXT_ALIGN.CENTER}
        variant={TextVariant.bodySm}
        marginTop={2}
      >
        {t('removeJWTDescription')}
      </Text>
      <Box className="confirm-action-jwt__accounts-list">
        <CustodyAccountList accounts={tokenAccounts} rawList />
      </Box>
    </Modal>
  );
};

ConfirmRemoveJWT.propTypes = {
  hideModal: PropTypes.func.isRequired,
  token: PropTypes.object.isRequired,
  custodyAccountDetails: PropTypes.array.isRequired,
  accounts: PropTypes.array.isRequired,
};

export default withModalProps(memo(ConfirmRemoveJWT));
