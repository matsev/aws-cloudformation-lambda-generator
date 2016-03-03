# AWS Custom Resources for Generating Lambdas

A sample project that creates an AWS Lambda function with a predefined name using a Custom Resource. Please read the
[blog post](https://www.jayway.com/2016/03/03/custom-resource-generating-lambdas/) for details.

## Installation

1. Execute the [package-lambda.sh](package-lambda.sh) script.
2. Upload the generated `lambdaGenerator.zip` file in the `target` folder to an S3 bucket.
3. Create a new stack using the [cloudformation-template.json](cloudformation-template.json) file.
4. Insert the S3 bucket and key to the `lambdaGenerator.zip` in the previous step.
5. Verify that there is an `AlphaLambda` Lambda function in the stack after it has been created.