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
    const tokens = custodyAccountDetails
      .filter((item) =>
        accounts.find(
          (acc) => acc.address.toLowerCase() === item.address.toLowerCase(),
        ),
      )
      .map((item) => ({
        address: item.address,
        name: item.name,
        labels: item.labels,
        balance: accounts.find(
          (acc) => acc.address.toLowerCase() === item.address.toLowerCase(),
        )?.balance,
        token:
          item.authDetails?.token ??
          item.authDetails?.jwt ??
          item.authDetails?.refreshToken,
      }))
      .filter((acc) => acc.token.toLowerCase() === token.address.toLowerCase());

    setTokenAccounts(tokens);
  }, [accounts, custodyAccountDetails, token]);

  const handleCancel = () => {
    hideModal();
  };

  const handleRemove = async () => {
    try {
      for (const account of tokenAccounts) {
        await dispatch(removeAccount(account.address.toLowerCase()));
      }
      handleCancel();
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
      onClose={handleCancel}
      onSubmit={handleRemove}
      onCancel={handleCancel}
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
