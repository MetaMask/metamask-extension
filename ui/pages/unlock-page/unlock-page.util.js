export function getCaretCoordinates(element, position) {
  const div = document.createElement('div');
  div.id = 'password-mirror-div';
  document.body.appendChild(div);
  const computed = window.getComputedStyle(element);
  div.textContent = new Array(position + 1).join('•');
  const span = document.createElement('span');
  span.textContent = '•';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth, 10),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth, 10),
  };
  document.body.removeChild(div);
  return coordinates;
}
