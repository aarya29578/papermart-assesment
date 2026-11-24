import mongoose from 'mongoose';
import express from 'express';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { Conversation } from '../src/models/Conversation.js';
import { verifyWebhook } from '../src/controllers/webhook.controller.js';

const BASE_URL = 'http://localhost:5000';

const TEST_PHONES = [
  '919876543001',
  '919876543002',
  '919876543003',
  '919876543004',
  '919876543013',
  '919876543014',
  '919876543015',
  '919876543016',
  '919876543017',
  '919876543018',
  '919876543019',
  '919876543020',
];

/**
 * Helper to build valid WhatsApp webhook payload
 */
function createPayload({
  phone,
  name,
  messageId,
  type = 'text',
  text,
  timestamp = '1795430000',
  statuses,
}) {
  const value = {
    messaging_product: 'whatsapp',
    metadata: {
      display_phone_number: '15550000000',
      phone_number_id: 'PHONE_NUMBER_ID',
    },
  };

  if (name && phone) {
    value.contacts = [
      {
        profile: { name },
        wa_id: phone,
      },
    ];
  }

  if (statuses) {
    value.statuses = statuses;
  }

  if (type) {
    const msg = {
      from: phone,
      id: messageId,
      timestamp,
      type,
    };

    if (type === 'text' && text !== undefined) {
      msg.text = { body: text };
    } else if (type === 'image') {
      msg.image = { id: 'media_test_123', mime_type: 'image/jpeg' };
    }

    value.messages = [msg];
  }

  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'BUSINESS_ACCOUNT_ID',
        changes: [
          {
            value,
            field: 'messages',
          },
        ],
      },
    ],
  };
}

/**
 * Execute HTTP POST to webhook
 */
async function postWebhook(payload) {
  const res = await fetch(`${BASE_URL}/webhook?skipAi=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: res.status, body: json };
}

/**
 * Execute HTTP GET
 */
async function getUrl(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json, text };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('   STARTING PHASE 3 WHATSAPP WEBHOOK TEST SUITE    ');
  console.log('====================================================\n');

  // Connect to MongoDB to inspect persistence
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB for direct verification.');

  // Clean test numbers before running
  await Conversation.deleteMany({ phoneNumber: { $in: TEST_PHONES } });
  console.log('Cleaned up previous test records.\n');

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
    // SCENARIO 1: New customer sends a message
    // -----------------------------------------------------------
    {
      const payload = createPayload({
        phone: '919876543001',
        name: 'Rahul Verma',
        messageId: 'wamid.TC01_001',
        text: 'Hello, do you have JK Copier paper in stock?',
        timestamp: '1795430001',
      });

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543001' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.isNewConversation === true &&
        conv !== null &&
        conv.messages.length === 1 &&
        conv.messages[0].content === 'Hello, do you have JK Copier paper in stock?' &&
        conv.messages[0].role === 'customer' &&
        conv.messages[0].messageId === 'wamid.TC01_001';

      record('Scenario 1: New customer sends a message', pass, {
        status: res.status,
        response: res.body,
        dbMessagesCount: conv?.messages?.length,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 2: Existing customer sends another message
    // -----------------------------------------------------------
    {
      const payload = createPayload({
        phone: '919876543001',
        messageId: 'wamid.TC02_002',
        text: 'What is the price for 50 reams of 75 GSM?',
        timestamp: '1795430002',
      });

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543001' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.isNewConversation === false &&
        conv !== null &&
        conv.messages.length === 2 &&
        conv.messages[1].content === 'What is the price for 50 reams of 75 GSM?' &&
        conv.messages[1].role === 'customer';

      record('Scenario 2: Existing customer sends another message', pass, {
        status: res.status,
        response: res.body,
        dbMessagesCount: conv?.messages?.length,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 3: Same phone number sends multiple messages
    // -----------------------------------------------------------
    {
      const payload = createPayload({
        phone: '919876543001',
        messageId: 'wamid.TC03_003',
        text: 'Also can you deliver to Bangalore by Thursday?',
        timestamp: '1795430003',
      });

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543001' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        conv !== null &&
        conv.messages.length === 3 &&
        conv.messages[2].content === 'Also can you deliver to Bangalore by Thursday?';

      record('Scenario 3: Same phone number sends multiple messages', pass, {
        status: res.status,
        response: res.body,
        dbMessagesCount: conv?.messages?.length,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 4: Customer name is available in contacts
    // -----------------------------------------------------------
    {
      const payload = createPayload({
        phone: '919876543002',
        name: 'Priya Sharma',
        messageId: 'wamid.TC04_001',
        text: 'Hi, need quotation for art paper 300 GSM',
        timestamp: '1795430004',
      });

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543002' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.customerName === 'Priya Sharma' &&
        conv !== null &&
        conv.customerName === 'Priya Sharma';

      record('Scenario 4: Customer name is available in contacts', pass, {
        status: res.status,
        response: res.body,
        dbCustomerName: conv?.customerName,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 5: Missing message fields
    // -----------------------------------------------------------
    {
      // Missing text body
      const payloadMissingText = createPayload({
        phone: '919876543002',
        messageId: 'wamid.TC05_MISSING_TEXT',
        text: undefined,
        timestamp: '1795430005',
      });

      const res1 = await postWebhook(payloadMissingText);

      // Missing "from"
      const payloadMissingFrom = createPayload({
        phone: '',
        messageId: 'wamid.TC05_MISSING_FROM',
        text: 'Valid text without from',
        timestamp: '1795430005',
      });

      const res2 = await postWebhook(payloadMissingFrom);

      const pass =
        res1.status === 400 &&
        res1.body.success === false &&
        res2.status === 400 &&
        res2.body.success === false;

      record('Scenario 5: Missing message fields', pass, {
        missingTextStatus: res1.status,
        missingTextMessage: res1.body.message,
        missingFromStatus: res2.status,
        missingFromMessage: res2.body.message,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 6: Unsupported image/audio message
    // -----------------------------------------------------------
    {
      const payload = createPayload({
        phone: '919876543003',
        messageId: 'wamid.TC06_001',
        type: 'image',
        timestamp: '1795430006',
      });

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543003' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.status === 'unsupported' &&
        res.body.data?.messageType === 'image' &&
        conv === null;

      record('Scenario 6: Unsupported image/audio message', pass, {
        status: res.status,
        response: res.body,
        dbConversationExists: conv !== null,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 7: WhatsApp status-update event
    // -----------------------------------------------------------
    {
      const payload = {
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
                  statuses: [
                    {
                      id: 'wamid.TC01_001',
                      status: 'delivered',
                      timestamp: '1795430010',
                      recipient_id: '919876543001',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543001' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.eventType === 'status_update' &&
        conv.messages.length === 3;

      record('Scenario 7: WhatsApp status-update event', pass, {
        status: res.status,
        response: res.body,
        dbMessagesCount: conv.messages.length,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 8: Duplicate message ID
    // -----------------------------------------------------------
    {
      const payload = createPayload({
        phone: '919876543001',
        messageId: 'wamid.TC01_001',
        text: 'Duplicate content attempt',
        timestamp: '1795430020',
      });

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543001' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.isDuplicate === true &&
        conv.messages.length === 3;

      record('Scenario 8: Duplicate message ID', pass, {
        status: res.status,
        response: res.body,
        dbMessagesCount: conv.messages.length,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 9: Database persistence
    // -----------------------------------------------------------
    {
      const conv1 = await Conversation.findOne({ phoneNumber: '919876543001' });
      const conv2 = await Conversation.findOne({ phoneNumber: '919876543002' });

      const pass =
        conv1 !== null &&
        conv1.messages.length === 3 &&
        conv1.messages[0].role === 'customer' &&
        conv1.messages[0].messageId === 'wamid.TC01_001' &&
        conv1.lastMessageAt instanceof Date &&
        conv2 !== null &&
        conv2.customerName === 'Priya Sharma' &&
        conv2.messages.length === 1;

      record('Scenario 9: Database persistence verification', pass, {
        conv1Phone: conv1?.phoneNumber,
        conv1Messages: conv1?.messages?.length,
        conv2CustomerName: conv2?.customerName,
        conv2Messages: conv2?.messages?.length,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 10: Existing GET /health endpoint still works
    // -----------------------------------------------------------
    {
      const res = await getUrl('/health');

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.message === 'Reliable Paper Mart AI Assistant API is running';

      record('Scenario 10: Existing GET /health endpoint still works', pass, {
        status: res.status,
        response: res.body,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 11: Invalid request body
    // -----------------------------------------------------------
    {
      const resEmpty = await postWebhook({});
      const resMalformed = await postWebhook({ foo: 'bar' });

      const pass =
        resEmpty.status === 400 &&
        resEmpty.body.success === false &&
        resMalformed.status === 400 &&
        resMalformed.body.success === false;

      record('Scenario 11: Invalid request body', pass, {
        emptyStatus: resEmpty.status,
        emptyMessage: resEmpty.body.message,
        malformedStatus: resMalformed.status,
        malformedMessage: resMalformed.body.message,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 12: Multiple webhook deliveries for the same message
    // -----------------------------------------------------------
    {
      const payload = createPayload({
        phone: '919876543004',
        name: 'Amit Patel',
        messageId: 'wamid.TC12_RETRY_001',
        text: 'Simulating Meta retry delivery',
        timestamp: '1795430050',
      });

      const resDelivery1 = await postWebhook(payload);
      const resDelivery2 = await postWebhook(payload);
      const resDelivery3 = await postWebhook(payload);

      const conv = await Conversation.findOne({ phoneNumber: '919876543004' });

      const pass =
        resDelivery1.status === 200 &&
        resDelivery1.body.data?.isDuplicate === false &&
        resDelivery2.status === 200 &&
        resDelivery2.body.data?.isDuplicate === true &&
        resDelivery3.status === 200 &&
        resDelivery3.body.data?.isDuplicate === true &&
        conv !== null &&
        conv.messages.length === 1;

      record('Scenario 12: Multiple webhook deliveries for the same message', pass, {
        delivery1: { status: resDelivery1.status, isDuplicate: resDelivery1.body.data?.isDuplicate },
        delivery2: { status: resDelivery2.status, isDuplicate: resDelivery2.body.data?.isDuplicate },
        delivery3: { status: resDelivery3.status, isDuplicate: resDelivery3.body.data?.isDuplicate },
        dbMessagesCount: conv?.messages?.length,
      });
    }

    // ===========================================================
    // NEW PHASE 3 CORRECTION TEST CASES (13 - 18)
    // ===========================================================

    // -----------------------------------------------------------
    // SCENARIO 13: One payload containing TWO text messages from the same phone number
    // -----------------------------------------------------------
    {
      const payload = {
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
                      profile: { name: 'Ramesh Gupta' },
                      wa_id: '919876543013',
                    },
                  ],
                  messages: [
                    {
                      from: '919876543013',
                      id: 'wamid.TC13_001',
                      timestamp: '1795430060',
                      type: 'text',
                      text: { body: 'Do you have 70 GSM copier paper?' },
                    },
                    {
                      from: '919876543013',
                      id: 'wamid.TC13_002',
                      timestamp: '1795430065',
                      type: 'text',
                      text: { body: 'And what is the carton packaging size?' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543013' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.processedCount === 2 &&
        conv !== null &&
        conv.customerName === 'Ramesh Gupta' &&
        conv.messages.length === 2 &&
        conv.messages[0].messageId === 'wamid.TC13_001' &&
        conv.messages[1].messageId === 'wamid.TC13_002';

      record('Scenario 13: Two text messages from the same phone number in one payload', pass, {
        status: res.status,
        processedCount: res.body.data?.processedCount,
        dbMessagesCount: conv?.messages?.length,
        firstMessage: conv?.messages?.[0]?.content,
        secondMessage: conv?.messages?.[1]?.content,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 14: One payload containing messages from TWO DIFFERENT phone numbers
    // -----------------------------------------------------------
    {
      const payload = {
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
                      profile: { name: 'Suresh Raina' },
                      wa_id: '919876543014',
                    },
                    {
                      profile: { name: 'Meena Kumari' },
                      wa_id: '919876543015',
                    },
                  ],
                  messages: [
                    {
                      from: '919876543014',
                      id: 'wamid.TC14_001',
                      timestamp: '1795430070',
                      type: 'text',
                      text: { body: 'Inquiry from Suresh for kraft paper' },
                    },
                    {
                      from: '919876543015',
                      id: 'wamid.TC14_002',
                      timestamp: '1795430075',
                      type: 'text',
                      text: { body: 'Inquiry from Meena for duplex board' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await postWebhook(payload);
      const conv1 = await Conversation.findOne({ phoneNumber: '919876543014' });
      const conv2 = await Conversation.findOne({ phoneNumber: '919876543015' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.processedCount === 2 &&
        conv1 !== null &&
        conv1.customerName === 'Suresh Raina' &&
        conv1.messages.length === 1 &&
        conv1.messages[0].content === 'Inquiry from Suresh for kraft paper' &&
        conv2 !== null &&
        conv2.customerName === 'Meena Kumari' &&
        conv2.messages.length === 1 &&
        conv2.messages[0].content === 'Inquiry from Meena for duplex board';

      record('Scenario 14: Messages from two different phone numbers in one payload', pass, {
        status: res.status,
        processedCount: res.body.data?.processedCount,
        conv1Phone: conv1?.phoneNumber,
        conv1Customer: conv1?.customerName,
        conv2Phone: conv2?.phoneNumber,
        conv2Customer: conv2?.customerName,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 15: Multiple changes and entries in one payload
    // -----------------------------------------------------------
    {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'ENTRY_01',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550000000',
                    phone_number_id: 'PHONE_NUMBER_ID',
                  },
                  contacts: [{ profile: { name: 'Customer Entry 1' }, wa_id: '919876543016' }],
                  messages: [
                    {
                      from: '919876543016',
                      id: 'wamid.TC15_001',
                      timestamp: '1795430080',
                      type: 'text',
                      text: { body: 'Message from entry 1' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
          {
            id: 'ENTRY_02',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550000000',
                    phone_number_id: 'PHONE_NUMBER_ID',
                  },
                  contacts: [{ profile: { name: 'Customer Entry 2' }, wa_id: '919876543017' }],
                  messages: [
                    {
                      from: '919876543017',
                      id: 'wamid.TC15_002',
                      timestamp: '1795430085',
                      type: 'text',
                      text: { body: 'Message from entry 2' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await postWebhook(payload);
      const conv1 = await Conversation.findOne({ phoneNumber: '919876543016' });
      const conv2 = await Conversation.findOne({ phoneNumber: '919876543017' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.processedCount === 2 &&
        conv1 !== null &&
        conv1.messages[0].content === 'Message from entry 1' &&
        conv2 !== null &&
        conv2.messages[0].content === 'Message from entry 2';

      record('Scenario 15: Multiple changes and entries in one payload', pass, {
        status: res.status,
        processedCount: res.body.data?.processedCount,
        conv1Saved: conv1 !== null,
        conv2Saved: conv2 !== null,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 16: Mixed payload containing supported text and unsupported media
    // -----------------------------------------------------------
    {
      const payload = {
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
                  contacts: [{ profile: { name: 'Ananya Roy' }, wa_id: '919876543018' }],
                  messages: [
                    {
                      from: '919876543018',
                      id: 'wamid.TC16_TXT',
                      timestamp: '1795430090',
                      type: 'text',
                      text: { body: 'Please find the sample image below' },
                    },
                    {
                      from: '919876543018',
                      id: 'wamid.TC16_IMG',
                      timestamp: '1795430091',
                      type: 'image',
                      image: { id: 'sample_media_img_123', mime_type: 'image/jpeg' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543018' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.processedCount === 1 &&
        res.body.data?.unsupportedCount === 1 &&
        conv !== null &&
        conv.messages.length === 1 &&
        conv.messages[0].messageId === 'wamid.TC16_TXT' &&
        conv.messages[0].content === 'Please find the sample image below';

      record('Scenario 16: Mixed payload containing supported text and unsupported media', pass, {
        status: res.status,
        processedCount: res.body.data?.processedCount,
        unsupportedCount: res.body.data?.unsupportedCount,
        dbMessagesCount: conv?.messages?.length,
        savedMessageContent: conv?.messages?.[0]?.content,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 17: Duplicate message ID within a multi-message payload
    // -----------------------------------------------------------
    {
      const payload = {
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
                  contacts: [{ profile: { name: 'Devendra Joshi' }, wa_id: '919876543019' }],
                  messages: [
                    {
                      from: '919876543019',
                      id: 'wamid.TC17_DUPE_SAME_BATCH',
                      timestamp: '1795430100',
                      type: 'text',
                      text: { body: 'First occurrence in batch' },
                    },
                    {
                      from: '919876543019',
                      id: 'wamid.TC17_DUPE_SAME_BATCH',
                      timestamp: '1795430101',
                      type: 'text',
                      text: { body: 'Duplicate occurrence in same batch' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543019' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data?.processedCount === 1 &&
        res.body.data?.duplicateCount === 1 &&
        conv !== null &&
        conv.messages.length === 1 &&
        conv.messages[0].content === 'First occurrence in batch';

      record('Scenario 17: Duplicate message ID within a multi-message payload', pass, {
        status: res.status,
        processedCount: res.body.data?.processedCount,
        duplicateCount: res.body.data?.duplicateCount,
        dbMessagesCount: conv?.messages?.length,
        savedMessageContent: conv?.messages?.[0]?.content,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 18: Contact matching when multiple contacts exist and sender wa_id has no match
    // -----------------------------------------------------------
    {
      const payload = {
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
                    { profile: { name: 'Unrelated Contact One' }, wa_id: '919999999001' },
                    { profile: { name: 'Unrelated Contact Two' }, wa_id: '919999999002' },
                  ],
                  messages: [
                    {
                      from: '919876543020',
                      id: 'wamid.TC18_UNMATCHED',
                      timestamp: '1795430110',
                      type: 'text',
                      text: { body: 'Message from sender with no matching wa_id in contacts list' },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await postWebhook(payload);
      const conv = await Conversation.findOne({ phoneNumber: '919876543020' });

      const pass =
        res.status === 200 &&
        res.body.success === true &&
        conv !== null &&
        conv.customerName === null &&
        conv.messages.length === 1;

      record('Scenario 18: Contact matching with multiple contacts and unmatched sender yields null', pass, {
        status: res.status,
        dbCustomerName: conv?.customerName,
        expectedCustomerName: null,
      });
    }

    // -----------------------------------------------------------
    // SCENARIO 19: Missing configured verification token returns HTTP 500
    // -----------------------------------------------------------
    {
      const prevToken = config.whatsappVerifyToken;
      config.whatsappVerifyToken = ''; // simulate unconfigured token without touching .env

      const res = await getUrl('/webhook?hub.mode=subscribe&hub.verify_token=any_token&hub.challenge=test_challenge_500');

      const pass =
        res.status === 500 &&
        res.body.success === false &&
        res.body.message === 'Server configuration error: Webhook verification token is not set';

      config.whatsappVerifyToken = prevToken;

      record('Scenario 19: Missing configured verification token returns HTTP 500', pass, {
        status: res.status,
        response: res.body,
      });
    }

    // -----------------------------------------------------------
    // SCENARIOS 20 & 21: Verification challenge tests (200 for correct token, 403 for incorrect token)
    // -----------------------------------------------------------
    {
      const verifyApp = express();
      verifyApp.get('/webhook', verifyWebhook);
      const verifyServer = verifyApp.listen(0);
      const verifyPort = verifyServer.address().port;
      const verifyBase = `http://localhost:${verifyPort}`;

      const TEST_TOKEN = 'papermart_secure_verify_token_2026';
      const TEST_CHALLENGE = 'CHALLENGE_STRING_XYZ_987654';

      config.whatsappVerifyToken = TEST_TOKEN;

      // Scenario 20: Correct token returns HTTP 200 and exact challenge
      const resValid = await fetch(
        `${verifyBase}/webhook?hub.mode=subscribe&hub.verify_token=${TEST_TOKEN}&hub.challenge=${TEST_CHALLENGE}`
      );
      const validText = await resValid.text();

      const pass20 = resValid.status === 200 && validText === TEST_CHALLENGE;
      record('Scenario 20: Correct WHATSAPP_VERIFY_TOKEN returns HTTP 200 and exact challenge', pass20, {
        status: resValid.status,
        challengeReturned: validText,
        expectedChallenge: TEST_CHALLENGE,
      });

      // Scenario 21: Incorrect token returns HTTP 403
      const resInvalid = await fetch(
        `${verifyBase}/webhook?hub.mode=subscribe&hub.verify_token=wrong_token_value&hub.challenge=${TEST_CHALLENGE}`
      );
      const invalidJson = await resInvalid.json();

      const pass21 =
        resInvalid.status === 403 &&
        invalidJson.success === false &&
        invalidJson.message === 'Webhook verification failed: Token mismatch';

      record('Scenario 21: Incorrect verification token returns HTTP 403', pass21, {
        status: resInvalid.status,
        response: invalidJson,
      });

      // Cleanup
      config.whatsappVerifyToken = '';
      await new Promise((resolve) => verifyServer.close(resolve));
    }

    console.log('====================================================');
    const allPassed = results.every((r) => r.pass);
    console.log(`TEST SUITE FINISHED: ${results.filter((r) => r.pass).length}/${results.length} PASSED`);
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

runTestSuite().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
