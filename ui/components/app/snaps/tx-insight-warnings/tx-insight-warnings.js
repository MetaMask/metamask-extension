import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  IconName,
  AvatarIcon,
  AvatarIconSize,
  Text,
  Checkbox,
  Box,
  Button,
  BUTTON_VARIANT,
  ButtonSecondarySize,
  ButtonPrimarySize,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { stripHttpSchemes } from '../../../../helpers/utils/util';

export default function TxInsightWarnings({
  warnings,
  type = 'confirming',
  origin,
  onCancel,
  onSubmit,
}) {
  const t = useI18nContext();

  const [currentWarning, setCurrentWarning] = useState(warnings[0].snapId);
  const [isChecked, setIsChecked] = useState(false);

  const handleOnChange = () => setIsChecked(!isChecked);

  const Warnings = () => {
    const lastWarningIdx = warnings.length - 1;
    return warnings.map((warning, idx) => {
      const { snapId, content } = warning;
      return (
        <SnapUIRenderer
          key={`${snapId}-${idx}`}
          snapId={snapId}
          data={content}
          delineatorType={DelineatorType.Warning}
          onClick={() => {
            setCurrentWarning(snapId);
          }}
          isCollapsable
          isCollapsed={currentWarning !== snapId}
          boxProps={{ paddingBottom: idx === lastWarningIdx ? 0 : 4 }}
        />
      );
    });
  };

  // move this to an enum that defines the language to be used in this modal on the various
  // screens that will offer transaction insights, should be indexed on "type".
  const results = {
    confirming: { noun: 'confirmation', imperative: 'confirm' },
    signing: { noun: 'signature', imperative: 'sign' },
  };

  return (
    <Modal
      isOpen
      isClosedOnEscapeKey={false}
      isClosedOnOutsideClick={false}
      className="tx-insights-warnings-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          childrenWrapperProps={{
            alignItems: AlignItems.center,
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
          }}
        >
          <AvatarIcon
            iconName={IconName.Warning}
            size={AvatarIconSize.Lg}
            color={IconColor.errorDefault}
            backgroundColor={BackgroundColor.errorMuted}
          />
          <Text
            variant={TextVariant.headingMd}
            paddingTop={4}
            paddingBottom={4}
          >
            {t('transactionInsightWarningHeader')}
          </Text>
        </ModalHeader>
        <Text variant={TextVariant.bodyMd} paddingBottom={4}>
          {warnings.length > 1
            ? t('transactionInsightWarningContentPlural', [
                warnings.length,
                type,
                results[type].noun,
              ])
            : t('transactionInsightWarningContentSingular', [
                type,
                results[type].noun,
              ])}
        </Text>
        <Warnings />
        <Checkbox
          variant={TextVariant.bodySm}
          isChecked={isChecked}
          onChange={handleOnChange}
          label={t('transactionInsightWarningCheckboxMessage', [
            t(`${results[type].imperative}`),
            stripHttpSchemes(origin),
          ])}
          paddingTop={4}
          paddingBottom={4}
        />
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Button
            size={ButtonSecondarySize.Lg}
            width={BlockSize.Half}
            variant={BUTTON_VARIANT.SECONDARY}
            onClick={onCancel}
            marginRight={4}
          >
            {t('cancel')}
          </Button>
          <Button
            size={ButtonPrimarySize.Lg}
            width={BlockSize.Half}
            danger
            onClick={onSubmit}
            disabled={!isChecked}
          >
            {t(`${results[type].imperative}`)}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}

TxInsightWarnings.propTypes = {
  /**
   * An array of warnings returned from tx-insight snaps that deem their content 'critical'
   */
  warnings: PropTypes.arrayOf(PropTypes.object),
  /**
   * A limited set of actions defining the type of transaction
   */
  type: PropTypes.oneOf(['confirming', 'signing']),
  /**
   * Origin initiating the transaction
   */
  origin: PropTypes.string.isRequired,
  /**
   * Cancel function
   */
  onCancel: PropTypes.func.isRequired,
  /**
   * Submit function
   */
  onSubmit: PropTypes.func.isRequired,
};
