
FROM onfinality/subql-query:latest as builder

WORKDIR /home/zdexer-query

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/lib/node_modules/@subql/query/bin/run"]
CMD ["--name","app", "--playground", "--port", "3003", "--query-timeout","120000"]
