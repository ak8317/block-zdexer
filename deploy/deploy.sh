#!/bin/sh
npm install
npm run codegen
npm run build
npm run start:docker
