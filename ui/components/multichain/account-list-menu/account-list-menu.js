import React, { useState, useContext, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useDispatch, useSelector } from 'react-redux';
import Box from '../../ui/box/box';
import {
  IconName,
  ButtonLink,
  TextFieldSearch,
  Text,
} from '../../component-library';
import { AccountListItem, CreateAccount } from '..';
import {
  BLOCK_SIZES,
  Size,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import Popover from '../../ui/popover';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IN
import {
  getSelectedAccount,
  getMetaMaskAccountsOrdered,
  getConnectedSubjectsForAllAddresses,
  getOriginOfCurrentTab,
} from '../../../selectors';
import { toggleAccountMenu, setSelectedAccount } from '../../../store/actions';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  CONNECT_HARDWARE_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  CUSTODY_ACCOUNT_ROUTE,
  COMPLIANCE_FEATURE_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import NewAccountImportForm from '../../../pages/create-account/import-account/import-account';

export const AccountListMenu = ({ onClose }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const selectedAccount = useSelector(getSelectedAccount);
  const connectedSites = useSelector(getConnectedSubjectsForAllAddresses);
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const history = useHistory();
  const dispatch = useDispatch();
  const inputRef = useRef();

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);
  const mmiPortfolioEnabled = useSelector(getMmiPortfolioEnabled);
  ///: END:ONLY_INCLUDE_IN

  const [searchQuery, setSearchQuery] = useState('');
  const [actionMode, setActionMode] = useState('');

  let searchResults = accounts;
  if (searchQuery) {
    const fuse = new Fuse(accounts, {
      threshold: 0.2,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['name', 'address'],
    });
    fuse.setCollection(accounts);
    searchResults = fuse.search(searchQuery);
  }

  // Focus on the search box when the popover is opened
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.rootNode.querySelector('input[type=search]')?.focus();
    }
  }, [inputRef]);

  let title = t('selectAnAccount');
  if (actionMode === 'add') {
    title = t('addAccount');
  } else if (actionMode === 'import') {
    title = t('importAccount');
  }

  return (
    <Popover
      title={title}
      ref={inputRef}
      centerTitle
      onClose={onClose}
      onBack={actionMode === '' ? null : () => setActionMode('')}
    >
      {actionMode === 'add' ? (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4} paddingTop={0}>
          <CreateAccount
            onActionComplete={(confirmed) => {
              if (confirmed) {
                dispatch(toggleAccountMenu());
              } else {
                setActionMode('');
              }
            }}
          />
        </Box>
      ) : null}
      {actionMode === 'import' ? (
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4} paddingTop={0}>
          <NewAccountImportForm
            onActionComplete={(confirmed) => {
              if (confirmed) {
                dispatch(toggleAccountMenu());
              } else {
                setActionMode('');
              }
            }}
          />
        </Box>
      ) : null}
      {actionMode === '' ? (
        <Box className="multichain-account-menu">
          {/* Search box */}
          {accounts.length > 1 ? (
            <Box
              paddingLeft={4}
              paddingRight={4}
              paddingBottom={4}
              paddingTop={0}
            >
              <TextFieldSearch
                size={Size.SM}
                width={BLOCK_SIZES.FULL}
                placeholder={t('searchAccounts')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                clearButtonOnClick={() => setSearchQuery('')}
                clearButtonProps={{
                  size: Size.SM,
                }}
              />
            </Box>
          ) : null}
          {/* Account list block */}
          <Box className="multichain-account-menu__list">
            {searchResults.length === 0 && searchQuery !== '' ? (
              <Text
                paddingLeft={4}
                paddingRight={4}
                color={TextColor.textMuted}
                data-testid="multichain-account-menu-no-results"
              >
                {t('noAccountsFound')}
              </Text>
            ) : null}
            {searchResults.map((account) => {
              const connectedSite = connectedSites[account.address]?.find(
                ({ origin }) => origin === currentTabOrigin,
              );

              return (
                <AccountListItem
                  onClick={() => {
                    dispatch(toggleAccountMenu());
                    trackEvent({
                      category: MetaMetricsEventCategory.Navigation,
                      event: MetaMetricsEventName.NavAccountSwitched,
                      properties: {
                        location: 'Main Menu',
                      },
                    });
                    dispatch(setSelectedAccount(account.address));
                  }}
                  identity={account}
                  key={account.address}
                  selected={selectedAccount.address === account.address}
                  closeMenu={onClose}
                  connectedAvatar={connectedSite?.iconUrl}
                  connectedAvatarName={connectedSite?.name}
                />
              );
            })}
          </Box>
          {/* Add / Import / Hardware */}
          <Box padding={4}>
            <Box marginBottom={4}>
              <ButtonLink
                size={Size.SM}
                startIconName={IconName.Add}
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Default,
                      location: 'Main Menu',
                    },
                  });
                  setActionMode('add');
                }}
              >
                {t('addAccount')}
              </ButtonLink>
            </Box>
            <Box marginBottom={4}>
              <ButtonLink
                size={Size.SM}
                startIconName={IconName.Import}
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Imported,
                      location: 'Main Menu',
                    },
                  });
                  setActionMode('import');
                }}
              >
                {t('importAccount')}
              </ButtonLink>
            </Box>
            <Box>
              <ButtonLink
                size={Size.SM}
                startIconName={IconName.Hardware}
                onClick={() => {
                  dispatch(toggleAccountMenu());
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Hardware,
                      location: 'Main Menu',
                    },
                  });
                  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
                    global.platform.openExtensionInBrowser(
                      CONNECT_HARDWARE_ROUTE,
                    );
                  } else {
                    history.push(CONNECT_HARDWARE_ROUTE);
                  }
                }}
              >
                {t('hardwareWallet')}
              </ButtonLink>
              {
                ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
                <>
                  <ButtonLink
                    size={Size.SM}
                    startIconName={IconName.Custody}
                    onClick={() => {
                      dispatch(toggleAccountMenu());
                      trackEvent({
                        category: MetaMetricsEventCategory.Navigation,
                        event:
                          MetaMetricsEventName.UserClickedConnectCustodialAccount,
                      });
                      if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
                        global.platform.openExtensionInBrowser(
                          CUSTODY_ACCOUNT_ROUTE,
                        );
                      } else {
                        history.push(CUSTODY_ACCOUNT_ROUTE);
                      }
                    }}
                  >
                    {t('connectCustodialAccountMenu')}
                  </ButtonLink>
                  {mmiPortfolioEnabled && (
                    <ButtonLink
                      size={Size.SM}
                      startIconName={IconName.MmmiPortfolioDashboard}
                      onClick={() => {
                        dispatch(toggleAccountMenu());
                        trackEvent({
                          category: MetaMetricsEventCategory.Navigation,
                          event:
                            MetaMetricsEventName.UserClickedPortfolioButton,
                        });
                        window.open(mmiPortfolioUrl, '_blank');
                      }}
                    >
                      {t('portfolioDashboard')}
                    </ButtonLink>
                  )}
                  <ButtonLink
                    size={Size.SM}
                    startIconName={IconName.Compliance}
                    onClick={() => {
                      dispatch(toggleAccountMenu());
                      trackEvent({
                        category: MetaMetricsEventCategory.Navigation,
                        event: MetaMetricsEventName.UserClickedCompliance,
                      });
                      if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
                        global.platform.openExtensionInBrowser(
                          COMPLIANCE_FEATURE_ROUTE,
                        );
                      } else {
                        history.push(COMPLIANCE_FEATURE_ROUTE);
                      }
                    }}
                  >
                    {t('compliance')}
                  </ButtonLink>
                </>
                ///: END:ONLY_INCLUDE_IN
              }
            </Box>
          </Box>
        </Box>
      ) : null}
    </Popover>
  );
};

AccountListMenu.propTypes = {
  /**
   * Function that executes when the menu closes
   */
  onClose: PropTypes.func.isRequired,
};
