FROM lalitkumarzeeve/subql-newrelic-updated-url-support:v2.0.12 as builder
ARG GITLAB_ACCESS_TOKEN
ARG PORT=3002
ARG BUILD_ENV

WORKDIR /home/subquery-indexer
COPY . ./
ENV NODE_ENV ${BUILD_ENV}
ENV NODE_CONFIG_ENV ${BUILD_ENV}

RUN apk add --no-cache bash && apk add jq && export GITLAB_ACCESS_TOKEN=${GITLAB_ACCESS_TOKEN} && npm install
RUN npm install node-fetch@^2.6.6 && npm run codegen
RUN npm run build
 
EXPOSE ${PORT}
ENTRYPOINT ["/sbin/tini", "--", "/home/subql-avalanche/packages/node/bin/run"]
CMD ["-f","./", "--db-schema", "app", "--network-endpoint", "https://pramodzeeve:juys947abhg4L@zeeve.zdexer-avax-cc2b6b.zeeve.net?apikey=pramodzeeve:juys947abhg4L", "--disable-historical","true",  "--port", "3002", "--unsafe", "--workers", "15"]
