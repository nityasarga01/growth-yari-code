import express from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Create payment intent for session
router.post('/create-intent', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { session_id, amount, currency = 'usd' } = req.body;

  if (!session_id || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Session ID and amount are required'
    });
  }

  // Get session details
  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      id, title, price, client_id,
      expert:expert_id(id, name, email)
    `)
    .eq('id', session_id)
    .single();

  if (error || !session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  // Verify user is the client
  if (session.client_id !== req.user!.id) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to pay for this session'
    });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        session_id,
        client_id: req.user!.id,
        expert_id: session.expert.id
      },
      description: `Payment for session: ${session.title}`
    });

    // Store payment intent in database
    await supabaseAdmin
      .from('payments')
      .insert({
        id: paymentIntent.id,
        session_id,
        client_id: req.user!.id,
        expert_id: session.expert.id,
        amount,
        currency,
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
}));

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update payment status
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      // Update session status to confirmed
      if (paymentIntent.metadata.session_id) {
        await supabaseAdmin
          .from('sessions')
          .update({ status: 'confirmed' })
          .eq('id', paymentIntent.metadata.session_id);
      }

      console.log('Payment succeeded:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      
      // Update payment status
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', failedPayment.id);

      console.log('Payment failed:', failedPayment.id);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}));

// Get payment history
router.get('/history', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: payments, error } = await supabaseAdmin
    .from('payments')
    .select(`
      id, amount, currency, status, created_at, completed_at,
      session:session_id(id, title, scheduled_at),
      expert:expert_id(id, name, avatar, profession),
      client:client_id(id, name, avatar)
    `)
    .or(`client_id.eq.${req.user!.id},expert_id.eq.${req.user!.id}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  if (error) {
    console.error('Payment history fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }

  res.json({
    success: true,
    data: { payments }
  });
}));

// Get earnings summary (for experts)
router.get('/earnings', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { data: earnings, error } = await supabaseAdmin
    .from('payments')
    .select('amount, completed_at')
    .eq('expert_id', req.user!.id)
    .eq('status', 'completed');

  if (error) {
    console.error('Earnings fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch earnings'
    });
  }

  const totalEarnings = earnings?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  const monthlyEarnings = earnings?.filter(payment => 
    new Date(payment.completed_at) >= thisMonth
  ).reduce((sum, payment) => sum + payment.amount, 0) || 0;

  res.json({
    success: true,
    data: {
      total_earnings: totalEarnings,
      monthly_earnings: monthlyEarnings,
      total_sessions: earnings?.length || 0
    }
  });
}));

export { router as paymentRoutes };