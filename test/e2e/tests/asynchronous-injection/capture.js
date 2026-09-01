// External capture script: runs whenever the page's CSP allows same-origin
// scripts (`script-src-elem 'self' …`). If the inline `<script>` in
// `index.html` was blocked by CSP, this is the only chance to set the
// property
window.ethereumAvailableDuringPageLoad = Boolean(
  window.ethereum && window.ethereum.isMetaMask,
);
