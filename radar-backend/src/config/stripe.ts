import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil" as any,
});

export const crearSesionCheckout = async (usuarioId: string, email: string) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Radar Urbano Premium",
            description: "Reportes ilimitados · Descripción personalizada",
          },
          unit_amount: 499, // $4.99 USD
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: "radarurbano://premium-exito",
    cancel_url: "radarurbano://premium-cancelado",
    customer_email: email,
    metadata: { usuarioId },
  });

  return session.url;
};

export const verificarWebhook = (body: string, signature: string) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
};

export default stripe;
