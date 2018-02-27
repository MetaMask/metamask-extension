start the dual servers (dapp + mascara)
```
npm run mascara
```

### First time use:

- navigate to: http://localhost:9001
- Create an Account
- go back to http://localhost:9002
- open devTools
- click Sync Tx

### Tests:

```
npm run testMascara
```

Test will run in browser, you will have to have these browsers installed:

- Chrome
- Firefox
- Opera


### Deploy:

Will build and deploy mascara via docker

```
docker-compose build && docker-compose stop && docker-compose up -d && docker-compose logs --tail 200 -f
```