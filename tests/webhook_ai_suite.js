import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { Conversation } from '../src/models/Conversation.js';
import { Lead } from '../src/models/Lead.js';
import { FALLBACK_RESPONSE } from '../src/services/gemini.service.js';

const TEST_PHONES = ['919876549001', '919876549002', '919876549003', '919876549004'];

function createMetaPayload({ phone, name, messageId, text, timestamp }) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'BUSINESS_ACCOUNT_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550000000',
                phone_number_id: 'PHONE_NUMBER_ID',
              },
              contacts: name ? [{ profile: { name }, wa_id: phone }] : [],
              messages: [
                {
                  from: phone,
                  id: messageId,
                  timestamp: timestamp || Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };
}

async function runWebhookAiTestSuite() {
  console.log('====================================================');
  console.log(' STARTING WEBHOOK + AI INTEGRATION TEST SUITE       ');
  console.log('====================================================\n');

  // 1. Connect to MongoDB Atlas
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB Atlas for Webhook AI verification.');

  // 2. Clean up test records
  await Conversation.deleteMany({ phoneNumber: { $in: TEST_PHONES } });
  await Lead.deleteMany({ phoneNumber: { $in: TEST_PHONES } });
  console.log('Cleaned up previous test records.\n');

  // 3. Start ephemeral test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Ephemeral test server listening on ${baseUrl}\n`);

  const results = [];

  function record(name, pass, details) {
    results.push({ name, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    console.log(`       Details: ${JSON.stringify(details)}\n`);
  }

  try {
    // -----------------------------------------------------------
    // TEST 1: POST /webhook triggers Gemini, generates & saves assistant response
    // -----------------------------------------------------------
    {
      const phone = '919876549001';
      const payload = createMetaPayload({
        phone,
        name: 'Suresh Kumar',
        messageId: 'wamid.WAI_001',
        text: 'Do you supply copier paper?',
      });

      const res = await fetch(`${baseUrl}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      const conv = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        res.status === 200 &&
        body.success === true &&
        body.data !== undefined &&
        body.data.assistantResponse !== undefined &&
        body.data.assistantResponse.length > 0 &&
        body.data.ai?.isFallback === false &&
        conv !== null &&
        conv.messages.length === 2 &&
        conv.messages[0].role === 'customer' &&
        conv.messages[0].content === 'Do you supply copier paper?' &&
        conv.messages[1].role === 'assistant' &&
        conv.messages[1].content === body.data.assistantResponse;

      record('Test 1: Inbound webhook triggers FAQ retrieval, Gemini API, and saves assistant reply', pass, {
        httpStatus: res.status,
        dbTotalMessages: conv?.messages?.length,
        customerMsg: conv?.messages?.[0]?.content,
        assistantReplyPreview: body.data?.assistantResponse?.substring(0, 60),
        persistedInDb: conv?.messages?.[1]?.content === body.data?.assistantResponse,
      });
    }

    // -----------------------------------------------------------
    // TEST 2: Follow-up message retrieves conversation memory and appends reply
    // -----------------------------------------------------------
    {
      const phone = '919876549001';
      const payload = createMetaPayload({
        phone,
        name: 'Suresh Kumar',
        messageId: 'wamid.WAI_002',
        text: 'Is it available in A3 size?',
      });

      const res = await fetch(`${baseUrl}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      const conv = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        res.status === 200 &&
        body.success === true &&
        conv !== null &&
        conv.messages.length === 4 &&
        conv.messages[2].role === 'customer' &&
        conv.messages[2].content === 'Is it available in A3 size?' &&
        conv.messages[3].role === 'assistant' &&
        conv.messages[3].content === body.data?.assistantResponse &&
        body.data?.ai?.historyCountUsed >= 2;

      record('Test 2: Follow-up webhook message retrieves prior memory and appends new turn', pass, {
        httpStatus: res.status,
        historyTurnsUsed: body.data?.ai?.historyCountUsed,
        totalDbMessages: conv?.messages?.length,
        latestAssistantPreview: body.data?.assistantResponse?.substring(0, 60),
      });
    }

    // -----------------------------------------------------------
    // TEST 3: Inbound webhook with buying intent captures Lead
    // -----------------------------------------------------------
    {
      const phone = '919876549001';
      const payload = createMetaPayload({
        phone,
        name: 'Suresh Kumar',
        messageId: 'wamid.WAI_003',
        text: 'I want to place an order for 150 reams of copier paper',
      });

      const res = await fetch(`${baseUrl}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      const lead = await Lead.findOne({ phoneNumber: phone });

      const pass =
        res.status === 200 &&
        body.success === true &&
        lead !== null &&
        lead.productOfInterest === 'Copier Paper' &&
        lead.name === 'Suresh Kumar';

      record('Test 3: Webhook detects commercial buying intent and captures customer Lead', pass, {
        httpStatus: res.status,
        leadFound: lead !== null,
        leadName: lead?.name,
        leadProduct: lead?.productOfInterest,
      });
    }

    // -----------------------------------------------------------
    // TEST 4: Inbound webhook with explicit human request triggers handoff
    // -----------------------------------------------------------
    {
      const phone = '919876549004';
      const payload = createMetaPayload({
        phone,
        name: 'Rohan Sharma',
        messageId: 'wamid.WAI_004',
        text: 'Please connect me with your sales team',
      });

      const res = await fetch(`${baseUrl}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      const conv = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        res.status === 200 &&
        body.data?.assistantResponse === FALLBACK_RESPONSE &&
        conv.needsHuman === true &&
        conv.handoffStatus === 'pending' &&
        conv.handoffReason === 'Customer explicitly requested human assistance' &&
        conv.messages[conv.messages.length - 1].content === FALLBACK_RESPONSE;

      record('Test 4: Inbound webhook explicit human request triggers handoff & exact fallback', pass, {
        httpStatus: res.status,
        assistantResponse: body.data?.assistantResponse,
        needsHuman: conv?.needsHuman,
        handoffStatus: conv?.handoffStatus,
        handoffReason: conv?.handoffReason,
      });
    }

    // -----------------------------------------------------------
    // TEST 5: Inbound webhook with unanswerable question triggers AI fallback handoff
    // -----------------------------------------------------------
    {
      const phone = '919876549002';
      const payload = createMetaPayload({
        phone,
        messageId: 'wamid.WAI_005',
        text: 'Do you sell gaming laptops or graphics cards?',
      });

      const res = await fetch(`${baseUrl}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      const conv = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        res.status === 200 &&
        body.data?.assistantResponse === FALLBACK_RESPONSE &&
        body.data?.ai?.isFallback === true &&
        conv.needsHuman === true &&
        conv.handoffStatus === 'pending' &&
        conv.handoffReason === 'AI fallback: FAQ cannot answer inquiry' &&
        conv.messages.length === 2 &&
        conv.messages[1].content === FALLBACK_RESPONSE;

      record('Test 5: Unanswerable inquiry triggers exact fallback and AI fallback handoff', pass, {
        httpStatus: res.status,
        assistantResponse: body.data?.assistantResponse,
        isFallback: body.data?.ai?.isFallback,
        handoffStatus: conv?.handoffStatus,
        handoffReason: conv?.handoffReason,
      });
    }

    // -----------------------------------------------------------
    // TEST 6: POST /webhook/simulate developer testing endpoint
    // -----------------------------------------------------------
    {
      const phone = '919876549003';
      const simRes = await fetch(`${baseUrl}/webhook/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          customerName: 'Meera Patel',
          content: 'What are your working hours?',
        }),
      });
      const simBody = await simRes.json();

      const conv = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        simRes.status === 200 &&
        simBody.success === true &&
        simBody.data?.assistantResponse !== undefined &&
        simBody.data?.assistantResponse.length > 0 &&
        conv !== null &&
        conv.messages.length === 2 &&
        conv.customerName === 'Meera Patel';

      record('Test 6: Developer simulation endpoint POST /webhook/simulate returns AI diagnostics', pass, {
        httpStatus: simRes.status,
        responsePreview: simBody.data?.assistantResponse?.substring(0, 60),
        dbMessagesCount: conv?.messages?.length,
        customerName: conv?.customerName,
      });
    }

    console.log('====================================================');
    const allPassed = results.every((r) => r.pass);
    console.log(
      `WEBHOOK + AI TEST SUITE FINISHED: ${results.filter((r) => r.pass).length}/${results.length} PASSED`
    );
    console.log('====================================================');

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    await Conversation.deleteMany({ phoneNumber: { $in: TEST_PHONES } });
    await Lead.deleteMany({ phoneNumber: { $in: TEST_PHONES } });
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

runWebhookAiTestSuite().catch((err) => {
  console.error('Webhook AI test suite error:', err);
  process.exit(1);
});
