// Borrowed from https://github.com/ai/nanoid/blob/3.0.2/non-secure/index.js
const urlAlphabet =
  'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW';

export const nanoid = (size = 21) => {
  let id = '';
  // A compact alternative for `for (var i = 0; i < step; i++)`.
  let i = size;
  /* eslint-disable-next-line no-plusplus */
  while (i--) {
    // `| 0` is more compact and faster than `Math.floor()`.
    /* eslint-disable-next-line no-bitwise */
    id += urlAlphabet[(Math.random() * 64) | 0];
  }
  return id;
};

export function getScriptNode(lang) {
  const script = document.createElement('script');
  // Chrome extensions don't have domain
  // Because of this we passing custom domain here(value doesn't matter) - discussed with hcaptcha support
  const host = 'metamask-human.com';
  script.src = `https://hcaptcha.com/1/api.js?render=explicit&onload=hcaptchaOnLoad&host=${host}`;
  script.async = true;
  if (lang) {
    script.src += `&hl=${lang}`;
  }

  return script;
}
