import c from 'crypto';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Wallet } from 'ethers';
import copyToClipboard from 'copy-to-clipboard';
import browser from 'webextension-polyfill';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { RampClient, Signature, EthPersonalSignature } from './ramp';
import {
  GetAccountInfoRequest,
  IbanCoordinates as IBAN,
  ScanCoordinates as SCAN,
} from './gen/ramp/v1/public_pb';

type IbanCoordinates = {
  iban: string;
};

type ScanCoordinates = {
  accountNumber: string;
  sortCode: string;
};

type BankCoordinates = IbanCoordinates | ScanCoordinates;

type BankDetails = {
  coordinates?: BankCoordinates;
  accountHolder?: string;
  reference?: string;
};

type Authentication = {
  authenticationUrl: string;
};

function isIban(coord?: BankCoordinates): boolean {
  return (coord as IbanCoordinates).iban !== undefined;
}

function accountNumber(coord?: BankCoordinates): string {
  if (!coord) {
    return '';
  }
  return isIban(coord)
    ? (coord as IbanCoordinates).iban
    : (coord as ScanCoordinates).accountNumber;
}

async function getHarbourWallet(): Promise<Wallet> {
  const pk = await browser.storage.local.get('harbourKey');
  if (pk.harbourKey) {
    console.log('harbour key found');
    return new Wallet(pk.harbourKey);
  }
  console.log('harbour key not found, generating new', pk);
  const key = `0x${c.randomBytes(32).toString('hex')}`;
  await browser.storage.local.set({ harbourKey: key });
  return new Wallet(key);
}

const signPayload = (wallet: Wallet, payload: string): Promise<string> => {
  const sig = wallet.signMessage(payload);
  console.log('Signature:', sig);
  return sig;
};

const BankPage: React.FC = () => {
  const history = useHistory();
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [authentication, setAuthentication] = useState<Authentication | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBankDetails = async () => {
      try {
        const ramp = new RampClient(
          'https://api.harborapp.link',
          async (payload): Promise<Signature> => {
            const wallet = await getHarbourWallet();
            const sig = await signPayload(wallet, payload);
            return Promise.resolve({
              signature: sig,
              publicKey: wallet.publicKey,
              ...EthPersonalSignature,
            });
          },
        );
        const accountInfo = await ramp.getAccountInfo(
          new GetAccountInfoRequest(),
        );
        setBankDetails({});
        console.log(accountInfo);
        if (accountInfo.result.case === 'authentication') {
          setAuthentication({
            authenticationUrl: accountInfo.result.value.authenticationUrl,
          });
        } else {
          const apiCoordinates =
            accountInfo.result.value?.onrampBankAccount.value;
          const accountHolder = accountInfo.result.value?.accountHolder ?? '';
          const reference = 'PUSDC1';
          if (apiCoordinates instanceof IBAN) {
            setBankDetails({
              coordinates: {
                iban: (apiCoordinates as IbanCoordinates).iban,
              },
              reference,
              accountHolder,
            });
          } else if (apiCoordinates instanceof SCAN) {
            setBankDetails({
              coordinates: {
                accountNumber: (apiCoordinates as ScanCoordinates)
                  .accountNumber,
                sortCode: (apiCoordinates as ScanCoordinates).sortCode,
              },
              reference,
              accountHolder,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBankDetails();
  }, []);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  if (error) {
    return <Text color={TextColor.errorDefault}>{error}</Text>;
  }
  if (!bankDetails) {
    return null;
  }

  const handleCopy = (text?: string): void => {
    if (!text) {
      return;
    }
    copyToClipboard(text);
  };

  return (
    <Box className="iban-details" padding={4}>
      <Button
        onClick={() => history.goBack()}
        size={ButtonSize.Sm}
        variant={ButtonVariant.Secondary}
      >
        Back
      </Button>
      {authentication && (
        <Box>
          <Text variant={TextVariant.headingLg} marginBottom={4}>
            Connect Harbour Account
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            <a
              href={authentication.authenticationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Harbour.fi
            </a>
          </Text>
        </Box>
      )}
      {bankDetails.coordinates && (
        <Box>
          <Text variant={TextVariant.headingLg} marginBottom={4}>
            Account Details
          </Text>
          <Text
            marginTop={4}
            variant={TextVariant.headingMd}
            color={TextColor.textDefault}
          >
            {isIban(bankDetails.coordinates) ? 'IBAN' : 'Account Number'}
          </Text>
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Text variant={TextVariant.bodyMd}>
              {accountNumber(bankDetails?.coordinates)}
            </Text>
            <Button
              onClick={() =>
                handleCopy(accountNumber(bankDetails?.coordinates))
              }
              size={ButtonSize.Sm}
              variant={ButtonVariant.Secondary}
            >
              Copy
            </Button>
          </Box>
          {!isIban(bankDetails.coordinates) && (
            <Box>
              <Text
                marginTop={4}
                variant={TextVariant.headingMd}
                color={TextColor.textDefault}
              >
                Sort Code
              </Text>
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={2}
              >
                <Text variant={TextVariant.bodyMd}>
                  {(bankDetails.coordinates as ScanCoordinates).sortCode}
                </Text>
                <Button
                  onClick={() =>
                    handleCopy(
                      (bankDetails.coordinates as ScanCoordinates).sortCode,
                    )
                  }
                  size={ButtonSize.Sm}
                  variant={ButtonVariant.Secondary}
                >
                  Copy
                </Button>
              </Box>
            </Box>
          )}
          <Text
            marginTop={4}
            variant={TextVariant.headingMd}
            color={TextColor.textDefault}
          >
            Account Holder
          </Text>
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Text variant={TextVariant.bodyMd}>
              {bankDetails.accountHolder}
            </Text>
            <Button
              onClick={() => handleCopy(bankDetails.accountHolder)}
              size={ButtonSize.Sm}
              variant={ButtonVariant.Secondary}
            >
              Copy
            </Button>
          </Box>
          <Text
            marginTop={4}
            variant={TextVariant.headingMd}
            color={TextColor.textDefault}
          >
            Payment Reference
          </Text>
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            <Text variant={TextVariant.bodyMd}>{bankDetails.reference}</Text>
            <Button
              onClick={() => handleCopy(bankDetails.reference)}
              size={ButtonSize.Sm}
              variant={ButtonVariant.Secondary}
            >
              Copy
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BankPage;
