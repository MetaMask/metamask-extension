import MersenneTwister from '../../../node_modules/mersenne-twister';
import Rainbow from '@indot/rainbowvis';

import { jsNumberForAddress } from './icon-factory';
import { hexToHsl, hslToHex, getRainbowColor, WHITE_HEX } from './color-util';

export const FOX_COLOR_PALETTE = {
  mouthBaseColor: '#D5BFB2', // mouth
  mouthShadow: '#C0AC9D', // mouth shadow
  eyesColor: '#233447', // eyes
  noseColor: '#161616', // nose
  earBaseColor: '#763E1A', // ear base color
  primaryShadow: '#CC6228', // darkest shadow
  secondaryShadow: '#E27625', // 2nd shadow
  tertiaryShadow: '#E27525', // 3rd shadow
  baseSkinTone: '#F5841F', // base skin tone
};

const generateColorBasedOnAddress = (
  address,
  saturation = 100,
  lightness = 75,
) => {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  return hslToHex(`hsl(${Math.abs(hash) % 360},${saturation}%,${lightness}%)`);
};

const generateColorIndex = (slicedAddress) => {
  const seed = jsNumberForAddress(slicedAddress);
  const generator = new MersenneTwister(seed);
  const randomIndex = Math.floor(
    generator.random() * Object.values(FOX_COLOR_PALETTE).length,
  );
  return randomIndex;
};

// const str = "9a02165b1a35d2be921aa7607fe55279719820ab";
// ["#9a0216", "#5b1a35", "#d2be92", "#1aa760", "#7fe552", "#797198"]
const getColorsByAddress = (address) => {
  const usefulAddress = address.slice(2); // 40 char;
  const regex = /.{6}/g; // Matches any character except for a newline, exactly 6 times.
  const colorArray = usefulAddress.match(regex).map((chunk) => `#${chunk}`);
  return colorArray;
};

// https://bost.ocks.org/mike/shuffle/
/* Randomize array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// plus one from random color coming from address inserted randomly
export const generateColorPurelyOnAddress = (address) => {
  const slicedAddress = address.slice(2, 10);
  const colorsFromAddress = getColorsByAddress(address); // 5 in total
  const colorFromAddressString = generateColorBasedOnAddress(slicedAddress); // 1 color

  // TODO: Danica If user are not happy with the generated one
  // they can shuffle to a different set until they are happy
  shuffleArray(colorsFromAddress);

  // Insert the 1 color randomly inside array of 5
  colorsFromAddress.splice(
    generateColorIndex(slicedAddress),
    0,
    colorFromAddressString,
  );
  return colorsFromAddress;
};

export const fillInFoxColor = (address) => {
  const colorArray = generateColorPurelyOnAddress(address);
  const mouthColors = getRainbowColor(colorArray[0], WHITE_HEX, 3);
  // primaryShadow, secondaryShadow, tertiaryShadow, baseSkinTone
  const skinColors = getRainbowColor(colorArray[4], colorArray[5], 5);
  return {
    mouthBaseColor: hexToHsl(mouthColors[0]), // mouth
    mouthShadow: hexToHsl(mouthColors[1]), // mouth shadow
    eyesColor: hexToHsl(colorArray[1]), // eyes
    noseColor: hexToHsl(colorArray[2]), // nose
    earBaseColor: hexToHsl(colorArray[3]), // ear base color
    primaryShadow: hexToHsl(skinColors[0]), // darkest shadow
    secondaryShadow: hexToHsl(skinColors[1]), // 2nd shadow
    tertiaryShadow: hexToHsl(skinColors[2]), // 3rd shadow
    baseSkinTone: hexToHsl(skinColors[3]), // base skin tone
  };
};
