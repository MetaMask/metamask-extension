start the dual servers (dapp + mascara)
```
node server.js
```

open the example dapp at `http://localhost:9002/`

*You will need to build MetaMask in order for this to work*
```
gulp dev
```
to build MetaMask and have it live reload if you make changes


## First time use:

- navigate to: http://127.0.0.1:9001/popup/popup.html
- Create an Account
- go back to http://localhost:9002/
- open devTools
- click Sync Tx

### Todos
- Look into using [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
