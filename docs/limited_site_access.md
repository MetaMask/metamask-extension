# Google Chrome/Brave Limited Site Access for Extensions

Problem: MetaMask doesn't work with limited site access enabled under Chrome's extensions. 

Solution: In addition to the site you wish to whitelist, you must add 'api.infura.io' as another domain, so the MetaMask extension is authorized to make RPC calls to Infura.
