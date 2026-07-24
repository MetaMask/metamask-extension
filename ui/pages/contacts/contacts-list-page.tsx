import React, { useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  IconName,
  ButtonIcon,
  ButtonIconSize,
} from '@metamask/design-system-react';
import { Header, Page } from '../../components/multichain/pages/page';
import { toast } from '../../components/ui/toast/toast';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  CONTACTS_ADD_ROUTE,
  CONTACTS_VIEW_ROUTE,
  CONTACTS_ROUTE,
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import { getCompleteAddressBook, getInternalAccounts } from '../../selectors';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../components/component-library';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useGlobalMenuRouteTransition } from '../routes/global-menu-route-transition';
import { buildDuplicateContactMap, hasDuplicateContacts } from './utils';
import { ContactListItem } from './components/contact-list-item';
import { ContactsEmptyState } from './components/contacts-empty-state';

export function ContactsListPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const runCloseTransition = useGlobalMenuRouteTransition();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromPath = searchParams.get('from') ?? undefined;
  const { trackEvent, createEventBuilder } = useAnalytics();
  const lastTrackedContactCountRef = useRef<number | null>(null);
  const completeAddressBook = useSelector(getCompleteAddressBook);
  const internalAccounts = useSelector(getInternalAccounts);

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
    if (lastTrackedContactCountRef.current === contacts.length) {
      return;
    }

    lastTrackedContactCountRef.current = contacts.length;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ContactsPageViewed)
        .addCategory(MetaMetricsEventCategory.Contacts)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          number_of_contacts: contacts.length,
        })
        .build(),
    );
  }, [contacts.length, createEventBuilder, trackEvent]);

  useEffect(() => {
    if (!location.state?.showContactDeletedToast) {
      return;
    }

    toast.success(t('contactDeleted'), {
      id: 'contact-deleted-toast',
    });
    navigate(CONTACTS_ROUTE, { replace: true, state: {} });
  }, [location.state?.showContactDeletedToast, navigate, t]);

  useEffect(() => {
    if (!location.state?.showContactUpdatedToast) {
      return;
    }

    toast.success(t('contactUpdated'), {
      id: 'contact-updated-toast',
    });
    navigate(CONTACTS_ROUTE, { replace: true, state: {} });
  }, [location.state?.showContactUpdatedToast, navigate, t]);

  const handleBack = () => {
    if (fromPath === DEFAULT_ROUTE) {
      runCloseTransition(() => navigate(PREVIOUS_ROUTE));
    } else {
      navigate(DEFAULT_ROUTE);
    }
  };

  return (
    <Page data-testid="contacts-page">
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
                      navigate(
                        `${CONTACTS_VIEW_ROUTE}/${entry.chainId}/${entry.address}`,
                      )
                    }
                    isDuplicate={
                      (
                        duplicateContactMap.get(
                          (entry.name ?? '').trim().toLowerCase(),
                        ) ?? []
                      ).length > 1 ||
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
                  trackEvent(
                    createEventBuilder(MetaMetricsEventName.AddContactClicked)
                      .addCategory(MetaMetricsEventCategory.Contacts)
                      .addProperties({ location: 'contacts_list' })
                      .build(),
                  );
                  navigate(CONTACTS_ADD_ROUTE);
                }}
              />
            </Box>
          )}
        </Box>
        {contacts.length > 0 && (
          <Box
            flexDirection={BoxFlexDirection.Column}
            padding={4}
            paddingBottom={6}
            paddingTop={4}
            className="shrink-0 bg-background-default"
          >
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isFullWidth
              onClick={() => {
                trackEvent(
                  createEventBuilder(MetaMetricsEventName.AddContactClicked)
                    .addCategory(MetaMetricsEventCategory.Contacts)
                    .addProperties({ location: 'contacts_list' })
                    .build(),
                );
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
