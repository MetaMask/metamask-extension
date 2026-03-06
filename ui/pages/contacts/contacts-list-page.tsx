import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { sortBy } from 'lodash';
import {
  Box,
  BoxFlexDirection,
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
import { getCompleteAddressBook } from '../../selectors';
import { ContactListItem } from './components/contact-list-item';
import { ContactsEmptyState } from './components/contacts-empty-state';

const TOAST_AUTO_HIDE_MS = 2500;

export function ContactsListPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const completeAddressBook = useSelector(getCompleteAddressBook);
  const [showDeletedToast, setShowDeletedToast] = useState(false);

  useEffect(() => {
    if (location.state?.showContactDeletedToast) {
      setShowDeletedToast(true);
      navigate(CONTACTS_ROUTE, { replace: true, state: {} });
    }
  }, [location.state?.showContactDeletedToast, navigate]);

  const contacts = useMemo(() => {
    const list = (completeAddressBook ?? []).filter(
      (entry: { name?: string }) => Boolean(entry?.name),
    );
    return sortBy(list, (entry: { name: string }) =>
      (entry.name ?? '').toLowerCase(),
    );
  }, [completeAddressBook]);

  const handleBack = () => {
    navigate(DEFAULT_ROUTE);
  };

  return (
    <Page data-testid="contacts-page">
      {showDeletedToast && (
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
          padding={4}
          paddingTop={0}
          className="multichain-page-content flex min-h-0 flex-1 flex-col overflow-auto"
          style={{
            scrollbarColor: 'var(--color-icon-muted) transparent',
          }}
        >
          {contacts.length > 0 ? (
            <Box flexDirection={BoxFlexDirection.Column} paddingBottom={4}>
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
                  />
                ),
              )}
            </Box>
          ) : (
            <ContactsEmptyState />
          )}
        </Box>
        <Box
          padding={4}
          paddingTop={0}
          marginTop={6}
          className="shrink-0 bg-background-default"
        >
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={() => navigate(CONTACTS_ADD_ROUTE)}
            data-testid="contacts-add-contact-button"
          >
            {contacts.length === 0 ? `+ ${t('addContact')}` : t('addContact')}
          </Button>
        </Box>
      </Box>
    </Page>
  );
}
