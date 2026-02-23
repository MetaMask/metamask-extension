import React from 'react';
import { Button, Text, TextButton, Box, BoxFlexDirection, BoxAlignItems, BoxJustifyContent, TextVariant, TextColor, ButtonVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';

interface QuizIntroductionProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export function QuizIntroduction({
  onGetStarted,
  onLearnMore,
}: QuizIntroductionProps) {
  const t = useI18nContext();
  return (
    <>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={6}
        paddingTop={6}
        data-testid="reveal-seed-quiz-introduction"
      >
        <img
          src="images/reveal_srp.png"
          alt="Reveal SRP"
          className="w-[190px] h-[220px] object-contain"
        />
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('quizIntroduction')}
        </Text>
      </Box >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={4}
        className="w-full mt-auto"
      >
        <Button
          variant={ButtonVariant.Primary}
          onClick={onGetStarted}
          data-testid="reveal-seed-quiz-get-started"
          className="w-full"
        >
          {t('srpSecurityQuizGetStarted')}
        </Button>
        <TextButton
          onClick={onLearnMore}
          data-testid="reveal-seed-quiz-intro-learn-more"
          className="w-full hover:bg-transparent"
        >
          {t('learnMoreUpperCase')}
        </TextButton>
      </Box>
    </>
  );
}
