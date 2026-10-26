const functions = require("firebase-functions");
const {Client, Environment} = require("square/legacy");
const crypto = require("crypto");

const squareClient = new Client({
  environment: Environment.Sandbox,
  // eslint-disable-next-line max-len
  accessToken: "EAAAl4sggFwDwb6dJec8GQIdpT8FBZUYxef-cuF5yPZANDdqC4UYQRCASI3Z8w5l",
});

exports.createCheckoutLink = functions.https.onCall(async (data, context) => {
  try {
    const {price, designCode} = data;
    const priceInCents = Math.round(price * 100);

    const response = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      quickPay: {
        name: `FieldMatrix Custom Build (${designCode})`,
        priceMoney: {
          amount: priceInCents,
          currency: "CAD",
        },
        locationId: "LK8P9FFM9TCNE",
      },
      checkoutOptions: {
        redirectUrl: "https://field-matrix.glitchygrizzly.com/success",
      },
    });

    return {url: response.result.paymentLink.url};
  } catch (error) {
    console.error("Square API Error:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Unable to create checkout link.",
    );
  }
});
