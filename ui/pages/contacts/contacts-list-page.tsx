import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { sortBy } from 'lodash';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonVariant,
  ButtonSize,
  Icon,
  IconName,
  IconColor,
  ButtonIcon,
  ButtonIconSize,
} from '@metamask/design-system-react';
import { Header, Page } from '../../components/multichain/pages/page';
import { Toast, ToastContainer } from '../../components/multichain/toast';
import { BorderRadius } from '../../helpers/constants/design-system';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  CONTACTS_ADD_ROUTE,
  CONTACTS_VIEW_ROUTE,
  CONTACTS_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  getCompleteAddressBook,
  getInternalAccounts,
} from '../../selectors';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import {
  buildDuplicateContactMap,
  hasDuplicateContacts,
} from '../../components/app/contact-list/utils';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../components/component-library';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { ContactListItem } from './components/contact-list-item';
import { ContactsEmptyState } from './components/contacts-empty-state';

const TOAST_AUTO_HIDE_MS = 2500;

export function ContactsListPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { trackEvent } = useContext(MetaMetricsContext);
  const completeAddressBook = useSelector(getCompleteAddressBook);
  const internalAccounts = useSelector(getInternalAccounts);
  const [showDeletedToast, setShowDeletedToast] = useState(false);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);

  const TOAST_CLEAR_STATE_DELAY_MS = 100;

  const contacts = useMemo(() => {
    const list = (completeAddressBook ?? []).filter(
      (entry: { name?: string }) => Boolean(entry?.name),
    );
    return sortBy(list, (entry: { name: string }) =>
      (entry.name ?? '').toLowerCase(),
    );
  }, [completeAddressBook]);

  const hasDuplicates = useMemo(
    () =>
      Boolean(
        completeAddressBook?.length &&
          hasDuplicateContacts(completeAddressBook, internalAccounts ?? []),
      ),
    [completeAddressBook, internalAccounts],
  );

  const duplicateContactMap = useMemo(
    () =>
      buildDuplicateContactMap(
        completeAddressBook ?? [],
        internalAccounts ?? [],
      ),
    [completeAddressBook, internalAccounts],
  );

  useEffect(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Contacts,
      event: MetaMetricsEventName.ContactsPageViewed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        number_of_contacts: contacts.length,
      },
    });
  }, [trackEvent, contacts.length]);

  useEffect(() => {
    if (location.state?.showContactDeletedToast) {
      setShowDeletedToast(true);
    }
  }, [location.state?.showContactDeletedToast]);

  useEffect(() => {
    if (location.state?.showContactUpdatedToast) {
      setShowUpdatedToast(true);
    }
  }, [location.state?.showContactUpdatedToast]);

  useEffect(() => {
    if (!showDeletedToast) return;
    const id = setTimeout(() => {
      navigate(CONTACTS_ROUTE, { replace: true, state: {} });
    }, TOAST_CLEAR_STATE_DELAY_MS);
    return () => clearTimeout(id);
  }, [showDeletedToast, navigate]);

  useEffect(() => {
    if (!showUpdatedToast) return;
    const id = setTimeout(() => {
      navigate(CONTACTS_ROUTE, { replace: true, state: {} });
    }, TOAST_CLEAR_STATE_DELAY_MS);
    return () => clearTimeout(id);
  }, [showUpdatedToast, navigate]);

  const handleBack = () => {
    navigate(DEFAULT_ROUTE);
  };

  const showDeletedToastNow =
    showDeletedToast || Boolean(location.state?.showContactDeletedToast);
  const showUpdatedToastNow =
    showUpdatedToast || Boolean(location.state?.showContactUpdatedToast);

  return (
    <Page data-testid="contacts-page">
      {showDeletedToastNow && (
        <ToastContainer>
          <Toast
            startAdornment={
              <Icon
                name={IconName.CheckBold}
                color={IconColor.SuccessDefault}
              />
            }
            text={t('contactDeleted')}
            onClose={() => setShowDeletedToast(false)}
            autoHideTime={TOAST_AUTO_HIDE_MS}
            onAutoHideToast={() => setShowDeletedToast(false)}
            borderRadius={BorderRadius.LG}
            textClassName="text-base"
            data-testid="contact-deleted-toast"
          />
        </ToastContainer>
      )}
      {showUpdatedToastNow && (
        <ToastContainer>
          <Toast
            startAdornment={
              <Icon
                name={IconName.CheckBold}
                color={IconColor.SuccessDefault}
              />
            }
            text={t('contactUpdated')}
            onClose={() => setShowUpdatedToast(false)}
            autoHideTime={TOAST_AUTO_HIDE_MS}
            onAutoHideToast={() => setShowUpdatedToast(false)}
            borderRadius={BorderRadius.LG}
            textClassName="text-base"
            data-testid="contact-updated-toast"
          />
        </ToastContainer>
      )}
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleBack}
            data-testid="contacts-back-button"
          />
        }
        marginBottom={0}
      >
        {t('contacts')}
      </Header>
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="flex min-h-0 w-full flex-1 flex-col"
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          className="multichain-page-content flex min-h-0 flex-1 flex-col overflow-auto"
          style={{
            scrollbarColor: 'var(--color-icon-muted) transparent',
          }}
        >
          {hasDuplicates && contacts.length > 0 ? (
            <Box padding={4} paddingTop={0} paddingBottom={0}>
              <BannerAlert
                severity={BannerAlertSeverity.Warning}
                description={t('duplicateContactWarning')}
                data-testid="duplicate-contact-warning"
              />
            </Box>
          ) : null}
          {contacts.length > 0 ? (
            <Box
              flexDirection={BoxFlexDirection.Column}
              padding={4}
              paddingTop={hasDuplicates ? 4 : 0}
              paddingBottom={4}
            >
              {contacts.map(
                (entry: { address: string; name: string; chainId: string }) => (
                  <ContactListItem
                    key={`${entry.chainId}-${entry.address}`}
                    address={entry.address}
                    name={entry.name ?? ''}
                    chainId={entry.chainId}
                    onSelect={() =>
                      navigate(`${CONTACTS_VIEW_ROUTE}/${entry.address}`)
                    }
                    isDuplicate={
                      (duplicateContactMap.get(
                        (entry.name ?? '').trim().toLowerCase(),
                      ) ?? []).length > 1 ||
                      (completeAddressBook ?? []).filter(
                        (e: { address: string }) =>
                          isEqualCaseInsensitive(e.address, entry.address),
                      ).length > 1
                    }
                  />
                ),
              )}
            </Box>
          ) : (
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              className="flex min-h-full flex-1 flex-col items-center justify-center"
            >
              <ContactsEmptyState
                onAddContact={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Contacts,
                    event: MetaMetricsEventName.AddContactClicked,
                    properties: { location: 'contacts_list' },
                  });
                  navigate(CONTACTS_ADD_ROUTE);
                }}
              />
            </Box>
          )}
        </Box>
        {contacts.length > 0 && (
          <Box
            padding={4}
            paddingBottom={6}
            paddingTop={0}
            className="shrink-0 bg-background-default"
          >
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={() => {
                trackEvent({
                  category: MetaMetricsEventCategory.Contacts,
                  event: MetaMetricsEventName.AddContactClicked,
                  properties: { location: 'contacts_list' },
                });
                navigate(CONTACTS_ADD_ROUTE);
              }}
              data-testid="contacts-add-contact-button"
            >
              {t('addContact')}
            </Button>
          </Box>
        )}
      </Box>
    </Page>
  );
}
