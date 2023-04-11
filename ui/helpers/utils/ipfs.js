export function addUrlProtocolPrefix(urlString) {
  return urlString.match(/^https?:\/\//u) ? urlString : `https://${urlString}`;
}
