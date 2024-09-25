import React from 'react';
import { useSelector } from 'react-redux';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  Button,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import {
  TextColor,
  Display,
  FlexDirection,
  AlignItems,
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';

type InstitutionalEntityDonePageProps = {
  history: {
    push: (path: string) => void;
  };
  location: {
    state: {
      imgSrc?: string;
      title: string;
      description: string;
    };
  };
};

const InstitutionalEntityDonePage: React.FC<
  InstitutionalEntityDonePageProps
> = ({ history, location }) => {
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const t = useI18nContext();
  const { state } = location;

  return (
    <Box className="page-container">
      <Box className="page-container__content">
        <Box
          paddingBottom={6}
          paddingLeft={6}
          paddingRight={6}
          className="institutional-entity-done__form"
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
          >
            {state.imgSrc && (
              <img
                className="institutional-entity-done__img"
                src={state.imgSrc}
                alt="Entity image"
              />
            )}
            <Box paddingTop={4} paddingBottom={4}>
              <Text
                paddingTop={3}
                fontWeight={FontWeight.Bold}
                variant={TextVariant.headingSm}
                as="h5"
              >
                {state.title}
              </Text>

              <Text paddingTop={3} color={TextColor.textAlternative}>
                {state.description}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box as="footer" className="page-container__footer" padding={4}>
        <Box display={Display.Flex} gap={4}>
          <Button
            block
            variant={ButtonVariant.Primary}
            data-testid="click-most-recent-overview-page"
            onClick={() => history.push(mostRecentOverviewPage)}
          >
            {t('close')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default InstitutionalEntityDonePage;
