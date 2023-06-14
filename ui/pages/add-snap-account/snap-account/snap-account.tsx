import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, Text } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import AddSnapAccountPopup from '../../../components/app/add-snap-account-popup/add-snap-account-popup';
import SnapCard from '../snap-card/snap-card';

export interface SnapDetails {
  id: string;
  snapId: string;
  iconUrl: string;
  snapTitle: string;
  snapSlug: string;
  snapDescription: string;
  tags: string[];
  developer: string;
  website: string;
  auditUrls: string[];
  version: string;
  lastUpdated: string;
}

export interface SnapCardProps extends SnapDetails {
  isInstalled: boolean;
  updateAvailable: boolean;
}

const mockSnapList: SnapDetails[] = [
  {
    id: '1',
    snapId: 'local:http://localhost:8080',
    iconUrl: '',
    snapTitle: 'Metamask Simple Keyring',
    snapSlug: 'Secure your account with MetaMask Mobile',
    snapDescription:
      'Threshold signature schemes (TSS) allow multiple collaborating participants to sign a message or transaction. The private key is shared between the participants using a technique called multi-party computation (MPC) which ensures that the entire private key is never exposed to any participant; the process for generating key shares is called distributed key generation (DKG). Before a signature can be generated all participants must generate key shares using DKG and store their key shares securely; the number of participants and threshold for signature generation must be decided in advance. Unlike other techniques such as Shamirs Secret Sharing (SSS) the entire private key is never revealed to any single participant and is therefore more secure as it does not have the trusted dealer problem.',
    tags: ['EOA'],
    developer: 'Metamask',
    website: 'https://www.consensys.net/',
    auditUrls: ['much secure', 'very safe'],
    version: '1.0.0',
    lastUpdated: 'April 20, 2023',
  },
  {
    id: '1',
    snapId: 'local:http://localhost:8080',
    iconUrl: '',
    snapTitle: 'Metamask Account Abstrction Snap',
    snapSlug: 'Secure your account with MetaMask Mobile',
    snapDescription:
      'Threshold signature schemes (TSS) allow multiple collaborating participants to sign a message or transaction. The private key is shared between the participants using a technique called multi-party computation (MPC) which ensures that the entire private key is never exposed to any participant; the process for generating key shares is called distributed key generation (DKG). Before a signature can be generated all participants must generate key shares using DKG and store their key shares securely; the number of participants and threshold for signature generation must be decided in advance. Unlike other techniques such as Shamirs Secret Sharing (SSS) the entire private key is never revealed to any single participant and is therefore more secure as it does not have the trusted dealer problem.',
    tags: ['4337', 'Smart Contract'],
    developer: 'Metamask',
    website: 'https://www.consensys.net/',
    auditUrls: ['much secure', 'very safe'],
    version: '1.0.0',
    lastUpdated: 'April 20, 2023',
  },
  {
    id: '1',
    snapId: 'local:http://localhost:8080',
    iconUrl: '',
    snapTitle: 'Metamask TSS',
    snapSlug: 'Secure your account with MetaMask Mobile',
    snapDescription:
      'Threshold signature schemes (TSS) allow multiple collaborating participants to sign a message or transaction. The private key is shared between the participants using a technique called multi-party computation (MPC) which ensures that the entire private key is never exposed to any participant; the process for generating key shares is called distributed key generation (DKG). Before a signature can be generated all participants must generate key shares using DKG and store their key shares securely; the number of participants and threshold for signature generation must be decided in advance. Unlike other techniques such as Shamirs Secret Sharing (SSS) the entire private key is never revealed to any single participant and is therefore more secure as it does not have the trusted dealer problem.',
    tags: ['MPC', 'Shared Custody'],
    developer: 'Metamask',
    website: 'https://www.consensys.net/',
    auditUrls: ['much secure', 'very safe'],
    version: '1.0.0',
    lastUpdated: 'April 20, 2023',
  },
  {
    id: '1',
    snapId: 'local:http://localhost:8080',
    iconUrl: '',
    snapTitle: 'Metamask TSS',
    snapSlug: 'Secure your account with MetaMask Mobile',
    snapDescription:
      'Threshold signature schemes (TSS) allow multiple collaborating participants to sign a message or transaction. The private key is shared between the participants using a technique called multi-party computation (MPC) which ensures that the entire private key is never exposed to any participant; the process for generating key shares is called distributed key generation (DKG). Before a signature can be generated all participants must generate key shares using DKG and store their key shares securely; the number of participants and threshold for signature generation must be decided in advance. Unlike other techniques such as Shamirs Secret Sharing (SSS) the entire private key is never revealed to any single participant and is therefore more secure as it does not have the trusted dealer problem.',
    tags: ['MPC', 'Shared Custody'],
    developer: 'Metamask',
    website: 'https://tss.ac/',
    auditUrls: ['auditUrl1', 'auditUrl2'],
    version: '1.0.0',
    lastUpdated: 'April 20, 2023',
  },
];

export default function NewSnapAccountPage() {
  const t = useI18nContext();
  // TODO: this is currently a mock
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [snapList, setSnapList] = useState(mockSnapList);
  const [showPopup, setShowPopup] = useState(true);
  const history = useHistory();

  const hidePopup = () => {
    setShowPopup(false);
  };

  return (
    <Box className="snap-account-page">
      <AddSnapAccountPopup onClose={hidePopup} isOpen={showPopup} />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        marginTop={11}
        marginBottom={11}
      >
        <Text variant={TextVariant.headingLg}>
          {t('snapCreateAccountTitle', [
            <Text
              variant={TextVariant.headingLg}
              as="span"
              className="snap-account-color-text"
              key="snap-title-2"
            >
              {t('snapCreateAccountTitle2')}
            </Text>,
          ])}
        </Text>
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {t('snapCreateAccountSubtitle')}
        </Text>
      </Box>
      <Box
        display={Display.Grid}
        flexWrap={FlexWrap.Wrap}
        gap={4}
        padding={[0, 10, 0, 10]}
        className="snap-account-cards"
      >
        {snapList.map((snap, index: number) => {
          const mockInstalled = Math.round(Math.random()) === 0;
          return (
            <SnapCard
              {...snap}
              key={index}
              updateAvailable={mockInstalled}
              isInstalled={mockInstalled}
              onClickFunc={() => {
                history.push(`/add-snap-account/${snap.id}`);
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
