import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function OnboardingPinBillboard() {
  const t = useI18nContext();

  return (
    <svg
      width="799"
      height="320"
      viewBox="0 0 799 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <g filter="url(#filter0_d_2133:17259)">
        <rect
          x="31"
          y="71"
          width="270"
          height="148"
          rx="8"
          fill="url(#pattern0)"
        />
      </g>
      <circle
        cx="54.5"
        cy="24.5"
        r="24.5"
        fill="url(#paint0_linear_2133:17259)"
      />
      <text
        fill="white"
        xmlSpace="preserve"
        style={{ 'white-space': 'pre' }}
        fontFamily="Euclid Circular A"
        fontSize="29"
        fontWeight="bold"
        letterSpacing="0em"
      >
        <tspan x="48.9917" y="35.114">
          {t('onboardingPinExtensionStep1')}
        </tspan>
      </text>
      <text
        fill="var(--color-text-default)"
        xmlSpace="preserve"
        style={{ 'white-space': 'pre' }}
        fontFamily="Euclid Circular B"
        fontSize="18"
        letterSpacing="0em"
      >
        <tspan x="95" y="31.088">
          {t('onboardingPinExtensionChrome')}
        </tspan>
      </text>
      <circle
        cx="522.5"
        cy="102.5"
        r="24.5"
        fill="url(#paint1_linear_2133:17259)"
      />
      <text
        fill="white"
        xmlSpace="preserve"
        style={{ 'white-space': 'pre' }}
        fontFamily="Euclid Circular A"
        fontSize="29"
        fontWeight="bold"
        letterSpacing="0em"
      >
        <tspan x="514.131" y="113.114">
          {t('onboardingPinExtensionStep2')}
        </tspan>
      </text>
      <text
        fill="var(--color-text-default)"
        xmlSpace="preserve"
        style={{ 'white-space': 'pre' }}
        fontFamily="Euclid Circular B"
        fontSize="18"
        letterSpacing="0em"
      >
        <tspan x="563" y="109.088">
          {t('onboardingPinExtensionLabel')}
        </tspan>
      </text>
      <path
        d="M301 137H373.953C388.865 137 400.953 149.088 400.953 164V190C400.953 204.912 413.042 217 427.953 217H498"
        stroke="#037DD6"
        strokeWidth="2"
      />
      <g filter="url(#filter1_d_2133:17259)">
        <rect x="498" y="149" width="270" height="136" rx="8" fill="#292A2D" />
      </g>
      <g filter="url(#filter2_d_2133:17259)">
        <ellipse cx="703.613" cy="266.5" rx="30.6134" ry="30.5" fill="white" />
        <path
          d="M703.613 298C721.069 298 735.227 283.9 735.227 266.5C735.227 249.1 721.069 235 703.613 235C686.157 235 672 249.1 672 266.5C672 283.9 686.157 298 703.613 298Z"
          stroke="white"
          strokeWidth="2"
        />
      </g>
      <mask
        id="mask0_2133:17259"
        style={{ 'mask-type': 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="673"
        y="236"
        width="62"
        height="61"
      >
        <path
          d="M703.614 296C719.961 296 733.22 282.796 733.22 266.5C733.22 250.204 719.961 237 703.614 237C687.266 237 674.008 250.204 674.008 266.5C674.008 282.796 687.266 296 703.614 296Z"
          fill="white"
          stroke="white"
          strokeWidth="2"
        />
      </mask>
      <g mask="url(#mask0_2133:17259)">
        <rect
          x="646.903"
          y="221"
          width="121.45"
          height="106"
          fill="url(#pattern1)"
        />
      </g>
      <text
        fill="white"
        xmlSpace="preserve"
        style={{ 'white-space': 'pre' }}
        fontFamily="Open Sans"
        fontSize="12"
        fontWeight="600"
        letterSpacing="0px"
      >
        <tspan x="514" y="180.155">
          {t('onboardingPinExtensionBillboardTitle')}
        </tspan>
      </text>
      <text
        fill="white"
        xmlSpace="preserve"
        style={{ 'white-space': 'pre' }}
        fontFamily="Open Sans"
        fontSize="10"
        fontWeight="bold"
        letterSpacing="-0.4px"
      >
        <tspan x="514" y="205.879">
          {t('onboardingPinExtensionBillboardAccess')}
        </tspan>
      </text>
      <text
        fill="white"
        xmlSpace="preserve"
        style={{ 'white-space': 'pre' }}
        fontFamily="Open Sans"
        fontSize="9"
        fontWeight="bold"
        letterSpacing="0px"
      >
        <tspan x="540.146" y="262.991">
          {t('appName')}
        </tspan>
      </text>
      <text
        fill="white"
        xmlSpace="preserve"
        style={{ 'white-space': 'pre' }}
        fontFamily="Open Sans"
        fontSize="10"
        letterSpacing="-0.3px"
      >
        <tspan x="514" y="223.379">
          {t('onboardingPinExtensionBillboardDescription')}&#10;
        </tspan>
        <tspan x="514" y="238.379">
          {t('onboardingPinExtensionBillboardDescription2')}
        </tspan>
      </text>
      <path
        d="M744.188 177.988L746.888 175.313C747.038 175.163 747.038 174.888 746.888 174.738L746.263 174.113C746.113 173.962 745.838 173.962 745.688 174.113L743.013 176.813L740.313 174.113C740.163 173.962 739.888 173.962 739.738 174.113L739.113 174.738C738.962 174.888 738.962 175.163 739.113 175.313L741.813 177.988L739.113 180.688C738.962 180.838 738.962 181.113 739.113 181.263L739.738 181.888C739.888 182.038 740.163 182.038 740.313 181.888L743.013 179.188L745.688 181.888C745.838 182.038 746.113 182.038 746.263 181.888L746.888 181.263C747.038 181.113 747.038 180.838 746.888 180.688L744.188 177.988Z"
        fill="#BBC0C5"
      />
      <path
        d="M742 257.875C741.367 257.875 740.875 258.391 740.875 259C740.875 259.633 741.367 260.125 742 260.125C742.609 260.125 743.125 259.633 743.125 259C743.125 258.391 742.609 257.875 742 257.875ZM740.875 255.438C740.875 256.07 741.367 256.562 742 256.562C742.609 256.562 743.125 256.07 743.125 255.438C743.125 254.828 742.609 254.312 742 254.312C741.367 254.312 740.875 254.828 740.875 255.438ZM740.875 262.562C740.875 263.195 741.367 263.688 742 263.688C742.609 263.688 743.125 263.195 743.125 262.562C743.125 261.953 742.609 261.438 742 261.438C741.367 261.438 740.875 261.953 740.875 262.562Z"
        fill="#BBC0C5"
      />
      <path
        d="M527.496 254L522.36 257.75L523.315 255.54L527.496 254Z"
        fill="#E17726"
        stroke="#E17726"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M515.651 254L520.741 257.785L519.832 255.54L515.651 254Z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M525.647 262.695L524.28 264.755L527.206 265.55L528.044 262.74L525.647 262.695Z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M515.107 262.74L515.94 265.55L518.861 264.755L517.5 262.695L515.107 262.74Z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M518.704 259.215L517.892 260.425L520.787 260.555L520.69 257.48L518.704 259.215Z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M524.443 259.215L522.426 257.445L522.36 260.555L525.256 260.425L524.443 259.215Z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M518.861 264.755L520.614 263.92L519.105 262.76L518.861 264.755Z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M522.534 263.92L524.282 264.755L524.043 262.76L522.534 263.92Z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M524.28 264.755L522.532 263.92L522.674 265.04L522.659 265.515L524.28 264.755Z"
        fill="#D5BFB2"
        stroke="#D5BFB2"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M518.86 264.755L520.486 265.515L520.476 265.04L520.613 263.92L518.86 264.755Z"
        fill="#D5BFB2"
        stroke="#D5BFB2"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M520.516 262.02L519.063 261.6L520.09 261.135L520.516 262.02Z"
        fill="#233447"
        stroke="#233447"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M522.63 262.02L523.057 261.135L524.088 261.6L522.63 262.02Z"
        fill="#233447"
        stroke="#233447"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M518.86 264.755L519.114 262.695L517.499 262.74L518.86 264.755Z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M524.03 262.695L524.279 264.755L525.646 262.74L524.03 262.695Z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M525.256 260.425L522.36 260.555L522.63 262.02L523.056 261.135L524.087 261.6L525.256 260.425Z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M519.063 261.6L520.089 261.135L520.516 262.02L520.785 260.555L517.89 260.425L519.063 261.6Z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M517.89 260.425L519.104 262.76L519.063 261.6L517.89 260.425Z"
        fill="#E27525"
        stroke="#E27525"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M524.088 261.6L524.042 262.76L525.256 260.425L524.088 261.6Z"
        fill="#E27525"
        stroke="#E27525"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M520.786 260.555L520.517 262.02L520.857 263.75L520.933 261.47L520.786 260.555Z"
        fill="#E27525"
        stroke="#E27525"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M522.36 260.555L522.218 261.465L522.289 263.75L522.629 262.02L522.36 260.555Z"
        fill="#E27525"
        stroke="#E27525"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M522.629 262.02L522.289 263.75L522.533 263.92L524.041 262.76L524.087 261.6L522.629 262.02Z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M519.063 261.6L519.104 262.76L520.613 263.92L520.857 263.75L520.516 262.02L519.063 261.6Z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M522.66 265.515L522.675 265.04L522.543 264.93H520.603L520.476 265.04L520.486 265.515L518.86 264.755L519.429 265.215L520.582 266H522.558L523.716 265.215L524.28 264.755L522.66 265.515Z"
        fill="#C0AC9D"
        stroke="#C0AC9D"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M522.533 263.92L522.289 263.75H520.857L520.613 263.92L520.476 265.04L520.603 264.93H522.543L522.675 265.04L522.533 263.92Z"
        fill="#161616"
        stroke="#161616"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M527.714 257.995L528.146 255.925L527.496 254L522.533 257.625L524.443 259.215L527.14 259.99L527.735 259.305L527.476 259.12L527.887 258.75L527.572 258.51L527.984 258.2L527.714 257.995Z"
        fill="#763E1A"
        stroke="#763E1A"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M515 255.925L515.437 257.995L515.157 258.2L515.574 258.51L515.259 258.75L515.67 259.12L515.411 259.305L516.006 259.99L518.703 259.215L520.613 257.625L515.65 254L515 255.925Z"
        fill="#763E1A"
        stroke="#763E1A"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M527.14 259.99L524.443 259.215L525.256 260.425L524.042 262.76L525.647 262.74H528.045L527.14 259.99Z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M518.703 259.215L516.006 259.99L515.106 262.74H517.499L519.104 262.76L517.89 260.425L518.703 259.215Z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M522.361 260.555L522.533 257.625L523.316 255.54H519.831L520.613 257.625L520.786 260.555L520.852 261.475L520.857 263.75H522.29L522.295 261.475L522.361 260.555Z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <filter
          id="filter0_d_2133:17259"
          x="0"
          y="44"
          width="332"
          height="210"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology
            radius="6"
            operator="dilate"
            in="SourceAlpha"
            result="effect1_dropShadow_2133:17259"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="12.5" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_2133:17259"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_2133:17259"
            result="shape"
          />
        </filter>
        <pattern
          id="pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use
            xlinkHref="#image0_2133:17259"
            transform="translate(0 -0.0770822) scale(0.00170068 0.00310259)"
          />
        </pattern>
        <filter
          id="filter1_d_2133:17259"
          x="467"
          y="122"
          width="332"
          height="198"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology
            radius="6"
            operator="dilate"
            in="SourceAlpha"
            result="effect1_dropShadow_2133:17259"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="12.5" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_2133:17259"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_2133:17259"
            result="shape"
          />
        </filter>
        <filter
          id="filter2_d_2133:17259"
          x="666"
          y="229"
          width="75.2266"
          height="75"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="2.5" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.916667 0 0 0 0 0.916667 0 0 0 0 0.916667 0 0 0 0.26 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_2133:17259"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_2133:17259"
            result="shape"
          />
        </filter>
        <pattern
          id="pattern1"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use
            xlinkHref="#image1_2133:17259"
            transform="translate(0 -0.000404155) scale(0.00301205 0.00345106)"
          />
        </pattern>
        <linearGradient
          id="paint0_linear_2133:17259"
          x1="30"
          y1="20.1898"
          x2="79.0003"
          y2="20.3"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#037DD6" />
          <stop offset="1" stopColor="#1098FC" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_2133:17259"
          x1="498"
          y1="98.1898"
          x2="547"
          y2="98.3"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#037DD6" />
          <stop offset="1" stopColor="#1098FC" />
        </linearGradient>
        <image
          id="image0_2133:17259"
          width="588"
          height="372"
          xlinkHref="./images/onboarding/pin/onboarding-pin-0.png"
        />
        <image
          id="image1_2133:17259"
          width="332"
          height="290"
          xlinkHref="./images/onboarding/pin/onboarding-pin-1.png"
        />
      </defs>
    </svg>
  );
}
