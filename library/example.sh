# run 2 servers and make sure they close together

beefy frame.js:bundle.js 9001 --live -- -t [ babelify --global --presets [ es2015 ] ] &
beefy example/index.js:bundle.js index.js:zero.js --cwd example/ 9002 --live --open -- -t [ babelify --global --presets [ es2015 ] ]