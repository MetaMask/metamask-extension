export function getCaretCoordinates(element, position) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const div = document.createElement('div');
  div.id = 'password-mirror-div';
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  document.body.appendChild(div);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const computed = window.getComputedStyle(element);
  div.textContent = new Array(position + 1).join('•');
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const span = document.createElement('span');
  span.textContent = '•';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth, 10),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth, 10),
  };
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  document.body.removeChild(div);
  return coordinates;
}
