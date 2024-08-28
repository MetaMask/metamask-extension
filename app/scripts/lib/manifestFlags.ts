export function getManifestFlags() {
  return chrome.runtime.getManifest()._flags || {};
}
