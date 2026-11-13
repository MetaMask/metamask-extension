// SPIKE: zero-import home shell. Paints a cached account/balance snapshot as
// plain DOM before the heavy bundles evaluate. React replaces #app-content's
// children on first render, which removes the shell.
(function () {
  var root = document.getElementById('app-content');
  if (!root) {
    return;
  }
  var snap = { name: 'Account 1', balance: '$1,234.56', tokens: [['ETH', '0.5'], ['USDC', '100']] };
  try {
    var raw = localStorage.getItem('mm-home-shell');
    if (raw) {
      snap = JSON.parse(raw);
    }
  } catch (e) {
    // use default
  }
  var shell = document.createElement('div');
  shell.id = 'home-shell';
  shell.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:#fff;padding:24px;font:16px sans-serif;z-index:10';
  var title = document.createElement('div');
  title.textContent = snap.name;
  var bal = document.createElement('div');
  bal.textContent = snap.balance;
  bal.setAttribute('elementtiming', 'shell-balance');
  bal.style.cssText = 'font-size:40px;margin:16px 0';
  shell.appendChild(title);
  shell.appendChild(bal);
  snap.tokens.forEach(function (t) {
    var row = document.createElement('div');
    row.textContent = t[0] + '  ' + t[1];
    row.style.cssText = 'padding:12px 0;border-top:1px solid #ddd';
    shell.appendChild(row);
  });
  root.appendChild(shell);
  performance.mark('home-shell-inserted');
})();