import React, { memo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import CustodyAccountList from '../../../pages/institutional/account-list';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { removeAccount } from '../../../store/actions';
import withModalProps from '../../../helpers/higher-order-components/with-modal-props';
import {
  Box,
  Text,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalOverlay,
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../component-library';
import {
  BorderRadius,
  Display,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

type AuthDetails = {
  token?: string;
  jwt?: string;
  refreshToken?: string;
};

type LabelItem = {
  key: string;
  value: string;
};

type CustodyAccountDetail = {
  address: string;
  name: string;
  labels?: LabelItem[];
  authDetails: AuthDetails;
};

type Account = {
  address: string;
  balance: string;
};

type TokenAccount = {
  address: string;
  name: string;
  labels?: LabelItem[];
  balance?: string;
  token?: string;
};

type ConfirmRemoveJWTProps = {
  hideModal: () => void;
  token: string | { address: string };
  custodyAccountDetails: CustodyAccountDetail[];
  accounts: Account[];
};

const ConfirmRemoveJWT: React.FC<ConfirmRemoveJWTProps> = ({
  custodyAccountDetails,
  accounts,
  token: propsToken,
  hideModal,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [showMore, setShowMore] = useState(false);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  let token: string | null = null;

  if (propsToken) {
    if (typeof propsToken === 'object') {
      token = propsToken.address;
    } else {
      token = propsToken;
    }
  }

  useEffect(() => {
    const lowercasedTokenAddress = token?.toLowerCase() || '';

    const filteredAccounts = custodyAccountDetails.filter((item) => {
      const addressLower = item.address.toLowerCase();
      return accounts.find((acc) => acc.address.toLowerCase() === addressLower);
    });

    const tokens = filteredAccounts
      .filter(({ authDetails }) => {
        const getToken =
          authDetails?.token ?? authDetails?.jwt ?? authDetails?.refreshToken;
        return getToken?.toLowerCase() === lowercasedTokenAddress;
      })
      .map(({ address, name, labels, authDetails }) => {
        const lowercasedAddress = address.toLowerCase();
        const account = accounts.find(
          ({ address: adressAcc }) =>
            adressAcc.toLowerCase() === lowercasedAddress,
        );
        const balance = account?.balance;
        const getToken =
          authDetails?.token ?? authDetails?.jwt ?? authDetails?.refreshToken;
        return { address, name, labels, balance, token: getToken };
      });

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
    <Modal isOpen onClose={hideModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={hideModal}>{t('removeJWT')}</ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            padding={2}
            borderRadius={BorderRadius.SM}
            className="confirm-action-jwt__jwt"
          >
            <Text ellipsis>
              {showMore && token ? token : `...${token?.slice(-9)}`}
            </Text>
          </Box>
          {!showMore && (
            <Text
              color={TextColor.primaryDefault}
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
            textAlign={TextAlign.Center}
            variant={TextVariant.bodySm}
            marginTop={2}
          >
            {t('removeJWTDescription')}
          </Text>
          <Box className="confirm-action-jwt__accounts-list">
            <CustodyAccountList accounts={tokenAccounts} rawList />
          </Box>
        </ModalBody>
        <Box display={Display.Flex} padding={4}>
          <Button
            block
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleRemove}
            data-testid="remove-jwt-confirm-btn"
          >
            {t('remove')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default withModalProps(memo(ConfirmRemoveJWT));
