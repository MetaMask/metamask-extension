# run 2 servers and make sure they close together

beefy frame.js:bundle.js 9001 --live &
beefy example/index.js:bundle.js index.js:zero.js --cwd example/ 9002 --live --open