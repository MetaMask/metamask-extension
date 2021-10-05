import EventEmitter from 'events';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Mascot from '../../../components/ui/mascot';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography/typography';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setFirstTimeFlowType } from '../../../store/actions';
import { INITIALIZE_METAMETRICS_OPT_IN_ROUTE } from '../../../helpers/constants/routes';

export default function OnboardingWelcome() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const onCreateClick = () => {
    dispatch(setFirstTimeFlowType('create'));
    history.push(INITIALIZE_METAMETRICS_OPT_IN_ROUTE);
  };

  const onImportClick = () => {
    dispatch(setFirstTimeFlowType('import'));
    history.push(INITIALIZE_METAMETRICS_OPT_IN_ROUTE);
  };

  return (
    <div className="onboarding-welcome">
      <Typography
        variant={TYPOGRAPHY.H2}
        align={TEXT_ALIGN.CENTER}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('welcomeToMetaMask')}
      </Typography>
      <Typography align={TEXT_ALIGN.CENTER}>
        {t('welcomeToMetaMaskIntro')}
      </Typography>
      <div className="onboarding-welcome__mascot">
        <Mascot
          animationEventEmitter={new EventEmitter()}
          width="125"
          height="125"
        />
      </div>
      <ul>
        <li>
          <Button type="primary" onClick={onCreateClick}>
            {t('onboardingCreateWallet')}
          </Button>
        </li>
        <li>
          <Button type="secondary" onClick={onImportClick}>
            {t('onboardingImportWallet')}
          </Button>
        </li>
      </ul>
    </div>
  );
}
