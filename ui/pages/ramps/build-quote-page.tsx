import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
  TextField,
  TextFieldType,
} from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { RAMPS_ROUTE } from '../../helpers/constants/routes';
import useRampsController from '../../hooks/ramps/useRampsController';
import type { Quote, QuotesResponse } from '../../hooks/ramps/types';

// Placeholder destination address — wired to the real account selector once the
// data layer is connected.
const STUB_WALLET_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Build-quote page — second step of the money-movement (buy) flow.
 *
 * Shows the token chosen on the token page, lets the user enter an amount and
 * payment method, then fetches quotes. Tapping the token row returns to the
 * token page to change the selection. Wired to the stubbed `useRampsController`.
 */
function BuildQuotePage() {
  const navigate = useNavigate();
  const ramps = useRampsController();
  const {
    selectedToken,
    paymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    userRegion,
  } = ramps;

  const [amount, setAmount] = useState('100');
  const [quotes, setQuotes] = useState<QuotesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const currency = userRegion?.country.currency ?? 'USD';

  const goToTokenPage = () => navigate(RAMPS_ROUTE);

  const handleGetQuotes = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await ramps.getQuotes({
        amount: Number(amount) || 0,
        assetId: selectedToken?.assetId,
        walletAddress: STUB_WALLET_ADDRESS,
        region: userRegion?.regionCode,
        paymentMethods: selectedPaymentMethod
          ? [selectedPaymentMethod.id]
          : undefined,
      });
      setQuotes(result);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Failed to get quotes',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (quote: Quote) => {
    setStatus(null);
    try {
      const widget = await ramps.getBuyWidgetData(quote);
      if (widget?.url) {
        global.platform.openTab({ url: widget.url });
        setStatus(`Opening ${quote.provider} checkout…`);
      } else {
        setStatus('No checkout URL returned for this quote.');
      }
    } catch (caught) {
      setStatus(
        caught instanceof Error ? caught.message : 'Failed to start purchase',
      );
    }
  };

  return (
    <Page>
      <Header
        startAccessory={
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            ariaLabel="Back"
            onClick={goToTokenPage}
          />
        }
      >
        Buy crypto
      </Header>
      <Content>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
        >
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {userRegion?.country.name ?? 'Unknown region'} (
            {userRegion?.regionCode ?? '—'})
          </Text>

          {/* Selected token — tap to change */}
          <Box
            as="button"
            onClick={goToTokenPage}
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            padding={3}
            borderRadius={BorderRadius.LG}
            borderColor={BorderColor.borderMuted}
            backgroundColor={BackgroundColor.transparent}
            style={{ cursor: 'pointer', width: '100%', textAlign: 'left' }}
            data-testid="ramps-selected-token"
          >
            <Box display={Display.Flex} alignItems={AlignItems.center} gap={3}>
              <AvatarToken
                name={selectedToken?.symbol ?? '?'}
                src={selectedToken?.iconUrl || undefined}
                size={AvatarTokenSize.Md}
              />
              <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
                <Text variant={TextVariant.bodyMdMedium}>
                  {selectedToken?.name ?? 'Select a token'}
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {selectedToken?.symbol ?? 'Tap to choose'}
                </Text>
              </Box>
            </Box>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.iconAlternative}
            />
          </Box>

          {/* Amount */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={1}
          >
            <Text variant={TextVariant.bodySmMedium}>Amount ({currency})</Text>
            <TextField
              type={TextFieldType.Number}
              value={amount}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(event.target.value)
              }
              placeholder="0"
              data-testid="ramps-amount-input"
            />
          </Box>

          {/* Payment method */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={1}
          >
            <Text variant={TextVariant.bodySmMedium}>Pay with</Text>
            {paymentMethods.map((method) => {
              const isSelected = method.id === selectedPaymentMethod?.id;
              return (
                <Box
                  key={method.id}
                  as="button"
                  onClick={() => setSelectedPaymentMethod(method)}
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  justifyContent={JustifyContent.spaceBetween}
                  padding={3}
                  borderRadius={BorderRadius.LG}
                  borderColor={
                    isSelected
                      ? BorderColor.primaryDefault
                      : BorderColor.borderMuted
                  }
                  backgroundColor={BackgroundColor.transparent}
                  style={{
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  data-testid={`ramps-payment-${method.paymentType}`}
                >
                  <Text variant={TextVariant.bodyMd}>{method.name}</Text>
                  {isSelected ? (
                    <Icon
                      name={IconName.Check}
                      size={IconSize.Sm}
                      color={IconColor.primaryDefault}
                    />
                  ) : null}
                </Box>
              );
            })}
          </Box>

          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            block
            loading={loading}
            onClick={handleGetQuotes}
            data-testid="ramps-get-quotes"
          >
            {loading ? 'Getting quotes…' : 'Get quotes'}
          </Button>

          {error ? (
            <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
              {error}
            </Text>
          ) : null}
          {status ? (
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
            >
              {status}
            </Text>
          ) : null}

          {/* Quotes */}
          {quotes ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              <Text variant={TextVariant.bodyMdMedium}>Quotes</Text>
              {quotes.success.length === 0 ? (
                <Text color={TextColor.textAlternative}>
                  No quotes available.
                </Text>
              ) : (
                quotes.success.map((quote) => {
                  const isBestRate = quote.metadata?.tags?.isBestRate ?? false;
                  return (
                    <Box
                      key={quote.provider}
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      gap={2}
                      padding={4}
                      borderRadius={BorderRadius.LG}
                      borderColor={BorderColor.borderMuted}
                    >
                      <Box
                        display={Display.Flex}
                        alignItems={AlignItems.center}
                        justifyContent={JustifyContent.spaceBetween}
                      >
                        <Text variant={TextVariant.bodyMdMedium}>
                          {quote.provider.replace('/providers/', '')}
                        </Text>
                        {isBestRate ? (
                          <Text
                            variant={TextVariant.bodyXs}
                            color={TextColor.successDefault}
                          >
                            Best rate
                          </Text>
                        ) : null}
                      </Box>
                      <Text
                        variant={TextVariant.bodySm}
                        color={TextColor.textAlternative}
                      >
                        You get ≈ {String(quote.quote.amountOut)}{' '}
                        {selectedToken?.symbol ?? ''}
                      </Text>
                      <Text
                        variant={TextVariant.bodySm}
                        color={TextColor.textAlternative}
                      >
                        Total fees: {String(quote.quote.totalFees ?? '—')}
                      </Text>
                      <Button
                        variant={ButtonVariant.Secondary}
                        size={ButtonSize.Sm}
                        onClick={() => handleBuy(quote)}
                        data-testid={`ramps-buy-${quote.provider.replace('/providers/', '')}`}
                      >
                        Buy with {amount} {currency}
                      </Button>
                    </Box>
                  );
                })
              )}
            </Box>
          ) : null}
        </Box>
      </Content>
    </Page>
  );
}

export default BuildQuotePage;
