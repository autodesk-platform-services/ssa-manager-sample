const express = require("express");
const jwt = require("jsonwebtoken");
const { PORT } = require("./config.js");

let app = express();
app.use(express.json());
app.use(express.static("wwwroot"));
app.post("/token", async function (req, res, next) {
    function createJwtAssertion(kid, privateKey, clientId, oxygenId, scope) {
        privateKey = privateKey.replace(/\\n/g, "\n");
        console.log(privateKey);

        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = currentTime + 300; // 5 minutes from now

        const claims = {
            iss: clientId,
            sub: oxygenId,
            aud: "https://developer.api.autodesk.com/authentication/v2/token",
            exp: expirationTime,
            scope: scope.split(" "),
        };

        console.log(claims);

        const jwtHeader = {
            alg: "RS256",
            kid: kid,
        };

        // Encode the JWT
        const jwtAssertion = jwt.sign(claims, privateKey, {
            algorithm: "RS256",
            header: jwtHeader,
        });

        console.log(jwtAssertion);

        return jwtAssertion;
    }

    function getBasicAuthHeader(clientId, clientSecret) {
        const authString = `${clientId}:${clientSecret}`;
        return `Basic ${Buffer.from(authString).toString("base64")}`;
    }

    try {
        const jwtAssertion = createJwtAssertion(
            req.body.kid,
            req.body.privateKey,
            req.body.clientId,
            req.body.accountId,
            req.body.scope
        );

        const headers = {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: getBasicAuthHeader(
                req.body.clientId,
                req.body.clientSecret
            ),
        };

        const payload = new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwtAssertion,
            scope: req.body.scope,
        });

        const token = await fetch(
            `https://developer.api.autodesk.com/authentication/v2/token`,
            {
                method: "POST",
                headers: headers,
                body: payload,
            }
        );

        const tokenData = await token.json();

        console.log(tokenData.access_token);

        res.json(tokenData);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});
app.listen(PORT, function () {
    console.log(`Server listening on port ${PORT}...`);
});
