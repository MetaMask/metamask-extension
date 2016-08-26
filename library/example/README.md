```
trap 'kill %1' SIGINT
beefy frame.js:bundle.js 9001 --live & \
beefy example/index.js:bundle.js index.js:zero.js --cwd example/ 9002 --live --open
```