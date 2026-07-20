const AmazonCognitoIdentity = require("amazon-cognito-identity-js");

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

let userPool;
if (userPoolId && clientId) {
  const poolData = {
    UserPoolId: userPoolId,
    ClientId: clientId
  };
  userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
} else {
  // Provide a safe mock to prevent the app from crashing on load when .env is missing
  userPool = {
    getCurrentUser: () => null,
    signUp: (email, password, attributeList, validationData, callback) => {
      callback(new Error("Cognito is not configured. Missing .env variables."), null);
    }
  };
}

module.exports = userPool;
