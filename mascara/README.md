start the dual servers (dapp + mascara)
```
node server.js
```

## First time use:

- navigate to: http://localhost:9001/popup/popup.html
- Create an Account
- go back to http://localhost:9002/
- open devTools
- click Sync Tx

### Todos

  - [ ] Figure out user flows and UI redesign
  - [ ] Figure out FireFox
    Standing problems:
    - [ ] IndexDb


### deploy

```
docker-compose build && docker-compose stop && docker-compose up -d && docker-compose logs -f --tail 10
```