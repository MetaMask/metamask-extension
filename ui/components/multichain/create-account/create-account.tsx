import React, {
  ChangeEvent,
  KeyboardEvent,
  KeyboardEventHandler,
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
  onActionComplete: (
    completed: boolean,
    newAccount?: InternalAccount,
  ) => Promise<void>;

  /**
   * The scope of the account
   */
  scope?: CaipChainId;

  /**
   * Callback to select the SRP
   */
  onSelectSrp?: () => void;
  selectedKeyringId?: string;
  redirectToOverview?: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type CreateAccountProps<C extends React.ElementType> =
  PolymorphicComponentPropWithRef<C, Props>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type CreateAccountComponent = <C extends React.ElementType = 'form'>(
  props: CreateAccountProps<C>,
) => React.ReactElement | null;

export const CreateAccount: CreateAccountComponent = React.memo(
  React.forwardRef(
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    <C extends React.ElementType = 'form'>(
      {
        getNextAvailableAccountName,
        onCreateAccount,
        onSelectSrp,
        selectedKeyringId,
        onActionComplete,
        scope,
        redirectToOverview = true,
      }: CreateAccountProps<C>,
      ref?: PolymorphicRef<C>,
    ) => {
      const t = useI18nContext();

      const history = useHistory();
      const { trackEvent } = useContext(MetaMetricsContext);
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
      const [creationError, setCreationError] = useState('');
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
          setCreationError('');
          event.preventDefault();
          try {
            trace({ name: TraceName.CreateAccount });
            await onCreateAccount(trimmedAccountName || defaultAccountName);
            trackEvent({
              category: MetaMetricsEventCategory.Accounts,
              event: MetaMetricsEventName.AccountAdded,
              properties: {
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                account_type: MetaMetricsEventAccountType.Default,
                location: 'Home',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                hd_entropy_index: hdEntropyIndex,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                chain_id_caip: scope,
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                is_suggested_name:
                  !trimmedAccountName ||
                  trimmedAccountName === defaultAccountName,
              },
            });
            if (redirectToOverview) {
              history.push(mostRecentOverviewPage);
            }
          } catch (error) {
            setLoading(false);
            let message = 'An unexpected error occurred.';
            if (error instanceof Error) {
              message = (error as Error).message;
            }
            setCreationError(message);

            if (selectedKeyringId) {
              trackEvent({
                category: MetaMetricsEventCategory.Accounts,
                event: MetaMetricsEventName.AccountImportFailed,
                properties: {
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  account_type: MetaMetricsEventAccountType.Imported,
                  error: message,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  hd_entropy_index: hdEntropyIndex,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  chain_id_caip: scope,
                },
              });
            } else {
              trackEvent({
                category: MetaMetricsEventCategory.Accounts,
                event: MetaMetricsEventName.AccountAddFailed,
                properties: {
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  account_type: MetaMetricsEventAccountType.Default,
                  error: message,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  hd_entropy_index: hdEntropyIndex,
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        <Box as="form" onSubmit={onSubmit}>
          <FormTextField
            data-testid="account-name-input"
            inputRef={ref}
            size={FormTextFieldSize.Lg}
            gap={2}
            autoFocus
            id="account-name"
            label={t('accountName')}
            placeholder={defaultAccountName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewAccountName(e.target.value)
            }
            helpText={creationError || errorMessage}
            error={!isValidAccountName || Boolean(creationError)}
            onKeyPress={
              ((e: KeyboardEvent<HTMLFormElement>) => {
                if (e.key === 'Enter') {
                  onSubmit(e);
                }
              }) as unknown as KeyboardEventHandler<HTMLDivElement>
            }
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
