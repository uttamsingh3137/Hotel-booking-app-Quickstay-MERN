import stripe from 'stripe';
import Booking from '../models/Booking.js';

export const stripeWebhooks = async(req,res)=>{
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(req.body , sig, process.env.STRIPE_WEBHOOKS_SECRET)
    } catch (error) {
        res.status(400).send(`Webhook error : ${error.message}`)   
    }

    if(event.type === 'payment_intent.succeeded'){
        const payment_intent = event.data.object;
        const paymentIntentId = payment_intent.id;

        const session = await stripeInstance.checkout.sessions.list({
            payment_intent : paymentIntentId , 
        })

        const {bookingId} = session.data[0].metadata;

        await Booking.findByIdAndUpdate(bookingId , {isPaid : true , paymentMethod : 'Stripe'})
    }else{
        console.log("Unhandeled Event type : ", event.type)
    }
    res.json({recieved : true})

} 