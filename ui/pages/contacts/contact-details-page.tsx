import React, { useState, useCallback, useEffect, useContext } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { Content, Header, Page } from '../../components/multichain/pages/page';
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
import { toChecksumHexAddress } from '../../../shared/lib/hexstring-utils';
import { removeFromAddressBook } from '../../store/actions';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { DeleteContactModal } from './components/delete-contact-modal';
import { ViewContactContent } from './components/view-contact-content';

export function ContactDetailsPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { address } = useParams<{ address: string }>();
  const contact = useSelector((state) =>
    address ? getAddressBookEntry(state, address) : null,
  );
  const internalAccount = useSelector((state) =>
    address ? getInternalAccountByAddress(state, address) : null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (address && contact?.chainId) {
      trackEvent({
        category: MetaMetricsEventCategory.Contacts,
        event: MetaMetricsEventName.ContactDetailsViewed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: contact.chainId,
        },
        sensitiveProperties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          contact_address: address,
        },
      });
    }
  }, [address, contact?.chainId, trackEvent]);

  const handleBack = () => {
    navigate(CONTACTS_ROUTE);
  };

  const handleClose = () => {
    navigate(DEFAULT_ROUTE);
  };

  const openDeleteModal = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Contacts,
      event: MetaMetricsEventName.DeleteContactClicked,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: contact?.chainId,
      },
      ...(address && {
        sensitiveProperties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          contact_address: address,
        },
      }),
    });
    setShowDeleteModal(true);
  }, [address, contact?.chainId, trackEvent]);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!address || !contact?.chainId) {
      return;
    }
    setShowDeleteModal(false);
    trackEvent({
      category: MetaMetricsEventCategory.Contacts,
      event: MetaMetricsEventName.ContactDeleted,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: contact.chainId,
      },
      sensitiveProperties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        contact_address: address,
      },
    });
    await dispatch(removeFromAddressBook(contact.chainId, address));
    navigate(CONTACTS_ROUTE, { state: { showContactDeletedToast: true } });
  }, [address, contact?.chainId, dispatch, navigate, trackEvent]);

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
            onEdit={() => {
              trackEvent({
                category: MetaMetricsEventCategory.Contacts,
                event: MetaMetricsEventName.EditContactClicked,
                properties: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  chain_id: contact.chainId,
                },
                sensitiveProperties: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  contact_address: address,
                },
              });
              navigate(`${CONTACTS_EDIT_ROUTE}/${address}`);
            }}
            onDelete={openDeleteModal}
          />
        </Box>
      </Content>

      <DeleteContactModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </Page>
  );
}
