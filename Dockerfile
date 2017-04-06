FROM node:6
MAINTAINER kumavis

# setup app dir
RUN mkdir -p /www/
WORKDIR /www/

# install dependencies
COPY ./package.json /www/package.json
# RUN npm install -g node-gyp
RUN npm install >> npm_log 2>> npm_err || true

RUN cat npm_log && cat npm_err

# copy over app dir
COPY ./ /www/

# run tests
# RUN npm test

# build app
RUN npm run dist

# start server
CMD node mascara/example/server.js
