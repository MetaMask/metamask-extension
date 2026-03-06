import React, { useState, useCallback } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconColor,
} from '@metamask/design-system-react';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { BorderRadius } from '../../helpers/constants/design-system';
import { Toast, ToastContainer } from '../../components/multichain/toast';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  CONTACTS_ROUTE,
  CONTACTS_EDIT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  getAddressBookEntry,
  getInternalAccountByAddress,
} from '../../selectors';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { removeFromAddressBook } from '../../store/actions';
import { DeleteContactModal } from './components/delete-contact-modal';
import { ViewContactContent } from './components/view-contact-content';

const TOAST_AUTO_HIDE_MS = 2500;

export function ContactDetailsPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { address } = useParams<{ address: string }>();
  const contact = useSelector((state) =>
    address ? getAddressBookEntry(state, address) : null,
  );
  const internalAccount = useSelector((state) =>
    address ? getInternalAccountByAddress(state, address) : null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  const handleBack = () => {
    navigate(CONTACTS_ROUTE);
  };

  const handleClose = () => {
    navigate(DEFAULT_ROUTE);
  };

  const openDeleteModal = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!address || !contact?.chainId) {
      return;
    }
    setShowDeleteModal(false);
    await dispatch(removeFromAddressBook(contact.chainId, address));
    setShowDeleteToast(true);
    setTimeout(() => {
      setShowDeleteToast(false);
      navigate(CONTACTS_ROUTE);
    }, TOAST_AUTO_HIDE_MS);
  }, [address, contact?.chainId, dispatch, navigate]);

  if (!address) {
    return <Navigate to={CONTACTS_ROUTE} replace />;
  }

  if (!contact) {
    return <Navigate to={CONTACTS_ROUTE} replace />;
  }

  const name = contact.name ?? internalAccount?.metadata?.name ?? '';
  const memo = contact.memo ?? '';
  const checkSummedAddress = toChecksumHexAddress(address);

  return (
    <Page data-testid="contact-details-page">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleBack}
            data-testid="contact-details-back-button"
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel={t('close')}
            iconName={IconName.Close}
            size={ButtonIconSize.Md}
            onClick={handleClose}
            data-testid="contact-details-close-button"
          />
        }
        marginBottom={0}
      >
        {t('contactDetails')}
      </Header>
      <Content padding={0}>
        <Box className="flex flex-1 min-h-0 w-full flex-col">
          <ViewContactContent
            name={name}
            address={address}
            checkSummedAddress={checkSummedAddress}
            memo={memo}
            chainId={contact.chainId ?? ''}
            onEdit={() => navigate(`${CONTACTS_EDIT_ROUTE}/${address}`)}
            onDelete={openDeleteModal}
          />
        </Box>
      </Content>

      <DeleteContactModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      {showDeleteToast && (
        <ToastContainer>
          <Toast
            startAdornment={
              <Icon
                name={IconName.CheckBold}
                color={IconColor.SuccessDefault}
              />
            }
            text={t('contactDeleted')}
            onClose={() => setShowDeleteToast(false)}
            autoHideTime={TOAST_AUTO_HIDE_MS}
            onAutoHideToast={() => setShowDeleteToast(false)}
            borderRadius={BorderRadius.LG}
            textClassName="text-base"
            data-testid="contact-deleted-toast"
          />
        </ToastContainer>
      )}
    </Page>
  );
}
