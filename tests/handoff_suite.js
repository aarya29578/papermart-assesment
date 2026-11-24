import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { Conversation } from '../src/models/Conversation.js';
import { handoffService } from '../src/services/handoff.service.js';
import { conversationService } from '../src/services/conversation.service.js';
import { FALLBACK_RESPONSE } from '../src/services/gemini.service.js';

const TEST_PHONES = [
  '919876547001',
  '919876547002',
  '919876547003',
  '919876547004',
  '919876547005',
  '919876547006',
  '919876547007',
  '919876547008',
  '919876547009',
  '919876547010',
];

/**
 * Creates a mock Gemini client returning predetermined text
 * @param {string} mockResult
 * @returns {Object}
 */
function createMockClient(mockResult) {
  return {
    models: {
      generateContent: async () => ({
        text: mockResult,
        candidates: [
          {
            content: {
              parts: [{ text: mockResult }],
            },
          },
        ],
      }),
    },
  };
}

async function runHandoffTestSuite() {
  console.log('====================================================');
  console.log('   STARTING PHASE 7 HUMAN HANDOFF TEST SUITE       ');
  console.log('====================================================\n');

  // 1. Connect to MongoDB Atlas
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB Atlas for Phase 7 verification.');

  // 2. Clean previous test records
  await Conversation.deleteMany({ phoneNumber: { $in: TEST_PHONES } });
  console.log('Cleaned up previous test records.\n');

  // 3. Start ephemeral test HTTP server
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
    // TEST 1: Explicit human request triggers handoff & exact fallback
    // -----------------------------------------------------------
    {
      const phone = '919876547001';
      const userMessage = 'I want to talk to a human.';

      const res = await conversationService.processCustomerMessageWithMemory({
        phoneNumber: phone,
        content: userMessage,
        customerName: 'Rahul',
      });

      const convInDb = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        res.success === true &&
        res.needsHuman === true &&
        res.assistantResponse === FALLBACK_RESPONSE &&
        res.reason === 'explicit_human_request' &&
        convInDb !== null &&
        convInDb.needsHuman === true &&
        convInDb.handoffStatus === 'pending' &&
        convInDb.handoffReason === 'Customer explicitly requested human assistance' &&
        convInDb.handoffAt instanceof Date;

      record('Test 1: Explicit human request triggers handoff and exact fallback', pass, {
        needsHuman: res.needsHuman,
        assistantResponse: res.assistantResponse,
        handoffStatus: convInDb?.handoffStatus,
        handoffReason: convInDb?.handoffReason,
        hasTimestamp: convInDb?.handoffAt instanceof Date,
      });
    }

    // -----------------------------------------------------------
    // TEST 2: Sales representative request triggers handoff
    // -----------------------------------------------------------
    {
      const phone = '919876547002';
      const userMessage = 'Connect me with your sales team.';

      const res = await conversationService.processCustomerMessageWithMemory({
        phoneNumber: phone,
        content: userMessage,
      });

      const convInDb = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        res.success === true &&
        res.needsHuman === true &&
        res.assistantResponse === FALLBACK_RESPONSE &&
        convInDb !== null &&
        convInDb.needsHuman === true &&
        convInDb.handoffStatus === 'pending' &&
        convInDb.handoffAt instanceof Date;

      record('Test 2: Sales representative request triggers handoff', pass, {
        needsHuman: res.needsHuman,
        handoffStatus: convInDb?.handoffStatus,
        handoffAt: convInDb?.handoffAt,
      });
    }

    // -----------------------------------------------------------
    // TEST 3: Gemini exact fallback triggers handoff
    // -----------------------------------------------------------
    {
      const phone = '919876547003';
      const userMessage = 'Do you sell laptops or computers?';
      const mockClient = createMockClient(FALLBACK_RESPONSE);

      const res = await conversationService.processCustomerMessageWithMemory({
        phoneNumber: phone,
        content: userMessage,
        geminiOptions: {
          client: mockClient,
          apiKey: 'mock_key',
        },
      });

      const convInDb = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        res.success === true &&
        res.needsHuman === true &&
        res.isFallback === true &&
        res.assistantResponse === FALLBACK_RESPONSE &&
        convInDb !== null &&
        convInDb.needsHuman === true &&
        convInDb.handoffStatus === 'pending' &&
        convInDb.handoffReason === 'AI fallback: FAQ cannot answer inquiry' &&
        convInDb.handoffAt instanceof Date;

      record('Test 3: Gemini exact fallback triggers human handoff', pass, {
        needsHuman: res.needsHuman,
        isFallback: res.isFallback,
        handoffReason: convInDb?.handoffReason,
        handoffStatus: convInDb?.handoffStatus,
      });
    }

    // -----------------------------------------------------------
    // TEST 4: Normal grounded FAQ answer does NOT trigger handoff
    // -----------------------------------------------------------
    {
      const phone = '919876547004';
      const userMessage = 'What is your return policy?';
      const mockAnswer =
        'We accept returns for defective, damaged, or incorrectly supplied stock within 7 days of delivery.';
      const mockClient = createMockClient(mockAnswer);

      const res = await conversationService.processCustomerMessageWithMemory({
        phoneNumber: phone,
        content: userMessage,
        geminiOptions: {
          client: mockClient,
          apiKey: 'mock_key',
        },
      });

      const convInDb = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        res.success === true &&
        res.needsHuman === false &&
        res.isFallback === false &&
        res.assistantResponse === mockAnswer &&
        convInDb !== null &&
        convInDb.needsHuman === false &&
        convInDb.handoffStatus === null;

      record('Test 4: Normal FAQ answer does NOT trigger handoff', pass, {
        needsHuman: res.needsHuman,
        isFallback: res.isFallback,
        assistantResponse: res.assistantResponse,
        dbNeedsHuman: convInDb?.needsHuman,
        dbHandoffStatus: convInDb?.handoffStatus,
      });
    }

    // -----------------------------------------------------------
    // TEST 5: Duplicate pending handoff prevention
    // -----------------------------------------------------------
    {
      const phone = '919876547005';
      const firstTimestamp = new Date(Date.now() - 60000); // 1 minute ago

      // Initial handoff
      await handoffService.triggerHandoff(
        phone,
        'Customer explicitly requested human assistance',
        { timestamp: firstTimestamp }
      );

      const beforeDuplicate = await Conversation.findOne({ phoneNumber: phone });
      const initialHandoffAt = beforeDuplicate.handoffAt;

      // Second trigger attempt while still pending
      const secondTrigger = await handoffService.triggerHandoff(
        phone,
        'Second request for human assistance',
        { timestamp: new Date() }
      );

      const afterDuplicate = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        secondTrigger.triggered === false &&
        secondTrigger.alreadyPending === true &&
        afterDuplicate.needsHuman === true &&
        afterDuplicate.handoffStatus === 'pending' &&
        afterDuplicate.handoffReason === 'Customer explicitly requested human assistance' &&
        new Date(afterDuplicate.handoffAt).getTime() === new Date(initialHandoffAt).getTime();

      record('Test 5: Duplicate pending handoff prevention preserves original timestamp', pass, {
        secondTriggered: secondTrigger.triggered,
        alreadyPending: secondTrigger.alreadyPending,
        timestampPreserved:
          new Date(afterDuplicate.handoffAt).getTime() === new Date(initialHandoffAt).getTime(),
        handoffReason: afterDuplicate.handoffReason,
      });
    }

    // -----------------------------------------------------------
    // TEST 6: Resolved conversation can be handed off again
    // -----------------------------------------------------------
    {
      const phone = '919876547006';

      // 1. Initial pending handoff
      await handoffService.triggerHandoff(phone, 'First handoff');
      // 2. Resolve handoff
      await handoffService.resolveHandoff(phone);

      const resolvedConv = await Conversation.findOne({ phoneNumber: phone });

      // 3. New request after resolution
      const newTrigger = await handoffService.triggerHandoff(
        phone,
        'Second handoff after resolution'
      );
      const retriggeredConv = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        resolvedConv.needsHuman === false &&
        resolvedConv.handoffStatus === 'resolved' &&
        newTrigger.triggered === true &&
        newTrigger.alreadyPending === false &&
        retriggeredConv.needsHuman === true &&
        retriggeredConv.handoffStatus === 'pending' &&
        retriggeredConv.handoffReason === 'Second handoff after resolution';

      record('Test 6: Resolved conversation can be handed off again', pass, {
        wasResolved: resolvedConv?.handoffStatus === 'resolved',
        retriggered: newTrigger.triggered,
        currentStatus: retriggeredConv?.handoffStatus,
        newReason: retriggeredConv?.handoffReason,
      });
    }

    // -----------------------------------------------------------
    // TEST 7: GET /handoffs returns pending handoffs newest-first
    // -----------------------------------------------------------
    {
      const phoneOlder = '919876547008';
      const phoneNewer = '919876547009';

      const olderTime = new Date(Date.now() - 3600000); // 1 hour ago
      const newerTime = new Date();

      await handoffService.triggerHandoff(phoneOlder, 'Older handoff', {
        timestamp: olderTime,
        customerName: 'Older Customer',
      });
      await handoffService.triggerHandoff(phoneNewer, 'Newer handoff', {
        timestamp: newerTime,
        customerName: 'Newer Customer',
      });

      const response = await fetch(`${baseUrl}/handoffs`);
      const body = await response.json();

      let ordered = false;
      if (Array.isArray(body.data)) {
        const idxNewer = body.data.findIndex((h) => h.phoneNumber === phoneNewer);
        const idxOlder = body.data.findIndex((h) => h.phoneNumber === phoneOlder);
        ordered = idxNewer !== -1 && idxOlder !== -1 && idxNewer < idxOlder;
      }

      const item = body.data?.find((h) => h.phoneNumber === phoneNewer);
      const hasRequiredFields =
        item &&
        item.phoneNumber &&
        item.handoffReason &&
        item.handoffAt &&
        item.handoffStatus === 'pending';

      const pass =
        response.status === 200 &&
        body.success === true &&
        Array.isArray(body.data) &&
        ordered === true &&
        hasRequiredFields;

      record('Test 7: GET /handoffs returns pending handoffs newest-first with required fields', pass, {
        status: response.status,
        count: body.count,
        ordered,
        hasRequiredFields,
        firstItemPhone: body.data?.[0]?.phoneNumber,
      });
    }

    // -----------------------------------------------------------
    // TEST 8: GET /handoffs query parameter validation (status, limit)
    // -----------------------------------------------------------
    {
      // 1. Invalid status
      const resInvalidStatus = await fetch(`${baseUrl}/handoffs?status=unknown`);
      const bodyInvalidStatus = await resInvalidStatus.json();

      // 2. Invalid limit (< 1)
      const resLimitLow = await fetch(`${baseUrl}/handoffs?limit=0`);
      const bodyLimitLow = await resLimitLow.json();

      // 3. Invalid limit (> 100)
      const resLimitHigh = await fetch(`${baseUrl}/handoffs?limit=150`);
      const bodyLimitHigh = await resLimitHigh.json();

      // 4. Valid status=pending
      const resPending = await fetch(`${baseUrl}/handoffs?status=pending&limit=10`);
      const bodyPending = await resPending.json();

      // 5. Valid status=resolved
      const resResolved = await fetch(`${baseUrl}/handoffs?status=resolved&limit=10`);
      const bodyResolved = await resResolved.json();

      const pass =
        resInvalidStatus.status === 400 &&
        bodyInvalidStatus.success === false &&
        resLimitLow.status === 400 &&
        bodyLimitLow.success === false &&
        resLimitHigh.status === 400 &&
        bodyLimitHigh.success === false &&
        resPending.status === 200 &&
        bodyPending.success === true &&
        resResolved.status === 200 &&
        bodyResolved.success === true;

      record('Test 8: GET /handoffs validates status and limit query parameters', pass, {
        invalidStatusHttp: resInvalidStatus.status,
        limitLowHttp: resLimitLow.status,
        limitHighHttp: resLimitHigh.status,
        validPendingHttp: resPending.status,
        validResolvedHttp: resResolved.status,
      });
    }

    // -----------------------------------------------------------
    // TEST 9: PATCH /handoffs/:phoneNumber/resolve marks handoff resolved
    // -----------------------------------------------------------
    {
      const phone = '919876547007';
      await handoffService.triggerHandoff(phone, 'Customer needs human help', {
        customerName: 'Anand',
      });

      const response = await fetch(`${baseUrl}/handoffs/${phone}/resolve`, {
        method: 'PATCH',
      });
      const body = await response.json();

      const convInDb = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        response.status === 200 &&
        body.success === true &&
        body.data.needsHuman === false &&
        body.data.handoffStatus === 'resolved' &&
        body.data.handoffReason === 'Customer needs human help' &&
        convInDb.needsHuman === false &&
        convInDb.handoffStatus === 'resolved' &&
        convInDb.handoffReason === 'Customer needs human help' &&
        convInDb.handoffAt instanceof Date;

      record('Test 9: PATCH /handoffs/:phoneNumber/resolve resolves handoff and preserves audit history', pass, {
        httpStatus: response.status,
        needsHuman: body.data?.needsHuman,
        handoffStatus: body.data?.handoffStatus,
        reasonPreserved: convInDb?.handoffReason === 'Customer needs human help',
        timestampPreserved: convInDb?.handoffAt instanceof Date,
      });
    }

    // -----------------------------------------------------------
    // TEST 10: Resolve nonexistent or non-pending conversation returns 404
    // -----------------------------------------------------------
    {
      // Nonexistent conversation
      const resNonexistent = await fetch(`${baseUrl}/handoffs/999999999999/resolve`, {
        method: 'PATCH',
      });
      const bodyNonexistent = await resNonexistent.json();

      // Already resolved conversation
      const phoneResolved = '919876547007';
      const resAlreadyResolved = await fetch(`${baseUrl}/handoffs/${phoneResolved}/resolve`, {
        method: 'PATCH',
      });
      const bodyAlreadyResolved = await resAlreadyResolved.json();

      const pass =
        resNonexistent.status === 404 &&
        bodyNonexistent.success === false &&
        resAlreadyResolved.status === 404 &&
        bodyAlreadyResolved.success === false;

      record('Test 10: Resolve nonexistent or already-resolved conversation returns HTTP 404', pass, {
        nonexistentStatus: resNonexistent.status,
        alreadyResolvedStatus: resAlreadyResolved.status,
      });
    }

    // -----------------------------------------------------------
    // TEST 11: Negative intent filtering ("human resources" & non-escalation phrases)
    // -----------------------------------------------------------
    {
      const unrelated1 = handoffService.detectHumanRequest(
        'Does your human resources department handle invoices?'
      );
      const unrelated2 = handoffService.detectHumanRequest(
        'We manufacture papers for human resources documentation.'
      );
      const unrelated3 = handoffService.detectHumanRequest('Call me Rahul');
      const unrelated4 = handoffService.detectHumanRequest('What is the GSM of art paper?');

      const positive1 = handoffService.detectHumanRequest('Can someone call me?');
      const positive2 = handoffService.detectHumanRequest('I need a real person.');
      const positive3 = handoffService.detectHumanRequest('Please transfer me to an agent.');
      const positive4 = handoffService.detectHumanRequest(
        'Connect me with someone in human resources'
      );

      const pass =
        unrelated1 === false &&
        unrelated2 === false &&
        unrelated3 === false &&
        unrelated4 === false &&
        positive1 === true &&
        positive2 === true &&
        positive3 === true &&
        positive4 === true;

      record('Test 11: Negative intent filtering rejects unrelated phrases while accepting escalation', pass, {
        unrelatedHRFiltered: unrelated1 === false && unrelated2 === false,
        nameIntroductionFiltered: unrelated3 === false,
        productInquiryFiltered: unrelated4 === false,
        explicitEscalationsMatched: positive1 && positive2 && positive3 && positive4,
      });
    }

    console.log('====================================================');
    const allPassed = results.every((r) => r.pass);
    console.log(
      `PHASE 7 TEST SUITE FINISHED: ${results.filter((r) => r.pass).length}/${results.length} PASSED`
    );
    console.log('====================================================');

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    // Graceful teardown
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

runHandoffTestSuite().catch((err) => {
  console.error('Phase 7 test suite error:', err);
  process.exit(1);
});
