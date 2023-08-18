import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import {
  unconfirmedTransactionsHashSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
} from '../../../../selectors';
import { I18nContext } from '../../../../contexts/i18n';
import {
  CONFIRM_TRANSACTION_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../../helpers/constants/routes';
import { clearConfirmTransaction } from '../../../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  Display,
  FontWeight,
  JustifyContent,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  IconName,
  ButtonIcon,
  Text,
  ButtonIconSize,
} from '../../../component-library';

const ConfirmPageContainerNavigation = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const { id } = useParams();

  const unapprovedDecryptMsgs = useSelector(unapprovedDecryptMsgsSelector);
  const unapprovedEncryptionPublicKeyMsgs = useSelector(
    unapprovedEncryptionPublicKeyMsgsSelector,
  );
  const unconfirmedTransactions = useSelector(
    unconfirmedTransactionsHashSelector,
  );

  const enumUnapprovedDecryptMsgsKey = Object.keys(unapprovedDecryptMsgs || {});
  const enumUnapprovedEncryptMsgsKey = Object.keys(
    unapprovedEncryptionPublicKeyMsgs || {},
  );
  const enumDecryptAndEncryptMsgs = [
    ...enumUnapprovedDecryptMsgsKey,
    ...enumUnapprovedEncryptMsgsKey,
  ];

  const enumUnapprovedTxs = Object.keys(unconfirmedTransactions).filter(
    (key) => enumDecryptAndEncryptMsgs.includes(key) === false,
  );

  const currentPosition = enumUnapprovedTxs.indexOf(id);

  const totalTx = enumUnapprovedTxs.length;
  const positionOfCurrentTx = currentPosition + 1;
  const nextTxId = enumUnapprovedTxs[currentPosition + 1];
  const prevTxId = enumUnapprovedTxs[currentPosition - 1];
  const showNavigation = enumUnapprovedTxs.length > 1;
  const firstTx = enumUnapprovedTxs[0];
  const lastTx = enumUnapprovedTxs[enumUnapprovedTxs.length - 1];

  const onNextTx = (txId) => {
    if (txId) {
      dispatch(clearConfirmTransaction());
      history.push(
        unconfirmedTransactions[txId]?.msgParams
          ? `${CONFIRM_TRANSACTION_ROUTE}/${txId}${SIGNATURE_REQUEST_PATH}`
          : `${CONFIRM_TRANSACTION_ROUTE}/${txId}`,
      );
    }
  };

  return (
    <Box
      className="confirm-page-container-navigation"
      display={showNavigation ? Display.Flex : Display.None}
      justifyContent={JustifyContent.spaceBetween}
      paddingRight={4}
      paddingBottom={2}
      paddingLeft={4}
    >
      <Box
        display={Display.Flex}
        data-testid="navigation-container"
        style={{
          visibility: prevTxId ? 'initial' : 'hidden',
        }}
      >
        <ButtonIcon
          size={ButtonIconSize.Sm}
          iconName={IconName.ArrowDoubleLeft}
          data-testid="first-page"
          ariaLabel="first-page"
          onClick={() => onNextTx(firstTx)}
        />
        <ButtonIcon
          size={ButtonIconSize.Sm}
          iconName={IconName.ArrowLeft}
          data-testid="previous-page"
          ariaLabel="previous page"
          onClick={() => onNextTx(prevTxId)}
        />
      </Box>
      <Box>
        <Text fontWeight={FontWeight.Bold} textAlign={TextAlign.Center}>
          {positionOfCurrentTx} {t('ofTextNofM')} {totalTx}
        </Text>
        <Text textAlign={TextAlign.Center}>
          {t('requestsAwaitingAcknowledgement')}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        data-testid="navigation-container"
        style={{
          visibility: nextTxId ? 'initial' : 'hidden',
        }}
      >
        <ButtonIcon
          size={ButtonIconSize.Sm}
          iconName={IconName.ArrowRight}
          data-testid="next-page"
          ariaLabel="next page"
          onClick={() => onNextTx(nextTxId)}
        />
        <ButtonIcon
          size={ButtonIconSize.Sm}
          iconName={IconName.ArrowDoubleRight}
          data-testid="last-page"
          ariaLabel="last page"
          onClick={() => onNextTx(lastTx)}
        />
      </Box>
    </Box>
  );
};

export default ConfirmPageContainerNavigation;
