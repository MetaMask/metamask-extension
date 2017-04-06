FROM node:6
MAINTAINER kumavis

# setup app dir
RUN mkdir -p /www/
WORKDIR /www/

# install dependencies
COPY ./package.json /www/package.json
RUN npm install

# copy over app dir
COPY ./ /www/

# run tests
# RUN npm test

# build app
RUN npm run dist

# start server
CMD node mascara/example/server.js
