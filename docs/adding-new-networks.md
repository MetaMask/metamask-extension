## Adding Custom Networks

To add another network to our dropdown menu, make sure the following files are adjusted properly:

```
app/scripts/config.js
app/scripts/lib/buy-eth-url.js
ui/app/index.js
ui/app/components/buy-button-subview.js
ui/app/components/drop-menu-item.js
ui/app/components/network.js
ui/app/components/transaction-list-item.js
ui/app/config.js
ui/app/css/lib.css
ui/lib/account-link.js
ui/lib/explorer-link.js
```

You will need:
+ The network ID
+ An RPC Endpoint url
+ An explorer link
+ CSS for the display icon

