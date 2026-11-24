import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { Lead } from '../src/models/Lead.js';
import { Conversation } from '../src/models/Conversation.js';
import { leadService } from '../src/services/lead.service.js';
import { conversationService } from '../src/services/conversation.service.js';

const BASE_URL = 'http://localhost:5000';

const TEST_PHONES = [
  '919876546001',
  '919876546002',
  '919876546003',
  '919876546004',
  '919876546005',
  '919876546006',
  '919876546007',
  '919876546008',
  '919876546009',
  '919876546010',
];

async function runLeadTestSuite() {
  console.log('====================================================');
  console.log('      STARTING PHASE 6 CUSTOMER LEAD TEST SUITE     ');
  console.log('====================================================\n');

  // Connect to MongoDB
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB for lead verification.');

  // Clean test numbers before running
  await Lead.deleteMany({ phoneNumber: { $in: TEST_PHONES } });
  await Conversation.deleteMany({ phoneNumber: { $in: TEST_PHONES } });
  console.log('Cleaned up previous test lead records.\n');

  // Verify if server is listening on port 5000; if not, launch test server
  let localServer = null;
  try {
    const health = await fetch(`${BASE_URL}/health`);
    if (health.status !== 200) throw new Error('Not running');
  } catch {
    console.log('Local server not listening on port 5000. Launching internal test server on port 5000...');
    localServer = app.listen(5000);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const results = [];

  function record(name, pass, details) {
    results.push({ name, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    console.log(`       Details: ${JSON.stringify(details)}\n`);
  }

  try {
    // -----------------------------------------------------------
    // TEST 1: Buying-intent lead creation
    // -----------------------------------------------------------
    {
      const phone = '919876546001';
      const text = 'I want to order copier paper for my office.';

      const res = await leadService.processLead(phone, { text });
      const leadInDb = await Lead.findOne({ phoneNumber: phone });

      const pass =
        res.isNew === true &&
        res.isUpdated === false &&
        leadInDb !== null &&
        leadInDb.productOfInterest === 'Copier Paper' &&
        leadInDb.name === null;

      record('Test 1: Buying-intent lead creation', pass, {
        isNew: res.isNew,
        productOfInterest: leadInDb?.productOfInterest,
        name: leadInDb?.name,
      });
    }

    // -----------------------------------------------------------
    // TEST 2: Customer name extraction
    // -----------------------------------------------------------
    {
      const phone = '919876546002';
      const text = 'Hello, my name is Rahul Verma.';

      const res = await leadService.processLead(phone, { text });
      const leadInDb = await Lead.findOne({ phoneNumber: phone });

      const pass =
        res.isNew === true &&
        leadInDb !== null &&
        leadInDb.name === 'Rahul Verma' &&
        leadInDb.productOfInterest === null;

      record('Test 2: Explicit customer name extraction', pass, {
        isNew: res.isNew,
        extractedName: leadInDb?.name,
      });
    }

    // -----------------------------------------------------------
    // TEST 3: Name supplied after product interest updates existing lead
    // -----------------------------------------------------------
    {
      const phone = '919876546003';
      // Step 1: Customer expresses product interest first
      const res1 = await leadService.processLead(phone, {
        text: 'Please share a quotation for 100 reams.',
      });

      // Step 2: Customer provides their name in a subsequent message
      const res2 = await leadService.processLead(phone, {
        text: 'This is Vikram Malhotra.',
      });

      const allLeads = await Lead.find({ phoneNumber: phone });
      const updatedLead = allLeads[0];

      const pass =
        res1.isNew === true &&
        res2.isNew === false &&
        res2.isUpdated === true &&
        allLeads.length === 1 && // Exactly 1 lead (no duplicate created)
        updatedLead.name === 'Vikram Malhotra' &&
        updatedLead.productOfInterest === 'Copier Paper';

      record('Test 3: Name supplied after product interest updates existing lead', pass, {
        totalLeadsInDb: allLeads.length,
        leadName: updatedLead?.name,
        leadProduct: updatedLead?.productOfInterest,
        isUpdated: res2.isUpdated,
      });
    }

    // -----------------------------------------------------------
    // TEST 4: Product interest supplied after name updates existing lead
    // -----------------------------------------------------------
    {
      const phone = '919876546004';
      // Step 1: Customer introduces themselves first
      const res1 = await leadService.processLead(phone, {
        text: 'Hi, I am Sneha Patel.',
      });

      // Step 2: Customer expresses product interest in next message
      const res2 = await leadService.processLead(phone, {
        text: 'I need 500 sheets of art paper.',
      });

      const allLeads = await Lead.find({ phoneNumber: phone });
      const updatedLead = allLeads[0];

      const pass =
        res1.isNew === true &&
        res2.isNew === false &&
        res2.isUpdated === true &&
        allLeads.length === 1 && // Exactly 1 lead (no duplicate created)
        updatedLead.name === 'Sneha Patel' &&
        updatedLead.productOfInterest === 'Art Paper / Art Board';

      record('Test 4: Product interest supplied after name updates existing lead', pass, {
        totalLeadsInDb: allLeads.length,
        leadName: updatedLead?.name,
        leadProduct: updatedLead?.productOfInterest,
        isUpdated: res2.isUpdated,
      });
    }

    // -----------------------------------------------------------
    // TEST 5: Subsequent product interest updates existing lead rather than creating duplicates
    // -----------------------------------------------------------
    {
      const phone = '919876546004';
      // Step 3: Customer changes/updates product of interest
      const res3 = await leadService.processLead(phone, {
        text: 'Actually, please also send quotation for kraft paper.',
      });

      const allLeads = await Lead.find({ phoneNumber: phone });
      const updatedLead = allLeads[0];

      const pass =
        res3.isNew === false &&
        res3.isUpdated === true &&
        allLeads.length === 1 &&
        updatedLead.productOfInterest === 'Kraft Paper' &&
        updatedLead.name === 'Sneha Patel';

      record('Test 5: Product change updates existing lead without duplicating', pass, {
        totalLeadsInDb: allLeads.length,
        updatedProduct: updatedLead?.productOfInterest,
        preservedName: updatedLead?.name,
      });
    }

    // -----------------------------------------------------------
    // TEST 6: No lead created for greetings or unrelated general questions
    // -----------------------------------------------------------
    {
      const phoneGreeting = '919876546005';
      const phoneHours = '919876546006';
      const phoneLocation = '919876546007';

      const resGreeting = await leadService.processLead(phoneGreeting, { text: 'Hello, good morning!' });
      const resHours = await leadService.processLead(phoneHours, { text: 'What time do you close on Saturday?' });
      const resLocation = await leadService.processLead(phoneLocation, { text: 'Where is your office located?' });

      const countGreeting = await Lead.countDocuments({ phoneNumber: phoneGreeting });
      const countHours = await Lead.countDocuments({ phoneNumber: phoneHours });
      const countLocation = await Lead.countDocuments({ phoneNumber: phoneLocation });

      const pass =
        resGreeting.lead === null &&
        resHours.lead === null &&
        resLocation.lead === null &&
        countGreeting === 0 &&
        countHours === 0 &&
        countLocation === 0;

      record('Test 6: No leads created for greetings or general informational questions', pass, {
        countGreeting,
        countHours,
        countLocation,
      });
    }

    // -----------------------------------------------------------
    // TEST 7: Multiple customers remain isolated by phone number
    // -----------------------------------------------------------
    {
      const phoneA = '919876546008';
      const phoneB = '919876546009';

      await leadService.processLead(phoneA, { text: 'My name is Rohan. Need 20 reams of copier paper.' });
      await leadService.processLead(phoneB, { text: 'This is Kavita. Please quote for duplex board.' });

      const leadA = await Lead.findOne({ phoneNumber: phoneA });
      const leadB = await Lead.findOne({ phoneNumber: phoneB });

      const pass =
        leadA !== null &&
        leadB !== null &&
        leadA.name === 'Rohan' &&
        leadA.productOfInterest === 'Copier Paper' &&
        leadB.name === 'Kavita' &&
        leadB.productOfInterest === 'Duplex Board';

      record('Test 7: Multiple customer leads remain isolated by phone number', pass, {
        leadAName: leadA?.name,
        leadAProduct: leadA?.productOfInterest,
        leadBName: leadB?.name,
        leadBProduct: leadB?.productOfInterest,
      });
    }

    // -----------------------------------------------------------
    // TEST 8: Lead capture failure does not break conversation processing
    // -----------------------------------------------------------
    {
      const phone = '919876546010';
      // Mock leadService.processLead throwing an error
      const originalProcess = leadService.processLead;
      leadService.processLead = async () => {
        throw new Error('Simulated database write timeout on Lead collection');
      };

      let conversationResult = null;
      let errorThrown = false;

      try {
        conversationResult = await conversationService.processCustomerMessageWithMemory({
          phoneNumber: phone,
          content: 'I want to order copier paper.',
          geminiOptions: {
            apiKey: 'mock_key',
            client: {
              models: {
                generateContent: async () => ({ text: 'Our copier paper is available in 70, 75, and 80 GSM.' }),
              },
            },
          },
        });
      } catch (err) {
        errorThrown = true;
      } finally {
        leadService.processLead = originalProcess;
      }

      const conv = await Conversation.findOne({ phoneNumber: phone });

      const pass =
        errorThrown === false &&
        conversationResult !== null &&
        conversationResult.success === true &&
        conversationResult.assistantResponse.includes('copier paper') &&
        conv !== null &&
        conv.messages.length >= 1;

      record('Test 8: Lead capture failure does not break conversation processing', pass, {
        conversationSucceeded: conversationResult?.success,
        errorThrown,
        dbSavedAssistant: conv?.messages?.[0]?.content,
      });
    }

    // -----------------------------------------------------------
    // TEST 9: GET /leads returns captured leads in newest-first order
    // -----------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/leads`);
      const json = await res.json();

      let isNewestFirst = true;
      if (Array.isArray(json.data) && json.data.length > 1) {
        for (let i = 0; i < json.data.length - 1; i++) {
          const date1 = new Date(json.data[i].createdAt).getTime();
          const date2 = new Date(json.data[i + 1].createdAt).getTime();
          if (date1 < date2) {
            isNewestFirst = false;
            break;
          }
        }
      }

      // Input validation test: invalid limit
      const resInvalidLimit = await fetch(`${BASE_URL}/leads?limit=-5`);
      const jsonInvalidLimit = await resInvalidLimit.json();

      const pass =
        res.status === 200 &&
        json.success === true &&
        Array.isArray(json.data) &&
        json.data.length > 0 &&
        isNewestFirst === true &&
        json._notice !== undefined &&
        resInvalidLimit.status === 400 &&
        jsonInvalidLimit.success === false;

      record('Test 9: GET /leads returns newest-first and validates query parameters', pass, {
        status: res.status,
        leadsReturned: json.data?.length,
        isNewestFirst,
        hasDemoNotice: json._notice !== undefined,
        invalidLimitStatus: resInvalidLimit.status,
      });
    }

    console.log('====================================================');
    const allPassed = results.every((r) => r.pass);
    console.log(`PHASE 6 TEST SUITE FINISHED: ${results.filter((r) => r.pass).length}/${results.length} PASSED`);
    console.log('====================================================');

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    if (localServer) {
      await new Promise((resolve) => localServer.close(resolve));
    }
    await mongoose.disconnect();
  }
}

runLeadTestSuite().catch((err) => {
  console.error('Phase 6 test suite error:', err);
  process.exit(1);
});
