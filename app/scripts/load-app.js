// eslint-disable-next-line import/unambiguous
'use strict';

setTimeout(() => {
  const scriptsToLoad = [/*SCRIPTS*/];

  const loadScript = (src) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (scriptsToLoad.length) {
        loadScript(scriptsToLoad.shift());
      }
    };
    script.src = src;
    document.body.appendChild(script);
  };

  loadScript(scriptsToLoad.shift());
}, 13);
