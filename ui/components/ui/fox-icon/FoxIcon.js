import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  fillInFoxColor,
  FOX_COLOR_PALETTE,
  generateColorPurelyOnAddress,
  generateColorsFromAI,
} from '../../../helpers/utils/generative-color';

import { PREDEFINED_COLOR_PALETTES } from '../../../helpers/constants/color-palette';
import useDidMountEffect from '../../../helpers/utils/useDidMountEffect';

export const COLOR_PALETTE_TYPE = {
  generative: 'generative',
  ai: 'ai',
  editorSelection: 'editorSelection',
  previousSelected: 'previousSelected',
  default: 'default',
};

const FoxIcon = ({
  size = 240,
  address,
  colorPaletteType,
  editorSelection = null,
  settledColorSchema,
  handleNewColorSettled,
  shouldShuffle,
}) => {
  const [colorSchema, setColorSchema] = useState(
    settledColorSchema || fillInFoxColor(generateColorPurelyOnAddress(address)),
  );

  // doesnt run when component is loaded
  useDidMountEffect(() => {
    switch (colorPaletteType) {
      case COLOR_PALETTE_TYPE.generative:
        setColorSchema(fillInFoxColor(generateColorPurelyOnAddress(address)));
        break;
      case COLOR_PALETTE_TYPE.ai:
        async function fetchAISchema() {
          const colorsFromAI = await generateColorsFromAI(
            address,
            shouldShuffle,
          );
          setColorSchema(fillInFoxColor(colorsFromAI));
        }

        fetchAISchema();
        break;
      case COLOR_PALETTE_TYPE.editorSelection:
        setColorSchema(
          fillInFoxColor(PREDEFINED_COLOR_PALETTES[editorSelection - 1]),
        );
        break;
      case COLOR_PALETTE_TYPE.previousSelected:
        setColorSchema(settledColorSchema);
        break;
      case COLOR_PALETTE_TYPE.default:
        setColorSchema(Object.values(FOX_COLOR_PALETTE));
        break;
      default:
        setColorSchema(fillInFoxColor(generateColorPurelyOnAddress(address)));
        break;
    }
  }, [address, colorPaletteType, editorSelection]);

  useEffect(() => {
    if (handleNewColorSettled) {
      handleNewColorSettled(colorSchema);
    }
  }, [colorSchema, handleNewColorSettled]);

  useEffect(() => {
    console.log(colorPaletteType);
    if (!colorPaletteType) {
      console.log('inside, ', settledColorSchema[0]);
      setColorSchema(settledColorSchema);
    }
  }, [colorPaletteType, settledColorSchema]);

  // shuffle flagggg
  useEffect(() => {
    if (colorPaletteType === COLOR_PALETTE_TYPE.generative) {
      setColorSchema(fillInFoxColor(generateColorPurelyOnAddress(address)));
    } else if (colorPaletteType === COLOR_PALETTE_TYPE.ai) {
      async function fetchAISchema() {
        const colorsFromAI = await generateColorsFromAI(address, shouldShuffle);
        setColorSchema(fillInFoxColor(colorsFromAI));
      }
      fetchAISchema();
    }
  }, [shouldShuffle, address]);

  const [
    mouthBaseColor,
    mouthShadow,
    eyesColor,
    noseColor,
    earBaseColor,
    primaryShadow,
    secondaryShadow,
    tertiaryShadow,
    baseSkinTone,
  ] = colorSchema;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 471 433"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M447.473 0.878788L263.971 135.757L298.095 56.2689L447.473 0.878788Z"
        fill={secondaryShadow}
        stroke={secondaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.2054 0.878788L206.073 137.016L173.584 56.2688L24.2054 0.878788Z"
        fill={secondaryShadow}
        stroke={secondaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M381.406 313.616L332.581 387.71L437.127 416.304L467.076 315.235L381.406 313.616Z"
        fill={secondaryShadow}
        stroke={secondaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.78297 315.235L34.5498 416.304L138.916 387.71L90.2718 313.616L4.78297 315.235Z"
        fill={secondaryShadow}
        stroke={secondaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M133.289 188.449L104.248 231.97L207.707 236.646L204.257 126.046L133.289 188.449Z"
        fill={secondaryShadow}
        stroke={secondaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M338.388 188.449L266.331 124.787L263.972 236.646L367.429 231.97L338.388 188.449Z"
        fill={secondaryShadow}
        stroke={secondaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M138.916 387.71L201.534 357.677L147.628 315.955L138.916 387.71Z"
        fill={secondaryShadow}
        stroke={secondaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M270.144 357.677L332.58 387.71L324.051 315.955L270.144 357.677Z"
        fill={secondaryShadow}
        stroke={secondaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M332.58 387.71L270.142 357.677L275.225 397.961L274.68 415.045L332.58 387.71Z"
        fill={mouthBaseColor}
        stroke={mouthBaseColor}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M138.914 387.71L196.996 415.045L196.633 397.961L201.534 357.677L138.914 387.71Z"
        fill={mouthBaseColor}
        stroke={mouthBaseColor}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M198.086 289.338L146.175 274.233L182.84 257.507L198.086 289.338Z"
        fill={eyesColor}
        stroke={eyesColor}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M273.59 289.338L288.837 257.507L325.683 274.233L273.59 289.338Z"
        fill={eyesColor}
        stroke={eyesColor}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M138.916 387.71L147.99 313.616L90.2716 315.236L138.916 387.71Z"
        fill={primaryShadow}
        stroke={primaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M323.686 313.616L332.58 387.71L381.405 315.236L323.686 313.616Z"
        fill={primaryShadow}
        stroke={primaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M367.429 231.97L263.971 236.646L273.59 289.338L288.837 257.507L325.683 274.233L367.429 231.97Z"
        fill={primaryShadow}
        stroke={primaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M146.175 274.233L182.839 257.507L198.086 289.338L207.705 236.646L104.248 231.97L146.175 274.233Z"
        fill={primaryShadow}
        stroke={primaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M104.248 231.97L147.628 315.955L146.176 274.233L104.248 231.97Z"
        fill={tertiaryShadow}
        stroke={tertiaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M325.684 274.233L324.051 315.955L367.431 231.97L325.684 274.233Z"
        fill={tertiaryShadow}
        stroke={tertiaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M207.707 236.646L198.086 289.34L210.247 351.562L212.97 269.557L207.707 236.646Z"
        fill={tertiaryShadow}
        stroke={tertiaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M263.972 236.646L258.89 269.378L261.431 351.562L273.592 289.34L263.972 236.646Z"
        fill={tertiaryShadow}
        stroke={tertiaryShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M273.592 289.338L261.431 351.562L270.144 357.677L324.051 315.955L325.684 274.233L273.592 289.338Z"
        fill={baseSkinTone}
        stroke={baseSkinTone}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M146.175 274.233L147.628 315.955L201.534 357.677L210.247 351.562L198.086 289.338L146.175 274.233Z"
        fill={baseSkinTone}
        stroke={baseSkinTone}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M274.68 415.045L275.225 397.961L270.505 394.004H201.171L196.633 397.961L196.996 415.045L138.914 387.71L159.244 404.255L200.444 432.49H271.05L312.434 404.255L332.581 387.71L274.68 415.045Z"
        fill={mouthShadow}
        stroke={mouthShadow}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M270.144 357.677L261.431 351.562H210.247L201.534 357.677L196.633 397.961L201.171 394.004H270.505L275.225 397.961L270.144 357.677Z"
        fill={noseColor}
        stroke={noseColor}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M455.278 144.569L470.706 70.1163L447.473 0.878788L270.144 131.262L338.388 188.449L434.768 216.325L456.004 191.687L446.747 185.032L461.449 171.725L450.196 163.093L464.898 151.942L455.278 144.569Z"
        fill={earBaseColor}
        stroke={earBaseColor}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.971429 70.1163L16.5809 144.569L6.59814 151.942L21.4815 163.093L10.2282 171.725L24.9301 185.032L15.6733 191.687L36.9094 216.325L133.289 188.449L201.534 131.262L24.2041 0.878788L0.971429 70.1163Z"
        fill={earBaseColor}
        stroke={earBaseColor}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M434.769 216.325L338.39 188.449L367.431 231.97L324.051 315.955L381.406 315.235H467.076L434.769 216.325Z"
        fill={baseSkinTone}
        stroke={baseSkinTone}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M133.288 188.449L36.909 216.325L4.78255 315.235H90.2713L147.627 315.955L104.247 231.97L133.288 188.449Z"
        fill={baseSkinTone}
        stroke={baseSkinTone}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M263.971 236.646L270.142 131.262L298.095 56.269H173.583L201.534 131.262L207.705 236.646L210.065 269.736L210.247 351.562H261.431L261.613 269.736L263.971 236.646Z"
        fill={baseSkinTone}
        stroke={baseSkinTone}
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

FoxIcon.propTypes = {
  size: PropTypes.number,
  address: PropTypes.string,
  colorPaletteType: PropTypes.string,
  editorSelection: PropTypes.number,
  settledColorSchema: PropTypes.array,
  handleNewColorSettled: PropTypes.func,
  shouldShuffle: PropTypes.bool,
};

export default FoxIcon;
