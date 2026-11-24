# Webhook & Gemini AI Integration Report

**Project:** Reliable Paper Mart AI Assistant  
**Date:** November 23, 2026  
**Auditor:** Senior Node.js Backend Engineer  
**Status:** Successfully Integrated & Verified (72/72 Tests Passing across 7 Suites)

---

## 1. Executive Summary

This investigation traced the execution flow of incoming messages sent via `POST /webhook` and confirmed that the webhook was previously only storing customer messages into MongoDB without invoking the conversational AI pipeline. 

The integration was completed by connecting the webhook processing layer directly with `conversationService`, `geminiService`, and the MongoDB storage layer. An incoming simulated WhatsApp message received at `POST /webhook` now executes the full AI lifecycle:
1. **Conversation Memory Retrieval** (previous conversation turns).
2. **FAQ Context Retrieval & Grounding** (`src/data/faq.js`).
3. **Live Google Gemini API Execution** (`@google/genai` with `gemini-3.5-flash-lite`).
4. **Assistant Response Generation** (enforcing FAQ grounding and 80-word limits).
5. **Assistant Response Persistence in MongoDB** (appends assistant reply to the conversation document).
6. **Lead Capture & Human Escalation** (detects commercial intent and triggers handoffs when applicable).
7. **Immediate Diagnostic Visibility** (`res.body.data.assistantResponse` returned in the webhook response, plus a developer simulation endpoint `POST /webhook/simulate`).

---

## 2. Root Cause Analysis: What Was Missing Previously?

### The Initial Execution Path:
In Phase 3, `src/services/webhook.service.js` was implemented specifically for message ingestion prior to the development of Gemini AI (Phase 4), Memory (Phase 5), Leads (Phase 6), and Handoffs (Phase 7).

Tracing the code revealed:
1. `handleWebhook` in `src/controllers/webhook.controller.js` passed the payload to `webhookService.handleWebhookPayload(payload)`.
2. `handleWebhookPayload` iterated over entries and changes, calling `processTextMessage(...)`.
3. `processTextMessage` stored the incoming customer message in `Conversation.messages` and called `leadService` and `handoffService`.
4. **The Missing Link:** `processTextMessage` never called `conversationService.processCustomerMessageWithMemory` or `geminiService.generateResponse`.
5. As a result, the endpoint returned:
   ```json
   {
     "success": true,
     "message": "Existing conversation updated and message appended successfully",
     "data": { ... }
   }
   ```
   while Gemini was never invoked, no assistant response was generated, and no assistant reply was saved in MongoDB.

---

## 3. The Unified Integration Architecture

The message flow has been updated in `src/services/webhook.service.js` and `src/controllers/webhook.controller.js`:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as WhatsApp / Simulated Client
    participant Controller as Webhook Controller
    participant WebhookSvc as Webhook Service
    participant LeadSvc as Lead Service
    participant HandoffSvc as Handoff Service
    participant GeminiSvc as Gemini AI Service
    participant MongoDB as MongoDB Atlas (Conversation)

    Customer->>Controller: POST /webhook (Meta Payload)
    Controller->>WebhookSvc: handleWebhookPayload(payload, options)
    WebhookSvc->>WebhookSvc: Validate payload & check messageId duplicate
    WebhookSvc->>MongoDB: Save incoming Customer Message
    WebhookSvc->>LeadSvc: processLead() -> Capture intent / product / name
    WebhookSvc->>HandoffSvc: detectHumanRequest() -> Check explicit escalation

    alt Explicit Human Request
        WebhookSvc->>HandoffSvc: triggerHandoff("Customer requested human assistance")
        WebhookSvc->>MongoDB: saveAssistantResponse("Let me connect you with our team member.")
    else Standard Business Question
        WebhookSvc->>MongoDB: getRecentHistory(phoneNumber, 10)
        WebhookSvc->>GeminiSvc: generateResponse(query, { history, FAQ })
        GeminiSvc-->>WebhookSvc: Grounded FAQ Answer (<= 80 words)
        
        alt AI Fallback Triggered
            WebhookSvc->>HandoffSvc: triggerHandoff("AI fallback: FAQ cannot answer inquiry")
        end

        WebhookSvc->>MongoDB: saveAssistantResponse(assistantText)
    end

    WebhookSvc-->>Controller: Return processed result with assistantResponse & AI diagnostics
    Controller-->>Customer: HTTP 200 OK { success: true, data: { assistantResponse, ai: { ... } } }
```

### Key Enhancements Made:
- **`src/services/webhook.service.js`:**
  - Added conversational AI pipeline execution directly inside `processTextMessage()`.
  - Prior conversation turns are extracted (`conversation.messages.slice(0, -1).slice(-historyLimit)`) and injected into the Gemini contents payload.
  - Generates the assistant reply and persists it to MongoDB using `conversationService.saveAssistantResponse()`.
  - Appends `assistantResponse` and `ai: { isFallback, wordCount, needsHuman, historyCountUsed }` to `data` in the HTTP response.
  - Maintains `options.skipAi` support so raw ingestion unit tests from Phase 3 continue to pass without side-effects.
- **`src/controllers/webhook.controller.js` & `src/routes/webhook.routes.js`:**
  - `handleWebhook`: Reads `req.query.skipAi` and `x-skip-ai` header (defaults to `false`, running the full AI pipeline).
  - `simulateWebhook`: Added `POST /webhook/simulate` endpoint accepting simplified JSON (`{ phoneNumber, content, customerName }`) or standard WhatsApp payloads for easy developer inspection.

---

## 4. Verification: Whether Components Are Really Executed

| Component | Status | Evidence from Live Execution |
| :--- | :---: | :--- |
| **1. Memory Retrieval** | **YES** | Slices last 10 prior conversation turns; Verified in Test 2 where `historyTurnsUsed: 2`. |
| **2. FAQ Retrieval** | **YES** | System instruction dynamically formatted from 14 entries in `src/data/faq.js`. |
| **3. Google Gemini API Call** | **YES** | Live HTTPS call to Google Gemini (`gemini-3.5-flash-lite`); completed in ~1.5s. |
| **4. Response Generation** | **YES** | Grounded output: *"Hello! For standard copier paper, our minimum order quantity is 10 reams..."* (24 words, <= 80 limit). |
| **5. Response Persistence** | **YES** | MongoDB `conversation.messages` length grew from 1 (customer only) to 2 (customer + assistant). |
| **6. Lead Capture & Handoff** | **YES** | Buying intent created `Lead` record with `productOfInterest: 'Copier Paper'`; human requests set `needsHuman: true, handoffStatus: 'pending'`. |

---

## 5. Sample Requests and Responses

### 5.1 Standard WhatsApp Inbound Webhook (`POST /webhook`)

#### Request:
```bash
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "BIZ_123",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": { "display_phone_number": "15550000000", "phone_number_id": "PHONE_1" },
          "contacts": [{ "profile": { "name": "Suresh Kumar" }, "wa_id": "919876549001" }],
          "messages": [{
            "from": "919876549001",
            "id": "wamid.SAMPLE_AI_001",
            "timestamp": "1774350000",
            "type": "text",
            "text": { "body": "What is the minimum order quantity for standard copier paper?" }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

#### Response (`HTTP 200 OK`):
```json
{
  "success": true,
  "message": "New conversation created and message stored successfully",
  "data": {
    "phoneNumber": "919876549001",
    "customerName": "Suresh Kumar",
    "messageId": "wamid.SAMPLE_AI_001",
    "isNewConversation": true,
    "isDuplicate": false,
    "processedCount": 1,
    "duplicateCount": 0,
    "unsupportedCount": 0,
    "assistantResponse": "Hello! For standard copier paper, our minimum order quantity is 10 reams. Please let me know if you need help with anything else!",
    "ai": {
      "assistantResponse": "Hello! For standard copier paper, our minimum order quantity is 10 reams. Please let me know if you need help with anything else!",
      "isFallback": false,
      "wordCount": 23,
      "needsHuman": false,
      "handoffReason": null,
      "leadCaptured": false,
      "historyCountUsed": 0
    }
  }
}
```

### 5.2 Developer Testing Endpoint (`POST /webhook/simulate`)

#### Request:
```bash
curl -X POST http://localhost:5000/webhook/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "919876549003",
    "customerName": "Meera Patel",
    "content": "What are your business operating hours?"
  }'
```

#### Response (`HTTP 200 OK`):
```json
{
  "success": true,
  "message": "New conversation created and message stored successfully",
  "data": {
    "phoneNumber": "919876549003",
    "customerName": "Meera Patel",
    "messageId": "wamid.sim_1774356000000",
    "isNewConversation": true,
    "isDuplicate": false,
    "processedCount": 1,
    "duplicateCount": 0,
    "unsupportedCount": 0,
    "assistantResponse": "Hello! Our office and warehouse operate Monday to Saturday from 9:30 AM to 6:30 PM IST. We are closed on Sundays and national public holidays.",
    "ai": {
      "assistantResponse": "Hello! Our office and warehouse operate Monday to Saturday from 9:30 AM to 6:30 PM IST. We are closed on Sundays and national public holidays.",
      "isFallback": false,
      "wordCount": 26,
      "needsHuman": false,
      "handoffReason": null,
      "leadCaptured": false,
      "historyCountUsed": 0
    }
  }
}
```

---

## 6. Automated Test Results (All 7 Suites Passing)

A dedicated test suite `tests/webhook_ai_suite.js` was created and added to the master test runner (`npm test`).

### Master Test Runner Output:
```text
================================================================
                     FINAL TEST SUMMARY                         
================================================================
[✓ PASS] Phase 3: WhatsApp Webhook Suite                (webhook_suite.js)  - 21/21
[✓ PASS] Phase 4: Gemini AI Grounding Suite             (gemini_suite.js)   - 10/10
[✓ PASS] Phase 5: Conversation Memory Suite             (memory_suite.js)   - 9/9
[✓ PASS] Phase 6: Customer Lead Capture Suite           (lead_suite.js)     - 9/9
[✓ PASS] Phase 7: Human Handoff & Escalation Suite      (handoff_suite.js)  - 11/11
[✓ PASS] Phase 8: Complete End-to-End Customer Journey  (e2e_journey_suite.js) - 6/6
[✓ PASS] Phase 8: Webhook + Gemini AI Integration Suite (webhook_ai_suite.js) - 6/6
----------------------------------------------------------------
Total Suites: 7 | Passed: 7 | Failed: 0 | Total Tests: 72
Duration: 41.0s
================================================================
```

---

## 7. Remaining Limitations

1. **Simulated Outbound WhatsApp Delivery:** Meta's WhatsApp Cloud API architecture separates inbound webhooks from outbound message delivery. In live production, the server would asynchronously call Meta's Graph API (`POST https://graph.facebook.com/v21.0/{phone_number_id}/messages`) with the assistant text. In accordance with assignment instructions, outbound messaging is not sent to real phones; the generated assistant text is persisted in MongoDB and returned in the HTTP response.
2. **Synchronous vs Background AI Workers:** For high-volume WhatsApp deployments (100+ msg/sec), Gemini API calls should be queued (e.g. BullMQ / Redis) so the webhook endpoint can return HTTP 200 within Meta's 15-second webhook timeout window. For the current scope, synchronous execution ensures immediate inspection.
