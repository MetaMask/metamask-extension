import React from 'react';
import CustodyLabels from '../../../components/institutional/custody-labels';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../../components/ui/tooltip';
import {
  TextVariant,
  JustifyContent,
  BlockSize,
  Display,
  IconColor,
  FlexDirection,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  Button,
  Label,
  Icon,
  IconName,
  IconSize,
  ButtonLink,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { Account } from '../custody/custody';

type CustodyAccountListProps = {
  rawList?: boolean;
  accounts: Account[] | null | undefined;
  onAccountChange?: (account: Account) => void;
  selectedAccounts?: { [key: string]: boolean };
  onCancel?: () => void;
  onAddAccounts?: (custody?: string) => void;
  custody?: string | null;
  children?: React.ReactNode;
};

const getButtonLinkHref = (account: Account) => {
  const url = SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[CHAIN_IDS.MAINNET];
  return `${url}address/${account.address}`;
};

const CustodyAccountList: React.FC<CustodyAccountListProps> = ({
  rawList,
  accounts,
  onAccountChange,
  selectedAccounts,
  onCancel,
  onAddAccounts,
  custody,
  children,
}) => {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();
  const tooltipText = copied ? t('copiedExclamation') : t('copyToClipboard');
  const disabled =
    !selectedAccounts || Object.keys(selectedAccounts).length === 0;

  return (
    <Box className="page-container">
      <Box padding={4} className="page-container__content">
        {children}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
          className="custody-account-list"
          data-testid="custody-account-list"
        >
          {accounts
            ?.sort((a, b) =>
              a.name
                .toLocaleLowerCase()
                .localeCompare(b.name.toLocaleLowerCase()),
            )
            .map((account, idx) => (
              <Box
                display={Display.Flex}
                className="custody-account-list__item"
                key={account.address}
              >
                <Box
                  display={Display.Flex}
                  alignItems={AlignItems.flexStart}
                  data-testid="custody-account-list-item-radio-button"
                >
                  {!rawList && (
                    <input
                      type="checkbox"
                      name="selectedAccount"
                      id={`address-${idx}`}
                      onChange={() =>
                        onAccountChange &&
                        onAccountChange({
                          name: account.name,
                          address: account.address,
                          custodianDetails: account.custodianDetails,
                          labels: account.labels,
                          chainId: account.chainId,
                        })
                      }
                      checked={selectedAccounts?.[account.address] || false}
                    />
                  )}
                </Box>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  marginLeft={2}
                  width={BlockSize.Full}
                >
                  <Label
                    display={Display.Flex}
                    marginTop={2}
                    htmlFor={`address-${idx}`}
                    className="custody-account-list__item__title"
                  >
                    <Text
                      as="span"
                      variant={TextVariant.inherit}
                      paddingRight={1}
                      className="custody-account-list__item__name"
                    >
                      {account.name}
                    </Text>
                  </Label>
                  <Label
                    display={Display.Flex}
                    marginTop={2}
                    marginLeft={2}
                    marginRight={3}
                    htmlFor={`address-${idx}`}
                  >
                    <Text
                      as="span"
                      variant={TextVariant.bodyMd}
                      display={Display.Flex}
                      className="custody-account-list__item"
                    >
                      <ButtonLink
                        href={getButtonLinkHref(account)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {shortenAddress(account.address)}
                        <Icon
                          name={IconName.Export}
                          size={IconSize.Sm}
                          color={IconColor.primaryDefault}
                          marginLeft={1}
                        />
                      </ButtonLink>
                      <Tooltip
                        position="bottom"
                        title={tooltipText}
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <button
                          className="custody-account-list__item__clipboard"
                          onClick={() => handleCopy(account.address)}
                        >
                          <Icon
                            name={IconName.Copy}
                            size={IconSize.Xs}
                            color={IconColor.iconMuted}
                          />
                        </button>
                      </Tooltip>
                    </Text>
                  </Label>
                  <Box
                    display={Display.Flex}
                    justifyContent={JustifyContent.spaceBetween}
                  >
                    {account.labels && (
                      <CustodyLabels
                        labels={account.labels}
                        index={idx.toString()}
                        hideNetwork
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
        </Box>
      </Box>
      {!rawList && (
        <Box as="footer" className="page-container__footer" padding={4}>
          <Box display={Display.Flex} gap={4}>
            <Button
              data-testid="custody-account-cancel-button"
              block
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              className="custody-account-list__button"
              onClick={onCancel}
            >
              {t('cancel')}
            </Button>
            <Button
              data-testid="custody-account-connect-button"
              block
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="custody-account-list__button"
              disabled={disabled}
              onClick={() => onAddAccounts && custody && onAddAccounts(custody)}
            >
              {t('connect')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustodyAccountList;
