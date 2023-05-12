import Rainbow from '@indot/rainbowvis';

export const WHITE_HEX = '#ffffff';

export function rgbToHex(array) {
  const [red, green, blue] = array;
  // eslint-disable-next-line no-bitwise
  const rgb = (red << 16) | (green << 8) | (blue << 0);
  return `#${(0x1000000 + rgb).toString(16).slice(1)}`;
}

export function hexToRgb(color) {
  let hex = color[0] === '#' ? color.slice(1) : color;
  let c;

  // expand the short hex by doubling each character, fc0 -> ffcc00
  if (hex.length !== 6) {
    hex = (() => {
      const result = [];
      for (c of Array.from(hex)) {
        result.push(`${c}${c}`);
      }
      return result;
    })().join('');
  }
  const colorStr = hex.match(/#?(.{2})(.{2})(.{2})/).slice(1);
  const rgb = colorStr.map((col) => parseInt(col, 16));
  rgb.push(1);
  return rgb;
}

export function rgbToHsl(rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const add = max + min;

  const hue =
    min === max
      ? 0
      : r === max
      ? ((60 * (g - b)) / diff + 360) % 360
      : g === max
      ? (60 * (b - r)) / diff + 120
      : (60 * (r - g)) / diff + 240;

  const lum = 0.5 * add;

  const sat =
    lum === 0 ? 0 : lum === 1 ? 1 : lum <= 0.5 ? diff / add : diff / (2 - add);

  const h = Math.round(hue);
  const s = Math.round(sat * 100);
  const l = Math.round(lum * 100);
  const a = rgb[3] || 1;

  return [h, s, l, a];
}

export function hexToHsl(color) {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);
  return `hsl(${hsl[0]},${hsl[1]}%,${hsl[2]}%)`;
}

export function hslToHex(hslString) {
  const hslRegex = /hsl\((\d+),(\d+%),(\d+%)\)/;
  const match = hslString.match(hslRegex);
  const h = parseInt(match[1]);
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const getRainbowColor = (color1, color2, numberOfColors) => {
  const rainbow = new Rainbow();
  rainbow.setNumberRange(1, numberOfColors + 1); // this is to remove white one in the end
  rainbow.setSpectrum(color1, color2, WHITE_HEX);
  let finalValue = [];
  for (let i = 1; i <= numberOfColors; i++) {
    const hexColour = rainbow.colourAt(i);
    finalValue.push(`#${hexColour}`);
  }
  finalValue.pop(); // remove that white to balance the color
  return finalValue;
};

export function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
}
