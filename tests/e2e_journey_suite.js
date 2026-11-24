import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { Conversation } from '../src/models/Conversation.js';
import { Lead } from '../src/models/Lead.js';
import { conversationService } from '../src/services/conversation.service.js';
import { FALLBACK_RESPONSE } from '../src/services/gemini.service.js';

const E2E_PHONE = '919876548001';
const E2E_NAME = 'Ananya Gupta';

async function runE2EJourneySuite() {
  console.log('====================================================');
  console.log('   STARTING PART 8 COMPLETE CUSTOMER JOURNEY TEST   ');
  console.log('====================================================\n');

  // 1. Connect to MongoDB
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB Atlas for E2E journey verification.');

  // 2. Clean previous test records
  await Conversation.deleteMany({ phoneNumber: E2E_PHONE });
  await Lead.deleteMany({ phoneNumber: E2E_PHONE });
  console.log('Cleaned up prior test records for phone:', E2E_PHONE, '\n');

  // 3. Start ephemeral test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Ephemeral test server running on ${baseUrl}\n`);

  const results = [];

  function record(name, pass, details) {
    results.push({ name, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    console.log(`       Details: ${JSON.stringify(details)}\n`);
  }

  try {
    // -----------------------------------------------------------
    // STEP 1-3: New customer sends a WhatsApp message via POST /webhook
    // -----------------------------------------------------------
    const step1Payload = {
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
                contacts: [
                  {
                    profile: { name: E2E_NAME },
                    wa_id: E2E_PHONE,
                  },
                ],
                messages: [
                  {
                    from: E2E_PHONE,
                    id: 'wamid.E2E_STEP1_001',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'text',
                    text: {
                      body: 'Hi, do you provide 75 GSM copier paper?',
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const webhookRes1 = await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(step1Payload),
    });
    const webhookBody1 = await webhookRes1.json();

    const convAfterStep1 = await Conversation.findOne({ phoneNumber: E2E_PHONE });

    const step1Pass =
      webhookRes1.status === 200 &&
      webhookBody1.success === true &&
      convAfterStep1 !== null &&
      convAfterStep1.customerName === E2E_NAME &&
      convAfterStep1.messages.length >= 1 &&
      convAfterStep1.messages[0].role === 'customer' &&
      convAfterStep1.messages[0].content === 'Hi, do you provide 75 GSM copier paper?';

    record(
      'Step 1-3: New customer WhatsApp webhook message saved with phone & name in MongoDB',
      step1Pass,
      {
        httpStatus: webhookRes1.status,
        dbCustomerName: convAfterStep1?.customerName,
        dbMessageCount: convAfterStep1?.messages?.length,
        savedMessageContent: convAfterStep1?.messages?.[0]?.content,
      }
    );

    // -----------------------------------------------------------
    // STEP 4-5: Gemini generates FAQ-grounded answer & saves in MongoDB
    // -----------------------------------------------------------
    const assistantMsgInDb = convAfterStep1.messages.find((m) => m.role === 'assistant');
    const step4Pass =
      webhookBody1.data?.assistantResponse !== undefined &&
      webhookBody1.data.assistantResponse.length > 0 &&
      webhookBody1.data.assistantResponse !== FALLBACK_RESPONSE &&
      webhookBody1.data.ai?.isFallback === false &&
      assistantMsgInDb !== undefined &&
      assistantMsgInDb.content === webhookBody1.data.assistantResponse;

    record(
      'Step 4-5: Gemini generates FAQ-grounded response and persists assistant reply',
      step4Pass,
      {
        responsePreview: webhookBody1.data?.assistantResponse?.substring(0, 70),
        wordCount: webhookBody1.data?.ai?.wordCount,
        isFallback: webhookBody1.data?.ai?.isFallback,
        totalDbMessages: convAfterStep1?.messages?.length,
      }
    );

    // -----------------------------------------------------------
    // STEP 6-7: Customer sends follow-up; previous context is used
    // -----------------------------------------------------------
    const step6Res = await conversationService.processCustomerMessageWithMemory({
      phoneNumber: E2E_PHONE,
      content: 'Is it suitable for high-speed double-sided printing?',
      customerName: E2E_NAME,
    });

    const step6Pass =
      step6Res.success === true &&
      step6Res.historyCountUsed >= 2 &&
      step6Res.assistantResponse.length > 0;

    record('Step 6-7: Follow-up question processed with multi-turn context', step6Pass, {
      historyUsed: step6Res.historyCountUsed,
      responsePreview: step6Res.assistantResponse.substring(0, 70),
      wordCount: step6Res.wordCount,
    });

    // -----------------------------------------------------------
    // STEP 8-9: Customer expresses buying interest; Lead is created
    // -----------------------------------------------------------
    const step8Res = await conversationService.processCustomerMessageWithMemory({
      phoneNumber: E2E_PHONE,
      content: 'I want to place an order for 200 reams of copier paper',
      customerName: E2E_NAME,
    });

    const leadInDb = await Lead.findOne({ phoneNumber: E2E_PHONE });

    const step8Pass =
      leadInDb !== null &&
      leadInDb.phoneNumber === E2E_PHONE &&
      leadInDb.productOfInterest === 'Copier Paper' &&
      leadInDb.name === E2E_NAME;

    record('Step 8-9: Buying interest detected; customer Lead record persisted', step8Pass, {
      leadFound: leadInDb !== null,
      leadName: leadInDb?.name,
      leadProduct: leadInDb?.productOfInterest,
      leadCreatedAt: leadInDb?.createdAt,
    });

    // -----------------------------------------------------------
    // STEP 10-12: Customer asks to speak with a human; exact fallback & handoff
    // -----------------------------------------------------------
    const step10Res = await conversationService.processCustomerMessageWithMemory({
      phoneNumber: E2E_PHONE,
      content: 'Can someone from sales call me to finalize bulk pricing?',
      customerName: E2E_NAME,
    });

    const convAfterHandoff = await Conversation.findOne({ phoneNumber: E2E_PHONE });

    const step10Pass =
      step10Res.needsHuman === true &&
      step10Res.assistantResponse === FALLBACK_RESPONSE &&
      convAfterHandoff.needsHuman === true &&
      convAfterHandoff.handoffStatus === 'pending' &&
      convAfterHandoff.handoffAt instanceof Date;

    record('Step 10-12: Explicit human request triggers exact fallback & pending handoff', step10Pass, {
      needsHuman: step10Res.needsHuman,
      assistantResponse: step10Res.assistantResponse,
      dbHandoffStatus: convAfterHandoff?.handoffStatus,
      dbHandoffReason: convAfterHandoff?.handoffReason,
      hasTimestamp: convAfterHandoff?.handoffAt instanceof Date,
    });

    // -----------------------------------------------------------
    // STEP 13: Handoff retrieved via GET /handoffs and resolved via PATCH
    // -----------------------------------------------------------
    const getHandoffsRes = await fetch(`${baseUrl}/handoffs?status=pending`);
    const getHandoffsBody = await getHandoffsRes.json();
    const handoffFound = getHandoffsBody.data?.some((h) => h.phoneNumber === E2E_PHONE);

    // Resolve handoff
    const resolveRes = await fetch(`${baseUrl}/handoffs/${E2E_PHONE}/resolve`, {
      method: 'PATCH',
    });
    const resolveBody = await resolveRes.json();

    const convAfterResolve = await Conversation.findOne({ phoneNumber: E2E_PHONE });

    const step13Pass =
      getHandoffsRes.status === 200 &&
      handoffFound === true &&
      resolveRes.status === 200 &&
      resolveBody.success === true &&
      resolveBody.data.needsHuman === false &&
      resolveBody.data.handoffStatus === 'resolved' &&
      convAfterResolve.needsHuman === false &&
      convAfterResolve.handoffStatus === 'resolved' &&
      convAfterResolve.handoffAt instanceof Date;

    record('Step 13: Handoff retrieved from GET /handoffs and resolved via PATCH', step13Pass, {
      retrievedInList: handoffFound,
      resolveHttpStatus: resolveRes.status,
      dbNeedsHuman: convAfterResolve?.needsHuman,
      dbHandoffStatus: convAfterResolve?.handoffStatus,
      auditTimestampPreserved: convAfterResolve?.handoffAt instanceof Date,
    });

    console.log('====================================================');
    const allPassed = results.every((r) => r.pass);
    console.log(
      `PART 8 E2E CUSTOMER JOURNEY: ${results.filter((r) => r.pass).length}/${results.length} STEPS PASSED`
    );
    console.log('====================================================');

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    // Clean up test data created during this journey audit
    await Conversation.deleteMany({ phoneNumber: E2E_PHONE });
    await Lead.deleteMany({ phoneNumber: E2E_PHONE });
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

runE2EJourneySuite().catch((err) => {
  console.error('E2E Journey test error:', err);
  process.exit(1);
});
