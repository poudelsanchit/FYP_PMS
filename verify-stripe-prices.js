// verify-stripe-prices.js
// Run this to check if your price IDs exist in Stripe

require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function verifyPrices() {
    console.log('Checking Stripe price IDs...\n');

    const priceIds = {
        'Premium Monthly': process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
        'Premium Yearly': process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
        'Enterprise Monthly': process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
        'Enterprise Yearly': process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
    };

    for (const [name, priceId] of Object.entries(priceIds)) {
        try {
            const price = await stripe.prices.retrieve(priceId);
            console.log(`✅ ${name}: ${priceId}`);
            console.log(`   Amount: $${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
            console.log(`   Product: ${price.product}\n`);
        } catch (error) {
            console.log(`❌ ${name}: ${priceId}`);
            console.log(`   Error: ${error.message}\n`);
        }
    }
}

verifyPrices().catch(console.error);
