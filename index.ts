import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as apigateway from "@pulumi/aws-apigateway";

// A Lambda function to invoke
const fn = new aws.lambda.CallbackFunction("fn", {
    callback: async (ev, ctx) => {
        return {
            statusCode: 200,
            body: `${new Date().toISOString()}`,
        };
    }
})

// Cognito userPool
const userPool = new aws.cognito.UserPool("myUserPool", {
    name: "my-user-pool",
    autoVerifiedAttributes: ["email"],
});

const userPoolDomain = new aws.cognito.UserPoolDomain("my-user-pool-domain", {
    domain: "igor-domain",
    userPoolId: userPool.id,
});

const samlProvider = new aws.cognito.IdentityProvider("saml-provider", {
    userPoolId: userPool.id,
    providerType: "SAML",
    providerName: "igor-saml-provider",
    providerDetails: {
        MetadataFile: `metadata-file-goes-here`,
    },
    attributeMapping: {
        email: "EMAIL",
    },
});

// // A REST API to route requests to HTML content and the Lambda function
const api = new apigateway.RestAPI("api", {
    routes: [
        { path: "/", localPath: "www",},
        { path: "/date", method: "GET", eventHandler: fn },
    ]
});

const userPoolClient = new aws.cognito.UserPoolClient("user-pool-client", {
    userPoolId: userPool.id,
    supportedIdentityProviders: [samlProvider.providerName],
    callbackUrls: [api.url],
    allowedOauthFlows: ["implicit", "code"],
    allowedOauthScopes: ["email", "openid"],
});



// The URL at which the REST API will be served.
export const url = api.url;
export const userPoolId = userPool.id;
export const userPoolArn = userPool.arn;
