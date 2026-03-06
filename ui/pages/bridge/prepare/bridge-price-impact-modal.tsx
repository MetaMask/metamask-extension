import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AlignItems } from '../../../helpers/constants/design-system';
import {
  getBridgeQuotes,
  getFormattedPriceImpact,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { Column, Row } from '../layout';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';

export const BridgePriceImpactWarningModal = ({
  variant,
  onClose,
}: {
  variant: 'submit-cta' | 'quote-card' | null;
  onClose: () => void;
}) => {
  const t = useI18nContext();

  const { submitBridgeTransaction, isSubmitting } =
    useSubmitBridgeTransaction();
  const { activeQuote } = useSelector(getBridgeQuotes);
  const { isPriceImpactError, isPriceImpactWarning } =
    useSelector(getValidationErrors);
  const formattedPriceImpact = useSelector(getFormattedPriceImpact);

  const shouldShowModal = useMemo(() => {
    // Hide the modal if the user closes it or if it has not been opened
    if (variant === null) {
      return false;
    }
    // Only show the modal during submission if there is a price impact error
    if (variant === 'submit-cta' && !isPriceImpactError) {
      return false;
    }
    // Only show the modal on the quote card if there is a price impact warning or error
    if (
      variant === 'quote-card' &&
      !isPriceImpactError &&
      !isPriceImpactWarning
    ) {
      return false;
    }
    // Otherwise, keep the modal open
    return true;
  }, [variant, isPriceImpactError, isPriceImpactWarning]);

  const shouldAllowClose = !(isSubmitting && variant === 'submit-cta');

  return (
    <Modal
      isOpen={shouldShowModal}
      onClose={onClose}
      isClosedOnEscapeKey={shouldAllowClose}
      isClosedOnOutsideClick={shouldAllowClose}
      className="bridge-price-impact-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            disabled: isSubmitting && variant === 'submit-cta',
          }}
        >
          <Column alignItems={AlignItems.center} gap={2}>
            <Icon
              name={isPriceImpactError ? IconName.Danger : IconName.Warning}
              size={IconSize.Xl}
              color={
                isPriceImpactError
                  ? IconColor.ErrorDefault
                  : IconColor.WarningDefault
              }
            />
            {t(
              isPriceImpactError
                ? 'bridgePriceImpactVeryHigh'
                : 'bridgePriceImpactHigh',
            )}
          </Column>
        </ModalHeader>
        <Column gap={3} paddingInline={4} paddingBottom={4}>
          <Text variant={TextVariant.BodySm}>
            {t(
              isPriceImpactError
                ? 'bridgePriceImpactVeryHighDescription'
                : 'bridgePriceImpactHighDescription',
              [formattedPriceImpact ?? ''],
            )}
          </Text>
        </Column>
        <ModalFooter>
          <Row gap={4}>
            {variant === 'submit-cta' && isPriceImpactError && (
              <Button
                isFullWidth
                size={ButtonSize.Lg}
                variant={ButtonVariant.Secondary}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                onClick={async () => {
                  if (activeQuote) {
                    await submitBridgeTransaction(activeQuote);
                  }
                  onClose();
                }}
              >
                {t('proceed')}
              </Button>
            )}
            <Button
              isFullWidth
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              disabled={isSubmitting}
              onClick={() => {
                onClose();
              }}
            >
              {t(variant === 'submit-cta' ? 'cancel' : 'gotIt')}
            </Button>
          </Row>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
