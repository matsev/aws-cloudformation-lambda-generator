#!/bin/bash

# Script for packaging the Lambda function. The generated Lambda will located in the /target folder
# Ref: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html

TARGET_DIR=target

rm -rf $TARGET_DIR
mkdir -p $TARGET_DIR

cp -r *.js package.json bin lib $TARGET_DIR
pushd $TARGET_DIR
npm install --production
zip -r lambdaGenerator.zip .
popd
