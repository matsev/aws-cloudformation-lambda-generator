'use strict';

var response = require('cfn-response');
var AWS = require('aws-sdk');
var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});


/**
 * Helper function for creating the initial node.js "echo" Lambda.
 *
 * @param handler determines the name of the generated file as well as the name of the exported function in that file,
 *  e.g. "index.handler".
 */
function createEchoFunction(handler) {
    var dotIndex = handler.indexOf('.');
    var fileName = handler.substring(0, dotIndex);
    var handlerFunctionName = handler.substring(dotIndex + 1, handler.length);
    var echoLambdaFunction =
        "'use strict';\n" +
        "exports." + handlerFunctionName + " = function(event, context) {\n" +
        "   console.log('Event:', JSON.stringify(event));\n" +
        "   context.succeed(event);\n" +
        "};";
    var JSZip = require('jszip');
    var zip = new JSZip();
    zip.file(fileName + '.js', echoLambdaFunction);
    return zip.generate({type: 'nodebuffer'});
}


function createLambda(event, context) {
    var lambdaParams = event.ResourceProperties.Lambda;
    var functionName = lambdaParams.FunctionName;

    console.log('Creating lambda:', JSON.stringify(lambdaParams));

    // Check whether or not there is S3 bucket with a Lambda function implementation that should be used as initial version
    if (!lambdaParams.Code || !lambdaParams.Code.S3Bucket) {
        // No code provided, create echo function.
        lambdaParams.Handler = lambdaParams.Handler || 'index.handler';
        lambdaParams.Code = {ZipFile: createEchoFunction(lambdaParams.Handler)};
        lambdaParams.Description = lambdaParams.Description || 'Initial "echo" lambda';
        lambdaParams.Runtime = 'nodejs';
    }
    lambda.createFunction(lambdaParams, function (err, data) {
        if (err) {
            // Lambda creation failed, do not provide the physicalResourceId
            response.send(event, context, response.FAILED, err);
        }
        else {
            // Lambda creation succeeded, provide functionName as physicalResourceId so that this stack can delete it
            response.send(event, context, response.SUCCESS, data, functionName);
        }
    });
}


function updateLambdaConfiguration(event, context) {
    var lambdaParams = event.ResourceProperties.Lambda;
    var functionName = lambdaParams.FunctionName;

    console.log('Updating lambda:', JSON.stringify(lambdaParams));

    lambda.updateFunctionConfiguration(lambdaParams, function(err, data) {
        if (err) {
            response.send(event, context, response.FAILED, err, functionName);
        }
        else {
            response.send(event, context, response.SUCCESS, data, functionName);
        }
    });
}


function deleteLambda(event, context) {
    var lambdaParams = event.ResourceProperties.Lambda;
    var functionName = lambdaParams.FunctionName;
    var physicalResourceId = event.PhysicalResourceId;

    // Check if the physicalResourceId has the same value as provided by the createLambda() function
    if (physicalResourceId === functionName) {

        // Yes, this Lambda was indeed created by this stack, ok to delete
        console.log('Deleting Lambda:', functionName);

        lambda.deleteFunction({FunctionName: functionName}, function (err, data) {
            if (err) {
                response.send(event, context, response.FAILED, err, functionName);
            }
            else {
                response.send(event, context, response.SUCCESS, data, functionName);
            }
        });
    }
    else {

        // No, this Lambda was created by someone else, do not delete, but send success response
        console.log('Do not delete Lambda:', functionName ,' (physicalResourceId:', physicalResourceId, ')');
        response.send(event, context, response.SUCCESS);
    }
}


/**
 * Lambda handler function
 *
 * @param event The incoming event that contains information configured in the Custom Resource. Specifically, the
 * "ResourceProperties" are mapped to "Properties" in the Custom Resource. Using it, the "Lambda" sub-document has the
 * same syntax as a normal AWS::Lambda:Function.
 * @param context The Lambda execution context.
 *
 * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html
 */
exports.handler = function (event, context) {
    console.log('Event:', JSON.stringify(event));

    switch (event.RequestType) {
        case 'Create':
            createLambda(event, context);
            break;

        case 'Update':
            updateLambdaConfiguration(event, context);
            break;

        case 'Delete':
            deleteLambda(event, context);
            break;

        default:
            response.send(event, context, response.FAILED, 'Unknown event: ' + event.RequestType);
            break;
    }
};