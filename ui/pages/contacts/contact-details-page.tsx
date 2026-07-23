import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Hex } from '@metamask/utils';
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
import { getInternalAccountByAddress } from '../../selectors';
import {
  AddressBookMetaMaskState,
  getAddressBookEntryByNetwork,
} from '../../selectors/snaps/address-book';
import { toChecksumHexAddress } from '../../../shared/lib/hexstring-utils';
import { removeFromAddressBook } from '../../store/actions';
import { useAnalytics } from '../../hooks/useAnalytics';
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
  const { trackEvent, createEventBuilder } = useAnalytics();
  const lastTrackedContactKeyRef = useRef<string | null>(null);
  const { chainId, address } = useParams<{
    chainId: string;
    address: string;
  }>();
  const contact = useSelector((state) =>
    address && chainId
      ? getAddressBookEntryByNetwork(
          state as AddressBookMetaMaskState,
          address,
          chainId as Hex,
        )
      : null,
  );
  const internalAccount = useSelector((state) =>
    address ? getInternalAccountByAddress(state, address) : null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!address || !contact?.chainId) {
      lastTrackedContactKeyRef.current = null;
      return;
    }

    const contactKey = `${contact.chainId}:${address}`;
    if (lastTrackedContactKeyRef.current === contactKey) {
      return;
    }

    lastTrackedContactKeyRef.current = contactKey;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ContactDetailsViewed)
        .addCategory(MetaMetricsEventCategory.Contacts)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: contact.chainId,
        })
        .addSensitiveProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          contact_address: address,
        })
        .build(),
    );
  }, [address, contact?.chainId, createEventBuilder, trackEvent]);

  const handleBack = () => {
    navigate(CONTACTS_ROUTE);
  };

  const handleClose = () => {
    navigate(DEFAULT_ROUTE);
  };

  const openDeleteModal = useCallback(() => {
    const deleteContactEventBuilder = createEventBuilder(
      MetaMetricsEventName.DeleteContactClicked,
    )
      .addCategory(MetaMetricsEventCategory.Contacts)
      .addProperties({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: contact?.chainId,
      });

    trackEvent(
      (address
        ? deleteContactEventBuilder.addSensitiveProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            contact_address: address,
          })
        : deleteContactEventBuilder
      ).build(),
    );
    setShowDeleteModal(true);
  }, [address, contact?.chainId, createEventBuilder, trackEvent]);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!address || !contact?.chainId) {
      return;
    }
    setShowDeleteModal(false);
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ContactDeleted)
        .addCategory(MetaMetricsEventCategory.Contacts)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: contact.chainId,
        })
        .addSensitiveProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          contact_address: address,
        })
        .build(),
    );
    navigate(CONTACTS_ROUTE, { state: { showContactDeletedToast: true } });
    dispatch(removeFromAddressBook(contact.chainId, address));
  }, [
    address,
    contact?.chainId,
    createEventBuilder,
    dispatch,
    navigate,
    trackEvent,
  ]);

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
              trackEvent(
                createEventBuilder(MetaMetricsEventName.EditContactClicked)
                  .addCategory(MetaMetricsEventCategory.Contacts)
                  .addProperties({
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    chain_id: contact.chainId,
                  })
                  .addSensitiveProperties({
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    contact_address: address,
                  })
                  .build(),
              );
              navigate(`${CONTACTS_EDIT_ROUTE}/${chainId}/${address}`);
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
