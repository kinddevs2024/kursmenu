const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Helper to generate signature for Cybersource Secure Acceptance
function signPayload(params, secretKey) {
  const signedFieldNames = params.signed_field_names.split(',');
  const dataToSign = signedFieldNames.map(name => `${name}=${params[name]}`).join(',');
  return crypto.createHmac('sha256', secretKey).update(dataToSign).digest('hex');
}

router.post('/checkout', (req, res) => {
  const { amount, currency, profile_id, reference_number } = req.body;
  if (!amount || !currency || !profile_id || !reference_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = {
    access_key: process.env.CYBERSOURCE_ACCESS_KEY,
    profile_id: profile_id,
    transaction_uuid: crypto.randomUUID(),
    signed_field_names: 'access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,amount,currency,reference_number',
    unsigned_field_names: '',
    amount,
    currency,
    reference_number,
    signed_date_time: new Date().toISOString().replace(/\..+/, 'Z')
  };

  payload.signature = signPayload(payload, process.env.CYBERSOURCE_SECRET_KEY);
  res.json(payload);
});

module.exports = router;
