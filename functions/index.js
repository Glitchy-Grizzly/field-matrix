const functions = require("firebase-functions");
const {Client, Environment} = require("square/legacy");
const crypto = require("crypto");

const squareClient = new Client({
  environment: Environment.Sandbox,
  accessToken:
    "EAAAl4sggFwDwb6dJec8GQIdpT8FBZUYxef-cuF5yPZANDdqC4UYQRCASI3Z8w5l",
});

exports.createCheckoutLink =
  functions.https.onCall(async (data, context) => {
    try {
      const payload = data && data.data ? data.data : data;

      // Support both new multi-item array and old single-item format
      let items = payload && payload.items;
      if (!Array.isArray(items)) {
        if (payload && payload.price) {
          items = [
            {
              price: payload.price,
              designCode: payload.designCode || "CUSTOM",
              quantity: 1,
            },
          ];
        } else {
          throw new Error("Invalid or missing items in checkout request.");
        }
      }

      if (items.length === 0) {
        throw new Error("Cart is empty.");
      }

      let totalQuantity = 0;

      const lineItems = items.map((item, index) => {
        const price = Number(item.price);
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const code = item.designCode || "CUSTOM";

        if (isNaN(price) || price <= 0) {
          throw new Error(`Invalid price at item ${index + 1}: ${item.price}`);
        }

        totalQuantity += qty;

        return {
          name: `FieldMatrix Custom Build (${code})`,
          quantity: String(qty),
          basePriceMoney: {
            amount: Math.round(price * 100),
            currency: "CAD",
          },
        };
      });

      // $13.95 base (1395 cents) + $3.50 (350 cents) per extra item
      const baseShippingCents = 1395;
      const extraItemFeeCents = 350;
      const totalShippingCents =
        baseShippingCents + Math.max(0, totalQuantity - 1) * extraItemFeeCents;

      const shippingLabel =
        totalQuantity > 1 ?
          `Provinces-Only Shipping (${totalQuantity} items)` :
          "Provinces-Only Shipping (Canada)";

      const response = await squareClient.checkoutApi
          .createPaymentLink({
            idempotencyKey: crypto.randomUUID(),
            order: {
              locationId: "LK8P9FFM9TCNE",
              lineItems: lineItems,
            },
            checkoutOptions: {
              redirectUrl:
                "https://field-matrix.glitchygrizzly.com/success",
              askForShippingAddress: true,
              shippingFee: {
                name: shippingLabel,
                charge: {
                  amount: totalShippingCents,
                  currency: "CAD",
                },
              },
            },
          });

      return {url: response.result.paymentLink.url};
    } catch (error) {
      console.error("Square API Error:", error);
      throw new functions.https.HttpsError(
          "invalid-argument",
          error.message || "Unable to create checkout link.",
      );
    }
  });
