import React, { Fragment, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../../contexts/i18n';
import { Button, ButtonVariant } from '../../../component-library';

function lineBreaksToBr(source) {
  return source.split('\n').map((value, index) => {
    return (
      <Fragment key={index}>
        {value}
        <br />
      </Fragment>
    );
  });
}

const METAMASK_LOGO =
  lineBreaksToBr(`MMm*mmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmm*mMM
MM*./***mMMMMMMMMMMMMMMMMMMMMMMMMMMm***/.*MM
MM/...///*mMMMMMMMMMMMMMMMMMMMMMMm*///.../MM
Mm.....//../*mMMMMMMMMMMMMMMMMm*/..//.....mM
M*....../*....*mMMMMMMMMMMMMm*....*/......*M
M/........*.....*//////////*...../......../M
m..........*/...//........//.../*..........m
M/..........//.../......../...//........../M
M/.........../*/./.......//./*/.........../M
M*.............////......////.............*M
Mm...............**......**...............mM
Mm/...............*/..../*.............../mM
MM/............../*/..../*/............../MM
Mm..............//./...././/..............mM
MM*............*/../..../../*............*MM
MM/........../*..../..../....*/........../MM
MMm.........//...../..../.....//.........mMM
MMm......//**....../..../......**//......mMM
MMM/..////.*......./..../......././///../MMM
MMMm*//..../......./..../......./....//*mMMM
MMMm......*////////*....*////////*......mMMM
MMM*......*////////*....*////////*......*MMM
MMM/....../*......./..../.......*/....../MMM
MMm........**/./m*./..../.**/..**........mMM
MM*........//*mMMM///..///mMMm*//........*MM
MM/........././*mM*//..//*Mm*/./........./MM
Mm..........//.../**/../**/...//..........mM
M*...........*..../*/../*/..../...........*M
M*///////////*/.../m/../m/.../*///////////*M
M*.........../*/...m/../m.../*/...........*M
Mm.........../..//.*....*./*../...........mM
MM/........../...//******//.../........../MM
MM*........../....*MMMMMM*..../..........*MM
MMm........../....*MMMMMM*..../..........mMM
MMm/........//....*MMMMMM*....//......../mMM
MMM/....../*mm*...*mmmmmm*...*mm*/....../MMM
MMM*../*mmMMMMMm///......//*mMMMMMmm*/..*MMM
MMMm*mMMMMMMMMMMm**......**mMMMMMMMMMMm*mMMM
MMMMMMMMMMMMMMMMMm/....../mMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMmmmmmmmmMMMMMMMMMMMMMMMMMM`);

const EXPERIMENTAL_AREA = lineBreaksToBr(`█▀▀ ▄▀█ █░█ ▀█▀ █ █▀█ █▄░█ ▀
  █▄▄ █▀█ █▄█ ░█░ █ █▄█ █░▀█ ▄

  █▀▀ ▀▄▀ █▀█ █▀▀ █▀█ █ █▀▄▀█ █▀▀ █▄░█ ▀█▀ ▄▀█ █░░
  ██▄ █░█ █▀▀ ██▄ █▀▄ █ █░▀░█ ██▄ █░▀█ ░█░ █▀█ █▄▄

  █▀ █▀█ █▀▀ ▀█▀ █░█░█ ▄▀█ █▀█ █▀▀
  ▄█ █▄█ █▀░ ░█░ ▀▄▀▄▀ █▀█ █▀▄ ██▄`);

export default function ExperimentalArea({ redirectTo }) {
  const t = useContext(I18nContext);
  const navigate = useNavigate();

  const onClick = () => {
    navigate(redirectTo);
  };

  return (
    <div className="experimental-area" data-testid="experimental-area">
      <div className="logo">{METAMASK_LOGO}</div>
      <div className="experimental-text">{EXPERIMENTAL_AREA}</div>
      <div className="text">
        <p>
          {t('flaskWelcomeWarning1', [
            <b key="doNotUse">{t('flaskWelcomeUninstall')}</b>,
          ])}
        </p>
        <br />
        <p>{t('flaskWelcomeWarning2')}</p>
        <br />
        <p>{t('flaskWelcomeWarning3')}</p>
        <br />
        <p>{t('flaskWelcomeWarning4')}</p>
      </div>
      <Button variant={ButtonVariant.Primary} onClick={onClick}>
        {t('flaskWelcomeWarningAcceptButton')}
      </Button>
    </div>
  );
}

ExperimentalArea.propTypes = {
  redirectTo: PropTypes.string,
};
