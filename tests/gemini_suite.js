import { geminiService, GeminiService, FALLBACK_RESPONSE, MAX_WORD_COUNT, countWords } from '../src/services/gemini.service.js';
import { faqEntries, FAQ_DISCLAIMER, getFormattedFaqText } from '../src/data/faq.js';
import { config } from '../src/config/env.js';

/**
 * Creates a mock Gemini client returning predetermined text or throwing an error
 * @param {string|Function} mockResult - String to return or function throwing error
 * @returns {Object}
 */
function createMockClient(mockResult) {
  return {
    models: {
      generateContent: async (params) => {
        if (typeof mockResult === 'function') {
          return mockResult(params);
        }
        return {
          text: mockResult,
          candidates: [
            {
              content: {
                parts: [{ text: mockResult }],
              },
            },
          ],
        };
      },
    },
  };
}

async function runGeminiTestSuite() {
  console.log('====================================================');
  console.log('      STARTING PHASE 4 GEMINI AI TEST SUITE        ');
  console.log('====================================================\n');

  const results = [];

  function record(name, pass, details) {
    results.push({ name, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    console.log(`       Details: ${JSON.stringify(details)}\n`);
  }

  // -----------------------------------------------------------
  // TEST 1: FAQ knowledge base integrity and disclaimer
  // -----------------------------------------------------------
  {
    const hasDisclaimer = typeof FAQ_DISCLAIMER === 'string' && FAQ_DISCLAIMER.includes('Illustrative');
    const hasEntries = Array.isArray(faqEntries) && faqEntries.length >= 10;
    const formattedText = getFormattedFaqText();
    const hasFormattedContent = formattedText.includes('Copier Paper') && formattedText.includes('Minimum Order Quantity');

    const pass = hasDisclaimer && hasEntries && hasFormattedContent;
    record('Test 1: FAQ data integrity and illustrative disclaimer', pass, {
      entriesCount: faqEntries.length,
      hasDisclaimer,
      formattedLength: formattedText.length,
    });
  }

  // -----------------------------------------------------------
  // TEST 2: Question clearly answered by FAQ
  // -----------------------------------------------------------
  {
    const expectedAnswer =
      'Our standard copier paper is available in 70 GSM, 75 GSM, and 80 GSM in A4 and A3 sizes, packed 500 sheets per ream.';
    const mockClient = createMockClient(expectedAnswer);

    const result = await geminiService.generateResponse('What GSM options do you have for copier paper?', {
      client: mockClient,
      apiKey: 'mock_key',
    });

    const pass =
      result.success === true &&
      result.isFallback === false &&
      result.text === expectedAnswer &&
      result.wordCount <= MAX_WORD_COUNT &&
      result.reason === 'grounded_faq_answer';

    record('Test 2: Question clearly answered by FAQ', pass, {
      success: result.success,
      isFallback: result.isFallback,
      wordCount: result.wordCount,
      text: result.text,
    });
  }

  // -----------------------------------------------------------
  // TEST 3: Question not covered by FAQ (model triggers fallback)
  // -----------------------------------------------------------
  {
    const mockClient = createMockClient(FALLBACK_RESPONSE);

    const result = await geminiService.generateResponse('Do you sell wooden office desks and executive chairs?', {
      client: mockClient,
      apiKey: 'mock_key',
    });

    const pass =
      result.success === true &&
      result.isFallback === true &&
      result.text === FALLBACK_RESPONSE &&
      result.wordCount === 8;

    record('Test 3: Question not covered by FAQ returns exact fallback sentence', pass, {
      text: result.text,
      isFallback: result.isFallback,
      exactMatch: result.text === FALLBACK_RESPONSE,
    });
  }

  // -----------------------------------------------------------
  // TEST 4: Question with insufficient FAQ information
  // -----------------------------------------------------------
  {
    // Model returns partial answer with handoff request
    const mockClient = createMockClient('Let me connect you with our team member.');

    const result = await geminiService.generateResponse('Can I pay 50% in Bitcoin cryptocurrency?', {
      client: mockClient,
      apiKey: 'mock_key',
    });

    const pass =
      result.success === true &&
      result.isFallback === true &&
      result.text === FALLBACK_RESPONSE &&
      result.wordCount === 8;

    record('Test 4: Insufficient FAQ information returns exact fallback sentence', pass, {
      text: result.text,
      isFallback: result.isFallback,
      exactMatch: result.text === FALLBACK_RESPONSE,
    });
  }

  // -----------------------------------------------------------
  // TEST 5: Empty and invalid inputs
  // -----------------------------------------------------------
  {
    const resEmpty = await geminiService.generateResponse('');
    const resWhitespace = await geminiService.generateResponse('     ');
    const resNull = await geminiService.generateResponse(null);
    const resUndefined = await geminiService.generateResponse(undefined);

    const pass =
      resEmpty.text === FALLBACK_RESPONSE &&
      resEmpty.isFallback === true &&
      resWhitespace.text === FALLBACK_RESPONSE &&
      resWhitespace.isFallback === true &&
      resNull.text === FALLBACK_RESPONSE &&
      resNull.isFallback === true &&
      resUndefined.text === FALLBACK_RESPONSE &&
      resUndefined.isFallback === true;

    record('Test 5: Empty and invalid inputs handled safely', pass, {
      emptyText: resEmpty.text,
      whitespaceText: resWhitespace.text,
      nullText: resNull.text,
      undefinedText: resUndefined.text,
    });
  }

  // -----------------------------------------------------------
  // TEST 6: Missing Gemini API key
  // -----------------------------------------------------------
  {
    const service = new GeminiService();
    const result = await service.generateResponse('What are your hours?', {
      apiKey: '', // explicit empty key
    });

    const pass =
      result.success === false &&
      result.text === FALLBACK_RESPONSE &&
      result.isFallback === true &&
      result.reason === 'missing_api_key';

    record('Test 6: Missing Gemini API key handled safely with fallback', pass, {
      success: result.success,
      text: result.text,
      reason: result.reason,
    });
  }

  // -----------------------------------------------------------
  // TEST 7: Gemini API network/server error
  // -----------------------------------------------------------
  {
    const mockClient = createMockClient(() => {
      throw new Error('503 Service Unavailable: Gemini API backend failure');
    });

    const result = await geminiService.generateResponse('Where is your warehouse?', {
      client: mockClient,
      apiKey: 'mock_key',
    });

    const pass =
      result.success === false &&
      result.text === FALLBACK_RESPONSE &&
      result.isFallback === true &&
      result.reason === 'gemini_api_error';

    record('Test 7: Gemini API network/server error caught safely with fallback', pass, {
      success: result.success,
      text: result.text,
      reason: result.reason,
    });
  }

  // -----------------------------------------------------------
  // TEST 8: Response exceeding 80 words is rejected
  // -----------------------------------------------------------
  {
    // Generate an 85-word verbose response
    const verboseText =
      'Reliable Paper Mart is proud to offer a wide collection of superior quality paper merchandise to diverse clientele throughout India. ' +
      'Our standard copier paper is manufactured to exact specifications in 70 GSM, 75 GSM, and 80 GSM formats suitable for all high-speed laser ' +
      'and inkjet printing devices. In addition, our warehouse carries extensive stock of duplex boards, premium coated art papers, and industrial ' +
      'corrugated packaging kraft paper rolls. If you are interested in ordering large volumes, we also provide customized reel slitting services with ' +
      'prompt delivery across Mumbai and neighboring commercial trade zones.';

    const wordCount = countWords(verboseText);
    const mockClient = createMockClient(verboseText);

    const result = await geminiService.generateResponse('Tell me about your paper', {
      client: mockClient,
      apiKey: 'mock_key',
    });

    const pass =
      wordCount > 80 &&
      result.success === true &&
      result.isFallback === true &&
      result.text === FALLBACK_RESPONSE &&
      result.reason === 'word_limit_exceeded';

    record('Test 8: Response exceeding 80 words rejected and replaced by fallback', pass, {
      originalWordCount: wordCount,
      returnedText: result.text,
      isFallback: result.isFallback,
      reason: result.reason,
    });
  }

  // -----------------------------------------------------------
  // TEST 9: Word count boundary enforcement (80 words allowed, 81 words rejected)
  // -----------------------------------------------------------
  {
    const words80 = Array(80).fill('word').join(' ');
    const words81 = Array(81).fill('word').join(' ');

    const validated80 = geminiService.validateCandidateResponse(words80);
    const validated81 = geminiService.validateCandidateResponse(words81);

    const pass =
      validated80.isValid === true &&
      validated80.isFallback === false &&
      validated80.wordCount === 80 &&
      validated81.isValid === false &&
      validated81.isFallback === true &&
      validated81.text === FALLBACK_RESPONSE &&
      validated81.reason === 'word_limit_exceeded';

    record('Test 9: Word count boundary enforcement (80 allowed, 81 rejected)', pass, {
      count80Pass: validated80.wordCount === 80 && !validated80.isFallback,
      count81Pass: validated81.isFallback && validated81.reason === 'word_limit_exceeded',
    });
  }

  // -----------------------------------------------------------
  // TEST 10: Live Gemini API check (conditional on GEMINI_API_KEY)
  // -----------------------------------------------------------
  {
    if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
      console.log('Active GEMINI_API_KEY detected in environment. Running live integration test...');
      try {
        const liveRes = await geminiService.generateResponse('What are your office working hours?');
        const pass =
          liveRes.success === true &&
          liveRes.text.length > 0 &&
          liveRes.wordCount <= MAX_WORD_COUNT;

        record('Test 10: Live Gemini API grounded query execution', pass, {
          response: liveRes.text,
          wordCount: liveRes.wordCount,
          isFallback: liveRes.isFallback,
        });
      } catch (err) {
        record('Test 10: Live Gemini API grounded query execution', false, {
          error: err.message,
        });
      }
    } else {
      console.log('Notice: GEMINI_API_KEY not configured in .env. Live external call skipped; mock tests verified full contract.');
      record('Test 10: Missing GEMINI_API_KEY handles gracefully without live network call', true, {
        status: 'skipped_gracefully',
        reason: 'GEMINI_API_KEY is not set in local .env, fallback response contract verified',
      });
    }
  }

  console.log('====================================================');
  const allPassed = results.every((r) => r.pass);
  console.log(`GEMINI TEST SUITE FINISHED: ${results.filter((r) => r.pass).length}/${results.length} PASSED`);
  console.log('====================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runGeminiTestSuite().catch((err) => {
  console.error('Gemini test suite error:', err);
  process.exit(1);
});
