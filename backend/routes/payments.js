const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Authentication middleware for payments
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

// Helper: Calculate Cybersource signature
function calculateSignature(params, secretKey) {
  const signedFieldNames = params.signed_field_names.split(',');
  const dataToSign = signedFieldNames.map(field => {
    return `${field}=${params[field]}`;
  }).join(',');

  return crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign, 'utf8')
    .digest('base64');
}

// 1. Generate Signed Cybersource Checkout Form Parameters
router.post('/create-session', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isPurchased) {
      return res.status(400).json({ error: 'Вы уже приобрели этот курс' });
    }

    const cybersourceSecretKey = process.env.CYBERSOURCE_SECRET_KEY;
    const cybersourceAccessKey = process.env.CYBERSOURCE_ACCESS_KEY;
    const cybersourceProfileId = process.env.CYBERSOURCE_PROFILE_ID;
    const currency = process.env.CYBERSOURCE_CURRENCY || 'USD';
    const amount = '49.00'; // Default course price
    const locale = process.env.CYBERSOURCE_LOCALE || 'en-us';

    const transactionUuid = crypto.randomBytes(16).toString('hex');
    // ISO format: YYYY-MM-DDTHH:MM:SSZ
    const signedDateTime = new Date().toISOString().replace(/\.\d{3}/, ''); 

    // Fields to be signed by HMAC
    const params = {
      access_key: cybersourceAccessKey,
      profile_id: cybersourceProfileId,
      transaction_uuid: transactionUuid,
      signed_field_names: 'access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,payment_method',
      unsigned_field_names: '',
      signed_date_time: signedDateTime,
      locale: locale,
      transaction_type: 'sale',
      reference_number: user._id.toString(), // Store user ID in reference_number
      amount: amount,
      currency: currency,
      payment_method: 'card'
    };

    // Calculate signature
    const signature = calculateSignature(params, cybersourceSecretKey);
    params.signature = signature;

    const testUrl = 'https://testsecureacceptance.cybersource.com/pay';
    const prodUrl = 'https://secureacceptance.cybersource.com/pay';
    const checkoutUrl = process.env.CYBERSOURCE_ENV === 'production' ? prodUrl : testUrl;

    res.json({
      checkoutUrl,
      fields: params
    });
  } catch (error) {
    console.error('Error creating Cybersource session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Cybersource Secure Acceptance Webhook / Receipt Callback
// Note: Cybersource sends a POST request back to our server (webhook) after completion
router.post('/callback', async (req, res) => {
  try {
    const params = req.body;
    const signatureReceived = params.signature;

    if (!signatureReceived) {
      return res.status(400).send('Missing signature');
    }

    // Recalculate signature to verify authenticity
    const cybersourceSecretKey = process.env.CYBERSOURCE_SECRET_KEY;
    const calculatedSignature = calculateSignature(params, cybersourceSecretKey);

    if (calculatedSignature !== signatureReceived) {
      console.error('[Cybersource Callback] Signature verification failed');
      return res.status(400).send('Signature verification failed');
    }

    const decision = params.decision; // e.g. ACCEPT, DECLINE, ERROR
    const userId = params.req_reference_number; // user ID we put in reference_number
    const transactionId = params.transaction_id;

    console.log(`[Cybersource Callback] Payment callback received. Decision: ${decision}, UserID: ${userId}, TxID: ${transactionId}`);

    if (decision === 'ACCEPT') {
      const user = await User.findById(userId);
      if (user) {
        user.isPurchased = true;
        user.purchaseDate = new Date();
        await user.save();
        console.log(`[Cybersource] User ${user.email || user.telegramId} successfully purchased the course!`);
      } else {
        console.warn(`[Cybersource] User not found for ID: ${userId}`);
      }
    }

    // Redirect user back to the frontend purchase success page or close window
    // (Assuming frontend is at http://localhost:5173 or similar, we can redirect or return HTML)
    const frontendUrl = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : 'http://localhost:5173';
    
    if (decision === 'ACCEPT') {
      return res.send(`
        <html>
          <body style="background-color: #0b0f19; color: #ffffff; font-family: sans-serif; text-align: center; padding-top: 100px;">
            <h2>🎉 Оплата успешно проведена!</h2>
            <p>Вы успешно оплатили курс. Сейчас вы будете перенаправлены обратно...</p>
            <script>
              setTimeout(function() {
                window.location.href = "${frontendUrl}/profile?status=success";
              }, 3000);
            </script>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <body style="background-color: #0b0f19; color: #ffffff; font-family: sans-serif; text-align: center; padding-top: 100px;">
            <h2 style="color: #ef4444;">❌ Ошибка при оплате</h2>
            <p>Статус: ${decision}. Попробуйте еще раз или обратитесь в поддержку.</p>
            <script>
              setTimeout(function() {
                window.location.href = "${frontendUrl}/?status=failed";
              }, 3000);
            </script>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error processing Cybersource callback:', error);
    res.status(500).send('Internal server error');
  }
});

// 3. Mock Payment Bypass (For easy local testing/validation without real credit card credentials)
router.post('/simulate-success', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isPurchased = true;
    user.purchaseDate = new Date();
    await user.save();

    console.log(`[Mock Payment] User ${user.email || user.username} bypassed payment and unlocked the course.`);
    
    res.json({ 
      success: true, 
      message: 'Оплата успешно симулирована, курс разблокирован!', 
      user 
    });
  } catch (error) {
    console.error('Error simulating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
