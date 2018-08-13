window.onload = function() {
  if (window.location.pathname === '/phishing.html') {
      document.getElementById('esdbLink').innerHTML = '<b>To read more about this scam, navigate to: <a href="https://etherscamdb.info/domain/' + window.location.hash.substring(1) + '"> https://etherscamdb.info/domain/' + window.location.hash.substring(1) + '</a></b>'
  }
}
