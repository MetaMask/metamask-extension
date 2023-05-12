import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getAddressBook } from '../../selectors';
import { showModal } from '../../store/actions';
import {
  CONTACT_LIST_ROUTE,
  CUSTOMIZE_FOX_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
} from '../../helpers/constants/routes';
import {
  BannerAlert,
  ButtonIcon,
  ButtonPrimary,
  IconName,
  Text,
} from '../../components/component-library';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { useI18nContext } from '../../hooks/useI18nContext';
import Box from '../../components/ui/box';
import { getSeedPhraseBackedUp } from '../../ducks/metamask/metamask';
import { getHardwareKeyrings, getMetaMaskKeyrings } from '../../selectors';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  Size,
  TextVariant,
} from '../../helpers/constants/design-system';

export default function CustomizeFoxComponent() {
  const history = useHistory();
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const userCompletedSRPQuiz = useSelector(
    (state) => state.metamask.userCompletedSRPQuiz,
  );
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const allKeyrings = useSelector(getMetaMaskKeyrings);
  const hardwareKeyrings = useSelector(getHardwareKeyrings);
  const hasOnlyHardwareAccounts = hardwareKeyrings.some(kr => kr.accounts?.length) && allKeyrings.length === hardwareKeyrings.length;
  const dispatch = useDispatch();
  const t = useI18nContext();
  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const addressBook = useSelector(getAddressBook);
  const isTags = addressBook.filter((item) => item.tags.length);
  const isDisabled =
    (seedPhraseBackedUp || hasOnlyHardwareAccounts) && userCompletedSRPQuiz && isTags.length;

  const showSRPQuizModal = () => {
    dispatch(
      showModal({
        name: 'SRP_QUIZ',
        isSecurityCheckList: true,
      }),
    );
  };

  let firstSuccessBanner;
  if (hasOnlyHardwareAccounts) {
	firstSuccessBanner = <BannerAlert
		severity="success"
		title="You are using a hardware wallet to secure your seed phrase &#127942;"
	/>
  } else {
  	firstSuccessBanner = <BannerAlert
  		severity="success"
  		title="You have backed up your seed phrase &#127942;"
  	/>
  }

  return (
    <Box
      className={`customized-fox ${
        isPopup ? 'fox-customisation-popup' : 'fox-customisation-full-screen'
      }`}
      marginTop={5}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        marginBottom={4}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
      >
        <Text variant={TextVariant.headingMd}>Customise your fox</Text>
        <ButtonIcon
          className="customized-fox__close"
          iconName={IconName.Close}
          size={Size.SM}
          onClick={() => history.push(mostRecentOverviewPage)}
          ariaLabel={t('close')}
        />
      </Box>
      <Text variant={TextVariant.bodyMd}>
        {isDisabled
          ? `Bravo! You have completed all the steps. Your unique fox is just a click away!`
          : `Increase the security of your wallet by completing the following
          steps and customize your very own MetaMask fox! Your unique fox icon
          will be visible whenever you interact with your MetaMask wallet.`}
      </Text>
      <Box marginTop={4} marginBottom={4}>
        {(seedPhraseBackedUp || hasOnlyHardwareAccounts) ? (
          firstSuccessBanner
        ) : (
          <BannerAlert
            severity="info"
            title="Back up your seed phrase"
            actionButtonLabel={t('backupNow')}
            actionButtonProps={{
              endIconName: IconName.Arrow2Right,
            }}
            actionButtonOnClick={() => {
              const backUpSRPRoute = `${ONBOARDING_SECURE_YOUR_WALLET_ROUTE}/?isFromReminder=true`;
              if (isPopup) {
                global.platform.openExtensionInBrowser(backUpSRPRoute);
              } else {
                history.push(backUpSRPRoute);
              }
            }}
          >
            Your Secret Recovery Phrase (SRP) is a unique 12-word phrase that is
            generated when you first set up MetaMask. Not even the team at
            MetaMask can help you recover your wallet and its accounts if you
            lose your SRP. Learn more and back up your SRP now.
          </BannerAlert>
        )}
      </Box>
      <Box marginTop={4} marginBottom={4}>
        {userCompletedSRPQuiz ? (
          <BannerAlert
            severity="success"
            title="You have completed the SRP Quiz &#127942;"
          />
        ) : (
          <BannerAlert
            severity="info"
            title="Complete security quiz"
            actionButtonLabel="Complete now"
            actionButtonProps={{
              endIconName: IconName.Arrow2Right,
            }}
            actionButtonOnClick={showSRPQuizModal}
          >
            Understanding what a Secret Recovery Phrase (SRP) is and why it’s
            important is a critical step in your Web3 journey. This quiz is
            designed to help make sure you have the basics and understand how to
            keep your funds safe.
          </BannerAlert>
        )}
      </Box>
      <Box marginTop={4} marginBottom={4}>
        {isTags.length ? (
          <BannerAlert
            severity="success"
            title="You have contacts in Allow or Block Lists &#127942;"
          />
        ) : (
          <BannerAlert
            severity="info"
            title="Add contacts to Allow and Block Lists"
            actionButtonLabel="Add now"
            actionButtonProps={{
              endIconName: IconName.Arrow2Right,
            }}
            actionButtonOnClick={() => {
              const contactRoute = CONTACT_LIST_ROUTE;
              if (isPopup) {
                global.platform.openExtensionInBrowser(contactRoute);
              } else {
                history.push(contactRoute);
              }
            }}
          >
            Limit exposure to bad actors by adding contacts to an Allow List or
            a Block List. Any transaction confirmation with an address on your
            Block List will be blocked by default and you'll be notified.
            Transaction confirmations with addresses on your Allow List are
            frictionless. Interactions with addresses that are on neither list
            require a quick verification step before they can proceed.
          </BannerAlert>
        )}
      </Box>
      <ButtonPrimary
        size={Size.LG}
        onClick={() => history.push(CUSTOMIZE_FOX_ROUTE)}
        block
        marginTop={4}
        marginBottom={6}
        disabled={!isDisabled}
      >
        Customize fox
      </ButtonPrimary>
    </Box>
  );
}
