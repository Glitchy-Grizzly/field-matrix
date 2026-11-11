/* global BigInt */
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {Client, Environment} = require("square/legacy");
const crypto = require("crypto");
const {defineSecret} = require("firebase-functions/params");

const squareAccessToken = defineSecret("SQUARE_ACCESS_TOKEN");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const SQUARE_LOCATION_ID = "L0AEGY4GZYTDR";

exports.createCheckoutLink = onRequest(
    {secrets: [squareAccessToken], cors: true},
    async (req, res) => {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      try {
        const token = squareAccessToken.value().trim();
        const squareClient = new Client({
          environment: Environment.Production,
          accessToken: token,
        });

        const payload = req.body && req.body.data ? req.body.data : req.body;

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
            try {
              const docRef = db.collection("fieldmatrix_orders").doc(code);
              const orderSnap = await docRef.get();
              if (orderSnap.exists) {
                const orderData = orderSnap.data();
                const estPrice = orderData && orderData.estimatedPrice;
                if (typeof estPrice === "number" && estPrice > 0) {
                  verifiedPrice = Number(estPrice);
                }
                if (orderData && orderData.dimensionsSummary) {
                  const dimSum = orderData.dimensionsSummary;
                  const colSum = orderData.colorsSummary || "";
                  itemNote = `${dimSum} | ${colSum}`.slice(0, 450);
                }
              } else if (item.orderPayload) {
                const serverTime =
                  admin.firestore.FieldValue.serverTimestamp();
                await docRef.set({
                  ...item.orderPayload,
                  createdAt: serverTime,
                });
                if (item.orderPayload.dimensionsSummary) {
                  const dimSum = item.orderPayload.dimensionsSummary;
                  const colSum = item.orderPayload.colorsSummary || "";
                  itemNote = `${dimSum} | ${colSum}`.slice(0, 450);
                }
              }
            } catch (dbErr) {
              console.warn("Firestore lookup skipped:", dbErr.message);
              if (item.orderPayload && item.orderPayload.dimensionsSummary) {
                const dimSum = item.orderPayload.dimensionsSummary;
                const colSum = item.orderPayload.colorsSummary || "";
                itemNote = `${dimSum} | ${colSum}`.slice(0, 450);
              }
            }
          }

          const isBadPrice =
            isNaN(verifiedPrice) || verifiedPrice < 5 || verifiedPrice > 2000;
          if (isBadPrice) {
            const errMsg =
              `Invalid price at item ${index + 1}: ${verifiedPrice}`;
            throw new Error(errMsg);
          }

          totalQuantity += qty;
          orderCodes.push(code);
          lineItems.push({
            name: `FieldMatrix Custom Build (${code})`,
            quantity: String(qty),
            note: itemNote,
            basePriceMoney: {
              amount: BigInt(Math.round(verifiedPrice * 100)),
              currency: "CAD",
            },
          });
        }

        const baseShippingCents = 1395;
        const extraItemFeeCents = 350;
        const extraCount = Math.max(0, totalQuantity - 1);
        const extraShipping = extraCount * extraItemFeeCents;
        const totalShippingCents = baseShippingCents + extraShipping;
        const shippingLabel =
          totalQuantity > 1 ?
            `Provinces-Only Shipping (${totalQuantity} items)` :
            "Provinces-Only Shipping (Canada)";

        const response = await squareClient.checkoutApi.createPaymentLink({
          idempotencyKey: crypto.randomUUID(),
          order: {
            locationId: SQUARE_LOCATION_ID,
            referenceId: orderCodes.join(",").slice(0, 40),
            lineItems: lineItems,
          },
          checkoutOptions: {
            redirectUrl: "https://field-matrix.glitchygrizzly.com/success",
            askForShippingAddress: true,
            shippingFee: {
              name: shippingLabel,
              charge: {
                amount: BigInt(totalShippingCents),
                currency: "CAD",
              },
            },
          },
        });

        res.status(200).json({url: response.result.paymentLink.url});
      } catch (error) {
        console.error("Square API Error:", error);
        const squareErrDetail =
          error.errors && error.errors.length > 0 ?
            error.errors.map((e) => `${e.code}: ${e.detail}`).join("; ") :
            error.message;
        res.status(400).json({
          error: squareErrDetail || "Unable to create checkout link.",
        });
      }
    },
);
