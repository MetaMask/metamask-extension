import type { Location as RouterLocation } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { sanitizeRedirectUrl } from '../../../shared/lib/safe-redirect';

export function getCaretCoordinates(element: HTMLElement, position: number) {
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

export function getIntendedRoute(location: RouterLocation) {
  const fromSearchParam = new URLSearchParams(location.search).get('from');
  const safeFrom = sanitizeRedirectUrl(fromSearchParam);

  if (safeFrom) {
    return safeFrom;
  }

  return DEFAULT_ROUTE;
}
