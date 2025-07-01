import React, { useState, useCallback, ReactElement } from 'react';
import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
  TextField,
  TextFieldType,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { ButtonSize } from '../../../components/component-library/button/button.types';
import { useSelector } from 'react-redux';
import {
  getSelectedAddress,
  selectDefaultRpcEndpointByChainId,
} from '../../../selectors';
import { useAddTransaction } from '../../confirmations/hooks/transactions/useAddTransaction';
import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';

const USDC_ARBITRUM = '0xaf88d065e77c8cc2239327c5edb3a432268e5831';
const HYPERLIQUID_BRIDGE = '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7';

export function HyperliquidTest() {
  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Hyperliquid
      </Text>
      <div className="settings-page__content-padded">
        <Deposit />
      </div>
    </>
  );
}

function Deposit() {
  const [amount, setAmount] = useState<number>();
  const selectedAddress = useSelector(getSelectedAddress);
  const { addTransaction } = useAddTransaction();
  const amountHex = toHex(amount ?? 1000000);

  const defaultRpc = useSelector((state) =>
    selectDefaultRpcEndpointByChainId(state, CHAIN_IDS.ARBITRUM),
  );

  const networkClientId = defaultRpc?.networkClientId ?? 'mainnet';

  const data = new Interface(abiERC20).encodeFunctionData('transfer', [
    HYPERLIQUID_BRIDGE,
    amountHex,
  ]);

  const handleClick = useCallback(async () => {
    await addTransaction(
      {
        data,
        from: selectedAddress,
        gas: toHex(80000),
        to: USDC_ARBITRUM,
      },
      {
        networkClientId,
      },
    );
  }, [addTransaction, data, networkClientId, selectedAddress]);

  return (
    <>
      <TestButton
        name="Deposit"
        description={<span>Deposit balance to Hyperliquid.</span>}
        onClick={handleClick}
      >
        <TextField
          type={TextFieldType.Number}
          placeholder="Amount"
          marginBottom={2}
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value, 10))}
        />
      </TestButton>
    </>
  );
}

function TestButton({
  children,
  name,
  description,
  onClick,
  expectError,
  testId,
}: {
  children?: ReactElement;
  name: string;
  description: ReactElement;
  onClick: () => Promise<void>;
  expectError?: boolean;
  testId?: string;
}) {
  const [isComplete, setIsComplete] = useState(false);

  const handleClick = useCallback(async () => {
    let hasError = false;

    try {
      await onClick();
    } catch (error) {
      hasError = true;
      throw error;
    } finally {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      if (expectError || !hasError) {
        setIsComplete(true);
      }
    }
  }, [onClick]);

  return (
    <Box
      className="settings-page__content-row"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      gap={4}
    >
      <div className="settings-page__content-item">
        <div className="settings-page__content-description">{description}</div>
      </div>
      <div className="settings-page__content-item-col">
        {children}
        <Button
          variant={ButtonVariant.Primary}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={handleClick}
          size={ButtonSize.Lg}
          data-testid={testId}
        >
          {name}
        </Button>
      </div>
      <div className="settings-page__content-item-col">
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          paddingLeft={2}
          paddingRight={2}
          style={{ height: '40px', width: '40px' }}
        >
          <Icon
            className="settings-page-developer-options__icon-check"
            name={IconName.Check}
            color={IconColor.successDefault}
            size={IconSize.Lg}
            hidden={!isComplete}
          />
        </Box>
      </div>
    </Box>
  );
}
