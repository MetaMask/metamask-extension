/**
 * MUSD Geo-Blocked Screen
 *
 * Screen shown to users in blocked regions (e.g., UK).
 */

///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextVariant,
  TextAlign,
  FontWeight,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useMusdGeoBlocking } from '../../../hooks/musd';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

/**
 * MUSD Geo-Blocked Screen Component
 */
const MusdGeoBlockedScreen: React.FC = () => {
  const navigate = useNavigate();
  const { blockedMessage, userCountry } = useMusdGeoBlocking();

  /**
   * Handle close button click
   */
  const handleClose = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  return (
    <Box
      className="musd-geo-blocked-screen"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Full}
      padding={4}
    >
      {/* Header */}
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        marginBottom={4}
      >
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Sm}
          onClick={handleClose}
          data-testid="musd-geo-blocked-close-button"
        >
          Close
        </Button>
      </Box>

      {/* Main content */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        style={{ flex: 1 }}
      >
        {/* Icon */}
        <Box marginBottom={4}>
          <Box
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-warning-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              variant={TextVariant.headingLg}
              color="var(--color-warning-default)"
            >
              🌍
            </Text>
          </Box>
        </Box>

        {/* Title */}
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
          marginBottom={2}
        >
          Not Available in Your Region
        </Text>

        {/* Message */}
        <Text
          variant={TextVariant.bodyMd}
          color="var(--color-text-alternative)"
          textAlign={TextAlign.Center}
          marginBottom={6}
        >
          {blockedMessage || 'mUSD conversion is not available in your region.'}
        </Text>

        {/* Additional info */}
        <Box
          padding={4}
          style={{
            backgroundColor: 'var(--color-background-alternative)',
            borderRadius: '8px',
            maxWidth: '320px',
          }}
        >
          <Text
            variant={TextVariant.bodySm}
            color="var(--color-text-alternative)"
            textAlign={TextAlign.Center}
          >
            Due to regulatory requirements, mUSD conversion is currently not
            available in certain regions. We're working to expand availability.
          </Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={4}>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={handleClose}
          block
          data-testid="musd-geo-blocked-return-button"
        >
          Return to Wallet
        </Button>
      </Box>
    </Box>
  );
};

export default MusdGeoBlockedScreen;
///: END:ONLY_INCLUDE_IF
