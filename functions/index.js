const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Client, Environment} = require("square/legacy");
const crypto = require("crypto");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Sandbox values for testing (swap to Production when ready)
const DEFAULT_TOKEN =
  "EAAAl4sggFwDwb6dJec8GQIdpT8FBZUYxef-cuF5yPZANDdqC4UYQRCASI3Z8w5l";
const SQUARE_ACCESS_TOKEN =
  process.env.SQUARE_ACCESS_TOKEN || DEFAULT_TOKEN;
const SQUARE_LOCATION_ID =
  process.env.SQUARE_LOCATION_ID || "LK8P9FFM9TCNE";

const squareClient = new Client({
  environment: Environment.Sandbox,
  accessToken: SQUARE_ACCESS_TOKEN,
});

exports.createCheckoutLink =
  functions.https.onCall(async (data, context) => {
    try {
      const payload = data && data.data ? data.data : data;

      // Support both multi-item array and single-item format
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
      const lineItems = [];
      const orderCodes = [];

      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const rawQty = parseInt(item.quantity, 10) || 1;
        const qty = Math.max(1, Math.min(50, rawQty));
        const rawCode = String(item.designCode || "CUSTOM");
        const code = rawCode.trim().toUpperCase();

        let verifiedPrice = Number(item.price);
        let itemNote = `Design Code: ${code}`;

        if (code !== "CUSTOM") {
          const docRef = db.collection("fieldmatrix_orders").doc(code);
          const orderSnap = await docRef.get();
          if (!orderSnap.exists) {
            throw new Error(
                `Design Code ${code} not found. Click Review Spec first.`,
            );
          }
          const orderData = orderSnap.data();
          if (
            orderData &&
            typeof orderData.estimatedPrice === "number" &&
            orderData.estimatedPrice > 0
          ) {
            verifiedPrice = Number(orderData.estimatedPrice);
          }
          if (orderData && orderData.dimensionsSummary) {
            const dimSum = orderData.dimensionsSummary;
            const colSum = orderData.colorsSummary || "";
            itemNote = `${dimSum} | ${colSum}`.slice(0, 450);
          }
        }

        const isBadPrice =
          isNaN(verifiedPrice) || verifiedPrice < 5 || verifiedPrice > 2000;
        if (isBadPrice) {
          throw new Error(
              `Invalid price at item ${index + 1}: ${verifiedPrice}`,
          );
        }

        totalQuantity += qty;
        orderCodes.push(code);

        lineItems.push({
          name: `FieldMatrix Custom Build (${code})`,
          quantity: String(qty),
          note: itemNote,
          basePriceMoney: {
            amount: Math.round(verifiedPrice * 100),
            currency: "CAD",
          },
        });
      }

      // $13.95 base (1395 cents) + $3.50 (350 cents) per extra item
      const baseShippingCents = 1395;
      const extraItemFeeCents = 350;
      const extraCount = Math.max(0, totalQuantity - 1);
      const totalShippingCents =
        baseShippingCents + extraCount * extraItemFeeCents;

      const shippingLabel =
        totalQuantity > 1 ?
          `Provinces-Only Shipping (${totalQuantity} items)` :
          "Provinces-Only Shipping (Canada)";

      const response = await squareClient.checkoutApi
          .createPaymentLink({
            idempotencyKey: crypto.randomUUID(),
            order: {
              locationId: SQUARE_LOCATION_ID,
              referenceId: orderCodes.join(",").slice(0, 40),
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
