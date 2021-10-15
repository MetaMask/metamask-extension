import React from 'react';

import Typography from '../../../components/ui/typography/typography';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

function getBillboard(t) {
  return (
    <svg width="332" height="198" viewBox="0 0 332 198" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
      <g filter="url(#filter0_d)">
        <rect x="31" y="27" width="270" height="136" rx="8" fill="#292A2D"/>
      </g>
      <g filter="url(#filter1_d)">
        <ellipse cx="236.613" cy="144.5" rx="30.6134" ry="30.5" fill="white"/>
        <path d="M236.613 176C254.069 176 268.227 161.9 268.227 144.5C268.227 127.1 254.069 113 236.613 113C219.157 113 205 127.1 205 144.5C205 161.9 219.157 176 236.613 176Z" stroke="white" stroke-width="2"/>
      </g>
      <mask id="mask0" style={{'mask-type':'alpha'}} maskUnits="userSpaceOnUse" x="206" y="114" width="62" height="61">
        <path d="M236.614 174C252.961 174 266.22 160.796 266.22 144.5C266.22 128.204 252.961 115 236.614 115C220.266 115 207.008 128.204 207.008 144.5C207.008 160.796 220.266 174 236.614 174Z" fill="white" stroke="white" stroke-width="2"/>
      </mask>
      <g mask="url(#mask0)">
        <rect x="179.903" y="99" width="121.45" height="106" fill="url(#pattern0)"/>
      </g>
      <text fill="white" xmlSpace="preserve" style={{"white-space": "pre"}} font-family="Open Sans" font-size="12" font-weight="600" letter-spacing="0px"><tspan x="47" y="58.1553">{t('onboardingPinExtensionBillboardTitle')}</tspan></text>
      <text fill="white" xmlSpace="preserve" style={{"white-space": "pre"}} font-family="Open Sans" font-size="10" font-weight="bold" letter-spacing="-0.4px"><tspan x="47" y="83.8794">{t('onboardingPinExtensionBillboardAccess')}</tspan></text>
      <text fill="white" xmlSpace="preserve" style={{"white-space": "pre"}} font-family="Open Sans" font-size="9" font-weight="bold" letter-spacing="0px"><tspan x="73.1465" y="140.991">{t('appName')}</tspan></text>
      <text fill="white" xmlSpace="preserve" style={{"white-space": "pre"}} font-family="Open Sans" font-size="10" letter-spacing="-0.3px"><tspan x="47" y="101.379">{t('onboardingPinExtensionBillboardDescription')}&#10;</tspan><tspan x="47" y="116.379">{t('onboardingPinExtensionBillboardDescription2')}</tspan></text>
      <path d="M277.188 55.9875L279.888 53.3125C280.038 53.1625 280.038 52.8875 279.888 52.7375L279.263 52.1125C279.113 51.9625 278.838 51.9625 278.688 52.1125L276.013 54.8125L273.312 52.1125C273.163 51.9625 272.887 51.9625 272.738 52.1125L272.113 52.7375C271.962 52.8875 271.962 53.1625 272.113 53.3125L274.812 55.9875L272.113 58.6875C271.962 58.8375 271.962 59.1125 272.113 59.2625L272.738 59.8875C272.887 60.0375 273.163 60.0375 273.312 59.8875L276.013 57.1875L278.688 59.8875C278.838 60.0375 279.113 60.0375 279.263 59.8875L279.888 59.2625C280.038 59.1125 280.038 58.8375 279.888 58.6875L277.188 55.9875Z" fill="#BBC0C5"/>
      <path d="M275 135.875C274.367 135.875 273.875 136.391 273.875 137C273.875 137.633 274.367 138.125 275 138.125C275.609 138.125 276.125 137.633 276.125 137C276.125 136.391 275.609 135.875 275 135.875ZM273.875 133.438C273.875 134.07 274.367 134.562 275 134.562C275.609 134.562 276.125 134.07 276.125 133.438C276.125 132.828 275.609 132.312 275 132.312C274.367 132.312 273.875 132.828 273.875 133.438ZM273.875 140.562C273.875 141.195 274.367 141.688 275 141.688C275.609 141.688 276.125 141.195 276.125 140.562C276.125 139.953 275.609 139.438 275 139.438C274.367 139.438 273.875 139.953 273.875 140.562Z" fill="#BBC0C5"/>
      <path d="M60.4957 132L55.3604 135.75L56.3153 133.54L60.4957 132Z" fill="#E17726" stroke="#E17726" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48.6514 132L53.741 135.785L52.8318 133.54L48.6514 132Z" fill="#E27625" stroke="#E27625" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M58.6467 140.695L57.2803 142.755L60.2061 143.55L61.0442 140.74L58.6467 140.695Z" fill="#E27625" stroke="#E27625" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48.1074 140.74L48.9405 143.55L51.8612 142.755L50.4999 140.695L48.1074 140.74Z" fill="#E27625" stroke="#E27625" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M51.7043 137.215L50.8916 138.425L53.7869 138.555L53.6904 135.48L51.7043 137.215Z" fill="#E27625" stroke="#E27625" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M57.4429 137.215L55.4264 135.445L55.3604 138.555L58.2557 138.425L57.4429 137.215Z" fill="#E27625" stroke="#E27625" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M51.8613 142.755L53.6138 141.92L52.1051 140.76L51.8613 142.755Z" fill="#E27625" stroke="#E27625" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M55.5342 141.92L57.2815 142.755L57.0428 140.76L55.5342 141.92Z" fill="#E27625" stroke="#E27625" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M57.2796 142.755L55.5322 141.92L55.6745 143.04L55.6592 143.515L57.2796 142.755Z" fill="#D5BFB2" stroke="#D5BFB2" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M51.8604 142.755L53.4858 143.515L53.4756 143.04L53.6128 141.92L51.8604 142.755Z" fill="#D5BFB2" stroke="#D5BFB2" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M53.5162 140.02L52.0635 139.6L53.0895 139.135L53.5162 140.02Z" fill="#233447" stroke="#233447" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M55.6299 140.02L56.0566 139.135L57.0877 139.6L55.6299 140.02Z" fill="#233447" stroke="#233447" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M51.8603 142.755L52.1143 140.695L50.499 140.74L51.8603 142.755Z" fill="#CC6228" stroke="#CC6228" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M57.0303 140.695L57.2792 142.755L58.6456 140.74L57.0303 140.695Z" fill="#CC6228" stroke="#CC6228" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M58.2557 138.425L55.3604 138.555L55.6296 140.02L56.0562 139.135L57.0874 139.6L58.2557 138.425Z" fill="#CC6228" stroke="#CC6228" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M52.063 139.6L53.0891 139.135L53.5158 140.02L53.785 138.555L50.8896 138.425L52.063 139.6Z" fill="#CC6228" stroke="#CC6228" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M50.8896 138.425L52.1036 140.76L52.063 139.6L50.8896 138.425Z" fill="#E27525" stroke="#E27525" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M57.0877 139.6L57.042 140.76L58.256 138.425L57.0877 139.6Z" fill="#E27525" stroke="#E27525" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M53.7858 138.555L53.5166 140.02L53.8569 141.75L53.9331 139.47L53.7858 138.555Z" fill="#E27525" stroke="#E27525" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M55.36 138.555L55.2178 139.465L55.2889 141.75L55.6292 140.02L55.36 138.555Z" fill="#E27525" stroke="#E27525" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M55.6294 140.02L55.2891 141.75L55.5329 141.92L57.0415 140.76L57.0872 139.6L55.6294 140.02Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M52.0635 139.6L52.1041 140.76L53.6127 141.92L53.8565 141.75L53.5162 140.02L52.0635 139.6Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M55.6598 143.515L55.6751 143.04L55.543 142.93H53.6026L53.4756 143.04L53.4858 143.515L51.8604 142.755L52.4293 143.215L53.5823 144H55.5582L56.7164 143.215L57.2802 142.755L55.6598 143.515Z" fill="#C0AC9D" stroke="#C0AC9D" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M55.5328 141.92L55.289 141.75H53.8565L53.6127 141.92L53.4756 143.04L53.6026 142.93H55.5429L55.675 143.04L55.5328 141.92Z" fill="#161616" stroke="#161616" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M60.7143 135.995L61.1461 133.925L60.4959 132L55.5332 135.625L57.4431 137.215L60.1403 137.99L60.7346 137.305L60.4756 137.12L60.887 136.75L60.5721 136.51L60.9835 136.2L60.7143 135.995Z" fill="#763E1A" stroke="#763E1A" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M48 133.925L48.4368 135.995L48.1575 136.2L48.574 136.51L48.2591 136.75L48.6705 137.12L48.4114 137.305L49.0057 137.99L51.703 137.215L53.6128 135.625L48.6502 132L48 133.925Z" fill="#763E1A" stroke="#763E1A" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M60.1405 137.99L57.4433 137.215L58.256 138.425L57.042 140.76L58.6471 140.74H61.0446L60.1405 137.99Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M51.7027 137.215L49.0055 137.99L48.1064 140.74H50.4989L52.104 140.76L50.89 138.425L51.7027 137.215Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M55.3606 138.555L55.5333 135.625L56.3156 133.54H52.8311L53.6133 135.625L53.786 138.555L53.852 139.475L53.8571 141.75H55.2895L55.2946 139.475L55.3606 138.555Z" fill="#F5841F" stroke="#F5841F" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round"/>
      <defs>
        <filter id="filter0_d" x="0" y="0" width="332" height="198" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feMorphology radius="6" operator="dilate" in="SourceAlpha" result="effect1_dropShadow"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="12.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
        <filter id="filter1_d" x="199" y="107" width="75.2266" height="75" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="2.5"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.916667 0 0 0 0 0.916667 0 0 0 0 0.916667 0 0 0 0.26 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
        <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
          <use xmlHref="#image0" transform="translate(0 -0.000404155) scale(0.00301205 0.00345106)"/>
        </pattern>
        <image id="image0" width="332" height="290" xmlHref="data:image/png;base64,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"/>
      </defs>
    </svg>
  );
}

export default function OnboardingPinExtension() {
  const t = useI18nContext();

  return (
    <div className="onboarding-pin-extension">
      <Typography
        variant={TYPOGRAPHY.H2}
        align={TEXT_ALIGN.CENTER}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('onboardingPinExtensionTitle')}
      </Typography>
      <Typography align={TEXT_ALIGN.CENTER}>
        {t('onboardingPinExtensionDescription')}
      </Typography>
      <div className="onboarding-pin-extension__diagram">
        {getBillboard(t)}
      </div>
      <div className="onboarding-pin-extension__buttons">
        <Button type="primary" onClick={() => {}}>
          {t('onboardingPinExtensionContinueText')}
        </Button>
      </div>
    </div>
  );
}
