import React, {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';

import {
  Box,
  ButtonPrimary,
  ButtonSecondary,
  FormTextFieldSize,
  PolymorphicComponentPropWithRef,
  PolymorphicRef,
} from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/form-text-field';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import {
  getMetaMaskAccountsOrdered,
  getMetaMaskHdKeyrings,
  getSelectedKeyringByIdOrDefault,
  getHdKeyringIndexByIdOrDefault,
} from '../../../selectors';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Display } from '../../../helpers/constants/design-system';
import { SelectSrp } from '../multi-srp/select-srp/select-srp';
import { getSnapAccountsByKeyringId } from '../../../selectors/multi-srp/multi-srp';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';

type Props = {
  /**
   * Callback to get the next available account name.
   */
  getNextAvailableAccountName: (accounts: InternalAccount[]) => Promise<string>;

  /**
   * Callback to create the account.
   */
  onCreateAccount: (name: string) => Promise<void>;

  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean) => Promise<void>;

  /**
   * The scope of the account
   */
  scope?: CaipChainId;

  /**
   * Callback to select the SRP
   */
  onSelectSrp?: () => void;
  selectedKeyringId?: string;
};

type CreateAccountProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, Props>;

type CreateAccountComponent = <C extends React.ElementType = 'form'>(
  props: CreateAccountProps<C>,
) => React.ReactElement | null;

export const CreateAccount: CreateAccountComponent = React.memo(
  React.forwardRef(
    <C extends React.ElementType = 'form'>(
      {
        getNextAvailableAccountName,
        onCreateAccount,
        onSelectSrp,
        selectedKeyringId,
        onActionComplete,
        scope,
      }: CreateAccountProps<C>,
      ref?: PolymorphicRef<C>,
    ) => {
      const t = useI18nContext();

      const history = useHistory();
      const trackEvent = useContext(MetaMetricsContext);
      const hdEntropyIndex = useSelector(getHDEntropyIndex);

      const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

      const accounts: InternalAccount[] = useSelector(
        getMetaMaskAccountsOrdered,
      );

      const [loading, setLoading] = useState(false);
      const [defaultAccountName, setDefaultAccountName] = useState('');
      // We are not using `accounts` as a dependency here to avoid having the input
      // updating when the new account will be created.
      useEffect(() => {
        getNextAvailableAccountName(accounts).then(setDefaultAccountName);
      }, []);

      const [newAccountName, setNewAccountName] = useState('');
      const trimmedAccountName = newAccountName.trim();

      const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
        accounts,
        { t },
        trimmedAccountName || defaultAccountName,
        defaultAccountName,
      );
      const hdKeyrings: {
        accounts: InternalAccount[];
        type: KeyringTypes;
        metadata: { id: string; name: string };
      }[] = useSelector(getMetaMaskHdKeyrings);

      const selectedKeyring = useSelector((state) =>
        getSelectedKeyringByIdOrDefault(state, selectedKeyringId),
      );
      const firstPartySnapAccounts = useSelector((state) =>
        getSnapAccountsByKeyringId(state, selectedKeyringId),
      );

      const selectedHdKeyringIndex = useSelector((state) =>
        getHdKeyringIndexByIdOrDefault(state, selectedKeyringId),
      );

      const onSubmit = useCallback(
        async (event: KeyboardEvent<HTMLFormElement>) => {
          setLoading(true);
          event.preventDefault();
          try {
            trace({ name: TraceName.CreateAccount });
            await onCreateAccount(trimmedAccountName || defaultAccountName);
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.AccountAdded,
              properties: {
                account_type: MetaMetricsEventAccountType.Default,
                location: 'Home',
                hd_entropy_index: hdEntropyIndex,
                chain_id_caip: scope,
                is_suggested_name:
                  !trimmedAccountName ||
                  trimmedAccountName === defaultAccountName,
              },
            });
            history.push(mostRecentOverviewPage);
          } catch (error) {
            if (selectedKeyringId) {
              trackEvent({
                category: MetaMetricsEventCategory.Accounts,
                event: MetaMetricsEventName.AccountImportFailed,
                properties: {
                  account_type: MetaMetricsEventAccountType.Imported,
                  error: (error as Error).message,
                  hd_entropy_index: hdEntropyIndex,
                  chain_id_caip: scope,
                },
              });
            } else {
              trackEvent({
                category: MetaMetricsEventCategory.Accounts,
                event: MetaMetricsEventName.AccountAddFailed,
                properties: {
                  account_type: MetaMetricsEventAccountType.Default,
                  error: (error as Error).message,
                  hd_entropy_index: hdEntropyIndex,
                  chain_id_caip: scope,
                },
              });
            }
          } finally {
            endTrace({ name: TraceName.CreateAccount });
          }
        },
        [trimmedAccountName, defaultAccountName, mostRecentOverviewPage],
      );

      return (
        <Box as="form" onSubmit={onSubmit}>
          <FormTextField
            data-testid="account-name-input"
            ref={ref}
            size={FormTextFieldSize.Lg}
            gap={2}
            autoFocus
            id="account-name"
            label={t('accountName')}
            placeholder={defaultAccountName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewAccountName(e.target.value)
            }
            helpText={errorMessage}
            error={!isValidAccountName}
            onKeyPress={(e: KeyboardEvent<HTMLFormElement>) => {
              if (e.key === 'Enter') {
                onSubmit(e);
              }
            }}
          />
          {hdKeyrings.length > 1 && onSelectSrp && selectedKeyring ? (
            <Box marginBottom={3}>
              <SelectSrp
                onClick={onSelectSrp}
                srpName={t('secretRecoveryPhrasePlusNumber', [
                  selectedHdKeyringIndex + 1,
                ])}
                srpAccounts={
                  selectedKeyring.accounts.length +
                  firstPartySnapAccounts.length
                }
              />
            </Box>
          ) : null}
          <Box display={Display.Flex} marginTop={1} gap={2}>
            <ButtonSecondary
              data-testid="cancel-add-account-with-name"
              type={
                'button' /* needs to be 'button' to prevent submitting form on cancel */
              }
              onClick={async () => await onActionComplete(false)}
              block
            >
              {t('cancel')}
            </ButtonSecondary>
            <ButtonPrimary
              data-testid="submit-add-account-with-name"
              type="submit"
              disabled={!isValidAccountName || loading}
              loading={loading}
              block
            >
              {t('addAccount')}
            </ButtonPrimary>
          </Box>
        </Box>
      );
    },
  ),
);
