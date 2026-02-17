/**
 * Token Selector Component
 *
 * Component for selecting a payment token for mUSD conversion.
 */

///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  Modal,
  ModalHeader,
  ModalContent,
  ModalOverlay,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextVariant,
  FontWeight,
  BlockSize,
} from '../../../helpers/constants/design-system';
import type { ConvertibleToken } from '../types';
import {
  selectMusdConvertibleTokensAllowlist,
  selectMusdConvertibleTokensBlocklist,
  selectMusdMinAssetBalanceRequired,
} from '../../../selectors/musd';
import { formatMusdAmount } from '../../../../shared/lib/musd';

// ============================================================================
// Types
// ============================================================================

type TokenSelectorProps = {
  /** Currently selected token */
  selectedToken: ConvertibleToken | null;
  /** Callback when token is selected */
  onSelect: (token: ConvertibleToken | null) => void;
  /** Available tokens to choose from */
  availableTokens?: ConvertibleToken[];
};

// ============================================================================
// Mock Data (Replace with actual data in production)
// ============================================================================

const MOCK_TOKENS: ConvertibleToken[] = [
  {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as `0x${string}`,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: '0x1' as `0x${string}`,
    balance: '500000000', // 500 USDC
    fiatBalance: '500',
  },
  {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7' as `0x${string}`,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: '0x1' as `0x${string}`,
    balance: '250000000', // 250 USDT
    fiatBalance: '250',
  },
  {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f' as `0x${string}`,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: '0x1' as `0x${string}`,
    balance: '100000000000000000000', // 100 DAI
    fiatBalance: '100',
  },
];

// ============================================================================
// Component
// ============================================================================

/**
 * Token Selector Component
 *
 * @param options0
 * @param options0.selectedToken
 * @param options0.onSelect
 * @param options0.availableTokens
 */
const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onSelect,
  availableTokens = MOCK_TOKENS,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const minBalance = useSelector(selectMusdMinAssetBalanceRequired);

  /**
   * Handle token selection
   */
  const handleTokenSelect = useCallback(
    (token: ConvertibleToken) => {
      onSelect(token);
      setIsModalOpen(false);
    },
    [onSelect],
  );

  /**
   * Open token selector modal
   */
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  /**
   * Close token selector modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Filter tokens based on minimum balance
  const eligibleTokens = availableTokens.filter(
    (token) => parseFloat(token.fiatBalance) >= minBalance,
  );

  return (
    <>
      {/* Token selector button */}
      <Box>
        <Text variant={TextVariant.bodySmBold} marginBottom={2}>
          Pay with
        </Text>

        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={handleOpenModal}
          block
          data-testid="musd-token-selector-button"
        >
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            width={BlockSize.Full}
          >
            {selectedToken ? (
              <>
                <Box
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  gap={2}
                >
                  <Box
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-background-alternative)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text variant={TextVariant.bodySm}>
                      {selectedToken.symbol.charAt(0)}
                    </Text>
                  </Box>
                  <Box>
                    <Text variant={TextVariant.bodyMdBold}>
                      {selectedToken.symbol}
                    </Text>
                    <Text
                      variant={TextVariant.bodyXs}
                      color="var(--color-text-alternative)"
                    >
                      ${formatMusdAmount(selectedToken.fiatBalance)}
                    </Text>
                  </Box>
                </Box>
                <Text
                  variant={TextVariant.bodySm}
                  color="var(--color-text-alternative)"
                >
                  Change ▼
                </Text>
              </>
            ) : (
              <Text
                variant={TextVariant.bodyMd}
                color="var(--color-text-alternative)"
              >
                Select a token ▼
              </Text>
            )}
          </Box>
        </Button>
      </Box>

      {/* Token selector modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        data-testid="musd-token-selector-modal"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleCloseModal}>Select Token</ModalHeader>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
            padding={4}
          >
            {eligibleTokens.length > 0 ? (
              eligibleTokens.map((token) => (
                <Box
                  key={`${token.chainId}-${token.address}`}
                  as="button"
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                  alignItems={AlignItems.center}
                  padding={3}
                  style={{
                    backgroundColor:
                      selectedToken?.address === token.address
                        ? 'var(--color-primary-muted)'
                        : 'var(--color-background-alternative)',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                  onClick={() => handleTokenSelect(token)}
                  data-testid={`musd-token-option-${token.symbol}`}
                >
                  <Box
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    gap={3}
                  >
                    <Box
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-background-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text variant={TextVariant.bodyMd}>
                        {token.symbol.charAt(0)}
                      </Text>
                    </Box>
                    <Box>
                      <Text variant={TextVariant.bodyMdBold}>
                        {token.symbol}
                      </Text>
                      <Text
                        variant={TextVariant.bodySm}
                        color="var(--color-text-alternative)"
                      >
                        {token.name}
                      </Text>
                    </Box>
                  </Box>

                  <Box style={{ textAlign: 'right' }}>
                    <Text variant={TextVariant.bodyMdBold}>
                      ${formatMusdAmount(token.fiatBalance)}
                    </Text>
                  </Box>
                </Box>
              ))
            ) : (
              <Box padding={4}>
                <Text
                  variant={TextVariant.bodyMd}
                  color="var(--color-text-alternative)"
                  textAlign="center"
                >
                  No eligible tokens found. Tokens must have a minimum balance
                  of ${minBalance}.
                </Text>
              </Box>
            )}
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TokenSelector;
///: END:ONLY_INCLUDE_IF
