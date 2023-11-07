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
  ButtonSecondarySize,
  ButtonPrimarySize,
  ButtonVariant,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
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
  // Values represent if a warning is collapsed
  const defaultWarningState = warnings.reduce((warningState, warning, idx) => {
    warningState[warning.snapId] = idx !== 0;
    return warningState;
  }, {});

  const [warningState, setWarningState] = useState(defaultWarningState);
  const [isChecked, setIsChecked] = useState(false);

  const handleOnChange = () => setIsChecked((state) => !state);

  const handleWarningClick = (snapId) => {
    let newState = { ...warningState };
    const nextSnapState = !warningState[snapId];
    const willClose = nextSnapState;
    newState[snapId] = nextSnapState;
    if (!willClose) {
      newState = { ...defaultWarningState };
      newState[snapId] = false;
      newState[warnings[0].snapId] = snapId !== warnings[0].snapId;
    }
    setWarningState(newState);
  };

  const Warnings = () => {
    const lastWarningIdx = warnings.length - 1;
    return (
      <Box className="tx-insights-warnings-modal__content">
        {warnings.map((warning, idx) => {
          const { snapId, content } = warning;
          return (
            <SnapUIRenderer
              key={`${snapId}-${idx}`}
              snapId={snapId}
              data={content}
              delineatorType={DelineatorType.Warning}
              onClick={() => handleWarningClick(snapId)}
              isCollapsable
              isCollapsed={warningState[snapId]}
              boxProps={{ marginBottom: idx === lastWarningIdx ? 0 : 4 }}
            />
          );
        })}
      </Box>
    );
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
          justifyContent={JustifyContent.center}
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
          {warnings.length === 1
            ? t('transactionInsightWarningContentSingular', [
                type,
                results[type].noun,
              ])
            : t('transactionInsightWarningContentPlural', [
                warnings.length,
                type,
                results[type].noun,
              ])}
        </Text>
        <Warnings />
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexStart}
          alignItems={AlignItems.center}
          marginTop={4}
          marginBottom={4}
          padding={4}
          borderRadius={BorderRadius.SM}
          style={{
            backgroundColor: isChecked
              ? 'var(--color-info-muted)'
              : 'var(--color-background-default-hover)',
          }}
        >
          <Checkbox
            variant={TextVariant.bodySm}
            isChecked={isChecked}
            onChange={handleOnChange}
            label={t('transactionInsightWarningCheckboxMessage', [
              t(results[type].imperative),
              stripHttpSchemes(origin),
            ])}
          />
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Button
            size={ButtonSecondarySize.Lg}
            width={BlockSize.Half}
            variant={ButtonVariant.Secondary}
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
            {t(results[type].imperative)}
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
