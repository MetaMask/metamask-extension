import React from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../components/component-library';
import { RewardsBadge } from '../../components/app/rewards/RewardsBadge';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';

export const ShieldRewardsModal = ({
  isOpen,
  onClose,
  rewardsText,
}: {
  isOpen: boolean;
  onClose: () => void;
  rewardsText: string;
}) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      autoFocus={false}
      className="shield-rewards-modal"
      data-testid="shield-rewards-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Rewards</ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          gap={4}
        >
          <img
            src="./images/shield-reward.png"
            style={{ width: 'auto', height: '170px' }}
            alt="Rewards"
          />

          <RewardsBadge
            boxClassName="gap-1 px-2 py-0.5 bg-background-muted rounded-lg w-fit"
            textClassName="font-medium"
            withPointsSuffix={false}
            formattedPoints={rewardsText}
          />

          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('shieldPlanDetailsRewardsDescription')}
          </Text>

          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={onClose}
            className="w-full"
          >
            {t('gotIt')}
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
