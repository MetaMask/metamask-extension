import React, { useMemo, useContext } from 'react';
import { I18nContext } from '../../../contexts/i18n';
import Button from '../../../components/ui/button';
import { useHistory } from 'react-router-dom';
import { INITIALIZE_WELCOME_ROUTE } from '../../../helpers/constants/routes';

export default function ExperimentalArea() {
  const t = useContext(I18nContext);
  const history = useHistory();

  const metamaMaskLogoWithBrs = useMemo(lineBreaksToBr(METAMASK_LOGO), [
    METAMASK_LOGO,
  ]);
  const experimentalAreaWithBrs = useMemo(lineBreaksToBr(EXPERIMENTAL_AREA), [
    EXPERIMENTAL_AREA,
  ]);

  const onClick = () => {
    history.push(INITIALIZE_WELCOME_ROUTE);
  };

  return (
    <div class="experimental-area">
      <div class="logo">{metamaMaskLogoWithBrs}</div>
      <div class="experimental-text">{experimentalAreaWithBrs}</div>
      <div class="text">
        {t('flaskExperimentalText1')}
        <ul>
          <li>{t('flaskExperimentalText2')}</li>
          <li>{t('flaskExperimentalText3')}</li>
          <li>{t('flaskExperimentalText4')}</li>
        </ul>
        {t('flaskExperimentalText5')}
      </div>
      <Button type="primary" onClick={onClick}>
        {t('IUnderstand')}
      </Button>
    </div>
  );
}

function lineBreaksToBr(source) {
  return () =>
    source.split('\n').map((value) => {
      return (
        <>
          {value}
          <br />
        </>
      );
    });
}

const METAMASK_LOGO = `MMm*mmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmm*mMM
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
MMMMMMMMMMMMMMMMMMmmmmmmmmMMMMMMMMMMMMMMMMMM`;

const EXPERIMENTAL_AREA = `█▄█ █▀█ █░█ ▀ █▀█ █▀▀   █▀▀ █▄░█ ▀█▀ █▀▀ █▀█ █ █▄░█ █▀▀   ▄▀█ █▄░█
░█░ █▄█ █▄█ ░ █▀▄ ██▄   ██▄ █░▀█ ░█░ ██▄ █▀▄ █ █░▀█ █▄█   █▀█ █░▀█

█▀▀ ▀▄▀ █▀█ █▀▀ █▀█ █ █▀▄▀█ █▀▀ █▄░█ ▀█▀ ▄▀█ █░░   ▄▀█ █▀█ █▀▀ ▄▀█
██▄ █░█ █▀▀ ██▄ █▀▄ █ █░▀░█ ██▄ █░▀█ ░█░ █▀█ █▄▄   █▀█ █▀▄ ██▄ █▀█`;
