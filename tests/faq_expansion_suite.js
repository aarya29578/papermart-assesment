import mongoose from 'mongoose';
import { geminiService, FALLBACK_RESPONSE, MAX_WORD_COUNT } from '../src/services/gemini.service.js';
import { conversationService } from '../src/services/conversation.service.js';
import { Conversation } from '../src/models/Conversation.js';
import { faqEntries, getRelevantFaqEntries } from '../src/data/faq.js';
import { config } from '../src/config/env.js';

// Helper sleep to stay safely under Gemini free tier rate limit (15 requests/minute)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TEST_PHONE = '919876549999';

async function callWithRetry(query, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await geminiService.generateResponse(query, options);
    // If rate-limited or transient service error, wait and retry
    if (res.reason === 'gemini_api_error' && attempt < retries) {
      console.log(`Rate limit or transient API error. Waiting 10s before retry (attempt ${attempt}/${retries})...`);
      await sleep(10000);
      continue;
    }
    return res;
  }
  return await geminiService.generateResponse(query, options);
}

async function runFaqExpansionTestSuite() {
  console.log('====================================================');
  console.log(' STARTING FAQ EXPANSION & INTELLIGENCE TEST SUITE   ');
  console.log('====================================================\n');

  // Connect to MongoDB Atlas for handoff persistence verification
  await mongoose.connect(config.mongodbUri);
  await Conversation.deleteMany({ phoneNumber: TEST_PHONE });

  const results = [];

  function record(name, pass, details) {
    results.push({ name, pass, details });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}`);
    console.log(`       Details: ${JSON.stringify(details)}\n`);
  }

  try {
    // -----------------------------------------------------------
    // SUITE INTEGRITY: Expanded FAQ Knowledge Base Structure
    // -----------------------------------------------------------
    {
      const totalEntries = faqEntries.length;
      const officialCount = faqEntries.filter((e) => e.source === 'official_website').length;
      const demoCount = faqEntries.filter((e) => e.source === 'illustrative_demo').length;

      const categories = new Set(faqEntries.map((e) => e.category));
      const hasWritingPrinting = categories.has('Writing & Printing Grade');
      const hasPackaging = categories.has('Packaging Grade');
      const hasSpeciality = categories.has('Speciality Grade');
      const hasIndustrial = categories.has('Industrial Grade');
      const hasSustainable = categories.has('Sustainable & Handmade Paper');
      const hasCompanyInfo = categories.has('Company Information');

      // Verify that getRelevantFaqEntries NEVER retrieves demo entries
      const sampleQueries = [
        'What are your office working hours?',
        'What is the minimum order quantity?',
        'Where do you deliver?',
        'What GSM options are available for standard copier paper?',
      ];
      const demoNeverRetrieved = sampleQueries.every((q) => {
        const matches = getRelevantFaqEntries(q);
        return matches.every((m) => m.source !== 'illustrative_demo');
      });

      const pass =
        totalEntries >= 40 &&
        officialCount >= 30 &&
        demoCount >= 3 &&
        demoNeverRetrieved &&
        hasWritingPrinting &&
        hasPackaging &&
        hasSpeciality &&
        hasIndustrial &&
        hasSustainable &&
        hasCompanyInfo;

      record('Test 1: Expanded FAQ Knowledge Base Integrity & Source Separation (Demo Blocked)', pass, {
        totalEntries,
        officialCount,
        demoCount,
        demoNeverRetrieved,
        categoryCount: categories.size,
      });
    }

    // -----------------------------------------------------------
    // CATEGORY 1: COMPANY INFORMATION (STRICT 1-TO-1 MATCHING)
    // -----------------------------------------------------------
    {
      // Test 2: What is your company name? (returns ONLY company name, no products)
      await sleep(1500);
      const resName = await callWithRetry('What is your company name?');
      const namePass =
        resName.success &&
        !resName.isFallback &&
        resName.text.includes('Reliable Paper Mart') &&
        !resName.text.toLowerCase().includes('copier paper') &&
        !resName.text.toLowerCase().includes('maplitho') &&
        !resName.text.toLowerCase().includes('bhiwandi') &&
        resName.wordCount <= MAX_WORD_COUNT;

      record('Test 2: Company Info — "What is your company name?" (strict 1-to-1 match, no products)', namePass, {
        response: resName.text,
        wordCount: resName.wordCount,
        isFallback: resName.isFallback,
      });
    }

    {
      // Test 3: How many years of experience do you have?
      await sleep(1500);
      const resExp = await callWithRetry('How many years of experience do you have?');
      const expPass =
        resExp.success &&
        !resExp.isFallback &&
        (resExp.text.includes('50+') || resExp.text.includes('50 years') || resExp.text.includes('50')) &&
        resExp.wordCount <= MAX_WORD_COUNT;

      record('Test 3: Company Info — "How many years of experience do you have?"', expPass, {
        response: resExp.text,
        wordCount: resExp.wordCount,
        isFallback: resExp.isFallback,
      });
    }

    {
      // Test 4: Where are you headquartered?
      await sleep(1500);
      const resHQ = await callWithRetry('Where are you headquartered?');
      const hqPass =
        resHQ.success &&
        !resHQ.isFallback &&
        resHQ.text.toLowerCase().includes('mumbai') &&
        resHQ.wordCount <= MAX_WORD_COUNT;

      record('Test 4: Company Info — "Where are you headquartered?"', hqPass, {
        response: resHQ.text,
        wordCount: resHQ.wordCount,
        isFallback: resHQ.isFallback,
      });
    }

    {
      // Test 5: What is your registered office address?
      await sleep(1500);
      const resReg = await callWithRetry('What is your registered office address?');
      const regPass =
        resReg.success &&
        !resReg.isFallback &&
        (resReg.text.toLowerCase().includes('bhiwandi') || resReg.text.includes('Dapode')) &&
        resReg.wordCount <= MAX_WORD_COUNT;

      record('Test 5: Company Info — "What is your registered office address?"', regPass, {
        response: resReg.text,
        wordCount: resReg.wordCount,
        isFallback: resReg.isFallback,
      });
    }

    {
      // Test 6: Where is your sales office located?
      await sleep(1500);
      const resSales = await callWithRetry('Where is your sales office located?');
      const salesPass =
        resSales.success &&
        !resSales.isFallback &&
        (resSales.text.toLowerCase().includes('kalbadevi') || resSales.text.includes('Dadiseth')) &&
        resSales.wordCount <= MAX_WORD_COUNT;

      record('Test 6: Company Info — "Where is your sales office located?"', salesPass, {
        response: resSales.text,
        wordCount: resSales.wordCount,
        isFallback: resSales.isFallback,
      });
    }

    {
      // Test 7: How can I contact your sales team?
      await sleep(1500);
      const resContact = await callWithRetry('How can I contact your sales team?');
      const contactPass =
        resContact.success &&
        !resContact.isFallback &&
        (resContact.text.includes('2243471111') ||
          resContact.text.includes('info@reliablepapermart.com') ||
          resContact.text.toLowerCase().includes('kalbadevi')) &&
        resContact.wordCount <= MAX_WORD_COUNT;

      record('Test 7: Company Info — "How can I contact your sales team?"', contactPass, {
        response: resContact.text,
        wordCount: resContact.wordCount,
        isFallback: resContact.isFallback,
      });
    }

    {
      // Test 8: What is the company vision?
      await sleep(1500);
      const resVision = await callWithRetry('What is the company vision?');
      const visionPass =
        resVision.success &&
        !resVision.isFallback &&
        (resVision.text.toLowerCase().includes('2030') ||
          resVision.text.toLowerCase().includes('leader') ||
          resVision.text.toLowerCase().includes('supply chain')) &&
        resVision.wordCount <= MAX_WORD_COUNT;

      record('Test 8: Company Info — "What is the company vision?"', visionPass, {
        response: resVision.text,
        wordCount: resVision.wordCount,
        isFallback: resVision.isFallback,
      });
    }

    // -----------------------------------------------------------
    // CATEGORY 2: PRODUCT CATEGORIES & INDIVIDUAL PRODUCTS
    // -----------------------------------------------------------
    {
      // Test 9: What products do you sell?
      await sleep(1500);
      const resProds = await callWithRetry('What products do you sell?');
      const prodsPass =
        resProds.success &&
        !resProds.isFallback &&
        (resProds.text.toLowerCase().includes('writing') ||
          resProds.text.toLowerCase().includes('packaging') ||
          resProds.text.toLowerCase().includes('speciality') ||
          resProds.text.toLowerCase().includes('grade')) &&
        resProds.wordCount <= MAX_WORD_COUNT;

      record('Test 9: Product Categories — "What products do you sell?"', prodsPass, {
        response: resProds.text,
        wordCount: resProds.wordCount,
        isFallback: resProds.isFallback,
      });
    }

    {
      // Test 10: Do you sell art paper?
      await sleep(1500);
      const resArt = await callWithRetry('Do you sell art paper?');
      const artPass =
        resArt.success &&
        !resArt.isFallback &&
        resArt.text.toLowerCase().includes('art paper') &&
        resArt.wordCount <= MAX_WORD_COUNT;

      record('Test 10: Individual Products — "Do you sell art paper?"', artPass, {
        response: resArt.text,
        wordCount: resArt.wordCount,
        isFallback: resArt.isFallback,
      });
    }

    {
      // Test 11: What is Maplitho?
      await sleep(1500);
      const resMap = await callWithRetry('What is Maplitho?');
      const mapPass =
        resMap.success &&
        !resMap.isFallback &&
        (resMap.text.toLowerCase().includes('woodfree') ||
          resMap.text.toLowerCase().includes('publishing') ||
          resMap.text.toLowerCase().includes('printing') ||
          resMap.text.toLowerCase().includes('chemical pulp')) &&
        resMap.wordCount <= MAX_WORD_COUNT;

      record('Test 11: Individual Products — "What is Maplitho?"', mapPass, {
        response: resMap.text,
        wordCount: resMap.wordCount,
        isFallback: resMap.isFallback,
      });
    }

    {
      // Test 12: Do you sell Duplex Board?
      await sleep(1500);
      const resDuplex = await callWithRetry('Do you sell Duplex Board?');
      const duplexPass =
        resDuplex.success &&
        !resDuplex.isFallback &&
        resDuplex.text.toLowerCase().includes('duplex board') &&
        resDuplex.wordCount <= MAX_WORD_COUNT;

      record('Test 12: Individual Products — "Do you sell Duplex Board?"', duplexPass, {
        response: resDuplex.text,
        wordCount: resDuplex.wordCount,
        isFallback: resDuplex.isFallback,
      });
    }

    {
      // Test 13: Do you supply Kraft Paper?
      await sleep(1500);
      const resKraft = await callWithRetry('Do you supply Kraft Paper?');
      const kraftPass =
        resKraft.success &&
        !resKraft.isFallback &&
        resKraft.text.toLowerCase().includes('kraft') &&
        resKraft.wordCount <= MAX_WORD_COUNT;

      record('Test 13: Individual Products — "Do you supply Kraft Paper?"', kraftPass, {
        response: resKraft.text,
        wordCount: resKraft.wordCount,
        isFallback: resKraft.isFallback,
      });
    }

    {
      // Test 14: Do you sell handmade paper?
      await sleep(1500);
      const resHandmade = await callWithRetry('Do you sell handmade paper?');
      const handmadePass =
        resHandmade.success &&
        !resHandmade.isFallback &&
        (resHandmade.text.toLowerCase().includes('seed') ||
          resHandmade.text.toLowerCase().includes('cotton') ||
          resHandmade.text.toLowerCase().includes('handmade') ||
          resHandmade.text.toLowerCase().includes('sustainable')) &&
        resHandmade.wordCount <= MAX_WORD_COUNT;

      record('Test 14: Individual Products — "Do you sell handmade paper?"', handmadePass, {
        response: resHandmade.text,
        wordCount: resHandmade.wordCount,
        isFallback: resHandmade.isFallback,
      });
    }

    {
      // Test 15: What products are used for food packaging?
      await sleep(1500);
      const resFood = await callWithRetry('What products are used for food packaging?');
      const foodPass =
        resFood.success &&
        !resFood.isFallback &&
        (resFood.text.toLowerCase().includes('food grade') ||
          resFood.text.toLowerCase().includes('greaseproof') ||
          resFood.text.toLowerCase().includes('butter paper')) &&
        resFood.wordCount <= MAX_WORD_COUNT;

      record('Test 15: Individual Products — "What products are used for food packaging?"', foodPass, {
        response: resFood.text,
        wordCount: resFood.wordCount,
        isFallback: resFood.isFallback,
      });
    }

    // -----------------------------------------------------------
    // CATEGORY 3: UNKNOWN & UNVERIFIED QUESTIONS (EXACT FALLBACK)
    // -----------------------------------------------------------
    {
      // Test 16: Unknown / Unrelated — Gaming laptops or graphics cards
      const resLaptop = await callWithRetry('Do you sell gaming laptops or graphics cards?');
      const laptopPass =
        resLaptop.isFallback &&
        resLaptop.text === FALLBACK_RESPONSE &&
        resLaptop.wordCount === 8;

      record('Test 16: Unknown Inquiry — "Do you sell gaming laptops or graphics cards?" returns exact fallback', laptopPass, {
        response: resLaptop.text,
        isFallback: resLaptop.isFallback,
      });
    }

    {
      // Test 17: Unknown / Unrelated — Office furniture
      const resFurniture = await callWithRetry('Do you sell wooden office desks and executive chairs?');
      const furniturePass =
        resFurniture.isFallback &&
        resFurniture.text === FALLBACK_RESPONSE &&
        resFurniture.wordCount === 8;

      record('Test 17: Unknown Inquiry — "Do you sell wooden office desks?" returns exact fallback', furniturePass, {
        response: resFurniture.text,
        isFallback: resFurniture.isFallback,
      });
    }

    {
      // Test 18: Unverified Copier GSM Options
      const resGsm = await callWithRetry('What GSM options do you have for copier paper?');
      const gsmPass =
        resGsm.isFallback &&
        resGsm.text === FALLBACK_RESPONSE &&
        resGsm.wordCount === 8;

      record('Test 18: Unverified GSM — "What GSM options do you have for copier paper?" returns exact fallback', gsmPass, {
        response: resGsm.text,
        isFallback: resGsm.isFallback,
      });
    }

    {
      // Test 19: Unverified Office Operating Hours
      const resHours = await callWithRetry('What are your office operating hours?');
      const hoursPass =
        resHours.isFallback &&
        resHours.text === FALLBACK_RESPONSE &&
        resHours.wordCount === 8;

      record('Test 19: Unverified Operating Hours — "What are your office operating hours?" returns exact fallback', hoursPass, {
        response: resHours.text,
        isFallback: resHours.isFallback,
      });
    }

    {
      // Test 20: Unverified Delivery Commitments
      const resDelivery = await callWithRetry('Can you guarantee delivery tomorrow?');
      const deliveryPass =
        resDelivery.isFallback &&
        resDelivery.text === FALLBACK_RESPONSE &&
        resDelivery.wordCount === 8;

      record('Test 20: Unverified Delivery — "Can you guarantee delivery tomorrow?" returns exact fallback', deliveryPass, {
        response: resDelivery.text,
        isFallback: resDelivery.isFallback,
      });
    }

    {
      // Test 21: Unverified Minimum Order Quantity (MOQ)
      const resMoq = await callWithRetry('What is your minimum order quantity?');
      const moqPass =
        resMoq.isFallback &&
        resMoq.text === FALLBACK_RESPONSE &&
        resMoq.wordCount === 8;

      record('Test 21: Unverified MOQ — "What is your minimum order quantity?" returns exact fallback', moqPass, {
        response: resMoq.text,
        isFallback: resMoq.isFallback,
      });
    }

    {
      // Test 22: Unverified Credit Terms
      const resCredit = await callWithRetry('Do you offer 30-day credit?');
      const creditPass =
        resCredit.isFallback &&
        resCredit.text === FALLBACK_RESPONSE &&
        resCredit.wordCount === 8;

      record('Test 22: Unverified Credit Terms — "Do you offer 30-day credit?" returns exact fallback', creditPass, {
        response: resCredit.text,
        isFallback: resCredit.isFallback,
      });
    }

    {
      // Test 23: Unverified Pricing
      const resPrice = await callWithRetry('What is your exact copier paper price?');
      const pricePass =
        resPrice.isFallback &&
        resPrice.text === FALLBACK_RESPONSE &&
        resPrice.wordCount === 8;

      record('Test 23: Unverified Pricing — "What is your exact copier paper price?" returns exact fallback', pricePass, {
        response: resPrice.text,
        isFallback: resPrice.isFallback,
      });
    }

    // -----------------------------------------------------------
    // CATEGORY 4: CONVERSATION MEMORY & TOPIC SWITCHING
    // -----------------------------------------------------------
    {
      // Test 24: Turn 1 -> Turn 2: Art Paper -> "What is it used for?"
      await sleep(1500);
      const memoryHistory = [
        { role: 'user', content: 'Do you sell art paper?' },
        { role: 'model', content: 'Yes, we supply Art Paper (Gloss & Matt - C2S).' },
      ];

      const resMemory = await callWithRetry('What is it used for?', { history: memoryHistory });
      const memoryPass =
        resMemory.success &&
        !resMemory.isFallback &&
        (resMemory.text.toLowerCase().includes('printing') ||
          resMemory.text.toLowerCase().includes('brochures') ||
          resMemory.text.toLowerCase().includes('magazines') ||
          resMemory.text.toLowerCase().includes('catalogs') ||
          resMemory.text.toLowerCase().includes('art paper')) &&
        resMemory.wordCount <= MAX_WORD_COUNT;

      record('Test 24: Conversation Memory — Resolves pronoun "it" to Art Paper', memoryPass, {
        historyProvided: memoryHistory.length,
        response: resMemory.text,
        wordCount: resMemory.wordCount,
        isFallback: resMemory.isFallback,
      });
    }

    {
      // Test 25: Turn 3: After Art Paper turns, customer asks "What is your company name?"
      // Must answer ONLY company name without repeating Art Paper details.
      await sleep(1500);
      const multiTurnHistory = [
        { role: 'user', content: 'Do you sell art paper?' },
        { role: 'model', content: 'Yes, we supply Art Paper (Gloss & Matt - C2S).' },
        { role: 'user', content: 'What is it used for?' },
        { role: 'model', content: 'Art Paper is used for high-definition multi-color printing such as brochures, magazines, and catalogs.' },
      ];

      const resSwitch = await callWithRetry('What is your company name?', { history: multiTurnHistory });
      const switchPass =
        resSwitch.success &&
        !resSwitch.isFallback &&
        resSwitch.text.includes('Reliable Paper Mart') &&
        !resSwitch.text.toLowerCase().includes('art paper') &&
        !resSwitch.text.toLowerCase().includes('brochures') &&
        !resSwitch.text.toLowerCase().includes('copier') &&
        resSwitch.wordCount <= MAX_WORD_COUNT;

      record('Test 25: Topic Switching — Answers ONLY company name without repeating prior Art Paper context', switchPass, {
        response: resSwitch.text,
        wordCount: resSwitch.wordCount,
        isFallback: resSwitch.isFallback,
      });
    }

    // -----------------------------------------------------------
    // CATEGORY 5: HUMAN HANDOFF INTEGRATION
    // -----------------------------------------------------------
    {
      // Test 26: Unsupported question triggers AI fallback and flags human handoff in MongoDB
      const resHandoff = await conversationService.processCustomerMessageWithMemory({
        phoneNumber: TEST_PHONE,
        content: 'What are your office operating hours?',
      });

      const convInDb = await Conversation.findOne({ phoneNumber: TEST_PHONE });

      const handoffPass =
        resHandoff.success === true &&
        resHandoff.isFallback === true &&
        resHandoff.assistantResponse === FALLBACK_RESPONSE &&
        resHandoff.needsHuman === true &&
        convInDb !== null &&
        convInDb.needsHuman === true &&
        convInDb.handoffStatus === 'pending' &&
        convInDb.handoffReason === 'AI fallback: FAQ cannot answer inquiry';

      record('Test 26: Human Handoff — Unsupported inquiry flags needsHuman and handoffStatus: pending in MongoDB', handoffPass, {
        assistantResponse: resHandoff.assistantResponse,
        needsHuman: convInDb?.needsHuman,
        handoffStatus: convInDb?.handoffStatus,
        handoffReason: convInDb?.handoffReason,
      });
    }

    console.log('====================================================');
    const allPassed = results.every((r) => r.pass);
    console.log(`FAQ EXPANSION TEST SUITE FINISHED: ${results.filter((r) => r.pass).length}/${results.length} PASSED`);
    console.log('====================================================\n');

    await Conversation.deleteMany({ phoneNumber: TEST_PHONE });
    await mongoose.disconnect();

    if (!allPassed) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error in FAQ expansion suite:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runFaqExpansionTestSuite().catch((err) => {
  console.error('FAQ expansion test suite fatal error:', err);
  process.exit(1);
});
