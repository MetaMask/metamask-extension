// eslint-disable-next-line import/unambiguous
(function () {
  // LavaMoat#360 scuttling collides with chrome driver tests
  // env "cdc" props - redefine as non-configurable to solve that.
  const cdcProps = Object.keys(window).filter((k) => k.startsWith('cdc'));
  if (!cdcProps.length) {
    return;
  }

  const props = cdcProps.concat(['performance']);

  props.forEach((prop) => {
    const desc = Object.getOwnPropertyDescriptor(window, prop);
    desc.configurable = false;
    Object.defineProperty(window, prop, desc);
  });
})();
