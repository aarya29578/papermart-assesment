/**
 * ============================================================================
 * Reliable Paper Mart - Centralized FAQ Knowledge Base
 * ============================================================================
 * Verified business knowledge base extracted from the company's official website:
 * https://reliablepapermart.com/
 *
 * Source URLs:
 * - Home: https://reliablepapermart.com/
 * - About Us: https://reliablepapermart.com/about-us/
 * - Products: https://reliablepapermart.com/products/
 * - Contact Us: https://reliablepapermart.com/contact-us/
 *
 * DISCLAIMER:
 * Company details, product categories, and applications are strictly verified
 * against the official website. Unverified commercial policies (e.g. MOQ, exact
 * pricing, credit terms, delivery guarantees) are not assumed as official policies
 * and are designated for team member handoff. Illustrative demo entries from early
 * development are clearly tagged with source: 'illustrative_demo'.
 * ============================================================================
 */

export const FAQ_DISCLAIMER =
  'Illustrative sample entries and verified official website knowledge base for Reliable Paper Mart.';

export const COMPANY_BASELINE_CONTEXT = `Company: Reliable Paper Mart
Experience: Over 50+ years of profound experience in the paper industry
Headquarters: Mumbai, Maharashtra, India
Supply Network: Pan-India (supply chain all over India)
Registered Office: H-6, Gupta Warehousing Complex, Dapode, Bhiwandi, Thane - 421302
Sales Office: 93, Dadiseth Agiary Lane, Kalbadevi, Mumbai - 400002
Official Phone Numbers: +91 2243471111, +91 2222094033, +91 2222094034
Official Email Address: info@reliablepapermart.com
Core Services: One-stop solution for all paper and board requirements. Helping customers choose the right paper quality for their printing and packaging needs.
Vision: Become an industry leader by 2030, strengthen client relationships, build a robust pan-India supply chain, and expand production capacity.`;

export const faqEntries = [
  // ==========================================================================
  // 1. COMPANY INFORMATION (Verified: Home, About Us, Contact Us)
  // ==========================================================================
  {
    id: 'company-overview',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/',
    question: 'What is Reliable Paper Mart?',
    alternativeQuestions: [
      'Tell me about Reliable Paper Mart',
      'Who is Reliable Paper Mart',
      'What does Reliable Paper Mart do?',
      'Overview of Reliable Paper Mart',
    ],
    answer:
      'Reliable Paper Mart is a premier paper merchant and one-stop solution for all your paper and board requirements, backed by over 50+ years of industry experience. Headquartered in Mumbai with a pan-India supply network, we provide quality paper products and expert consulting.',
    keywords: ['reliable paper mart', 'about company', 'overview', 'who are you', 'one-stop solution', 'paper merchant'],
  },
  {
    id: 'company-name',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/',
    question: 'What is your company name?',
    alternativeQuestions: [
      'What is the company name?',
      'What is your business name?',
      'Who are you?',
      'What is this company called?',
      'Company name',
    ],
    answer: 'Our company name is Reliable Paper Mart.',
    keywords: ['company name', 'business name', 'name', 'who are you', 'called'],
  },
  {
    id: 'company-experience',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/about-us/',
    question: 'How many years of experience does the company have?',
    alternativeQuestions: [
      'How many years of experience do you have?',
      'How much experience does Reliable Paper Mart have?',
      'How long have you been in the paper industry?',
      'How many years in business?',
      'Years of experience',
    ],
    answer:
      'Reliable Paper Mart has over 50+ years of profound experience in the paper and board industry, serving as a trusted one-stop solution for clients across India.',
    keywords: ['years of experience', 'experience', '50+ years', 'how long', 'profound experience', 'established'],
  },
  {
    id: 'company-headquarters',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/',
    question: 'Where is the company headquartered?',
    alternativeQuestions: [
      'Where are you headquartered?',
      'Where is your head office located?',
      'Where is your headquarters?',
      'Head office location',
    ],
    answer: 'Reliable Paper Mart is headquartered in Mumbai, Maharashtra, India, with a robust supply chain network operating across India.',
    keywords: ['headquarters', 'head office', 'headquartered', 'mumbai', 'main office'],
  },
  {
    id: 'pan-india-supply',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/about-us/',
    question: 'Does the company supply products across India?',
    alternativeQuestions: [
      'Do you supply paper across India?',
      'Do you deliver all over India?',
      'Do you have pan-India supply?',
      'Can you supply paper outside Mumbai?',
      'Pan India network',
    ],
    answer:
      'Yes, Reliable Paper Mart supplies paper and board products across India through a robust pan-India supply chain network.',
    keywords: ['across india', 'pan india', 'all over india', 'supply network', 'deliver india', 'outstation'],
  },
  {
    id: 'services-and-consulting',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/',
    question: 'What services does the company provide?',
    alternativeQuestions: [
      'What services do you offer?',
      'What can Reliable Paper Mart do for customers?',
      'What are your services?',
      'How can you help our business?',
    ],
    answer:
      'We are a one-stop solution for paper and board supply. Beyond distributing paper, our highly trained professional team assists customers in choosing the right paper quality for their specific printing and packaging applications at the best pricing possible.',
    keywords: ['services', 'consulting', 'selection', 'one-stop solution', 'paper supply', 'choose quality'],
  },
  {
    id: 'paper-selection-help',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/',
    question: 'Does the company help customers choose paper quality?',
    alternativeQuestions: [
      'Can someone help me select the right paper?',
      'Do you help choose paper quality?',
      'Can you advise on paper selection?',
      'Paper recommendation service',
    ],
    answer:
      'Yes! With our highly trained professional team, we actively guide and help you choose the right paper quality for your printing, packaging, and commercial needs at the best possible pricing.',
    keywords: ['help choose', 'select paper', 'paper quality', 'recommendation', 'guidance', 'advice'],
  },
  {
    id: 'company-vision',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/about-us/',
    question: "What is the company's vision?",
    alternativeQuestions: [
      'What is your vision?',
      'What is the company vision for 2030?',
      'What are your future goals?',
      'Company vision and mission',
    ],
    answer:
      'Our vision is to supply quality paper products with a robust pan-India supply chain. By 2030, we aim to become an industry leader, strengthen client relations, expand production capacity through automation and increased machinery, and establish offices in other states.',
    keywords: ['vision', '2030', 'goals', 'industry leader', 'automation', 'pan-india supply chain'],
  },
  {
    id: 'registered-office-address',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/contact-us/',
    question: "What is the company's registered office address?",
    alternativeQuestions: [
      'What is your registered office address?',
      'Where is your registered office located?',
      'Where is your Bhiwandi office?',
      'Registered office location',
    ],
    answer:
      'Our registered office is located at H-6, Gupta Warehousing Complex, Dapode, Bhiwandi, Thane - 421302, Maharashtra, India.',
    keywords: ['registered office', 'registered address', 'bhiwandi', 'dapode', 'thane', '421302'],
  },
  {
    id: 'sales-office-address',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/contact-us/',
    question: "What is the company's sales office address?",
    alternativeQuestions: [
      'Where is your office located?',
      'Where is your sales office?',
      'What is your office address?',
      'Where are you located in Mumbai?',
      'Where can I visit your sales team?',
      'Office location',
    ],
    answer:
      'Our sales office is located at 93, Dadiseth Agiary Lane, Kalbadevi, Mumbai - 400002, Maharashtra, India.',
    keywords: ['sales office', 'office address', 'where are you located', 'kalbadevi', 'mumbai office', '400002', 'dadiseth agiary'],
  },
  {
    id: 'contact-phone-numbers',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/contact-us/',
    question: 'What are the official contact numbers?',
    alternativeQuestions: [
      'What is your phone number?',
      'What are your telephone numbers?',
      'How can I call you?',
      'Contact numbers',
      'Sales phone number',
    ],
    answer:
      'You can reach Reliable Paper Mart by phone at +91 2243471111, +91 2222094033, or +91 2222094034.',
    keywords: ['phone', 'contact number', 'telephone', 'call', '2243471111', '2222094033', '2222094034'],
  },
  {
    id: 'contact-email-address',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/contact-us/',
    question: 'What is the official email address?',
    alternativeQuestions: [
      'What is your email address?',
      'What is your email?',
      'How can I email your sales desk?',
      'Official email',
    ],
    answer: 'Our official email address is info@reliablepapermart.com.',
    keywords: ['email', 'email address', 'info@reliablepapermart.com', 'mail', 'write to us'],
  },
  {
    id: 'contact-sales-team',
    category: 'Company Information',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/contact-us/',
    question: 'How can I contact your sales team?',
    alternativeQuestions: [
      'How can I get in touch with sales?',
      'How to contact sales?',
      'How do I reach your team?',
      'Sales contact details',
    ],
    answer:
      'You can contact our sales team by phone at +91 2243471111, +91 2222094033, or +91 2222094034, by email at info@reliablepapermart.com, or by visiting our sales office at 93, Dadiseth Agiary Lane, Kalbadevi, Mumbai - 400002.',
    keywords: ['contact sales', 'reach sales', 'sales team', 'get in touch', 'contact details'],
  },

  // ==========================================================================
  // 2. PRODUCT CATALOG OVERVIEW & GENERAL QUERIES
  // ==========================================================================
  {
    id: 'products-overview',
    category: 'Products Overview',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What products do you sell?',
    alternativeQuestions: [
      'What products does Reliable Paper Mart offer?',
      'What paper types do you have?',
      'Tell me what paper grades you supply',
      'What do you sell?',
      'Product list',
      'What paper products does Reliable Paper Mart sell?',
    ],
    answer:
      'We supply five major grades: Writing & Printing Grade (Art Paper, Maplitho, Copier, Creamwove, etc.), Packaging Grade (Duplex, FBB, SBS, Kraft, etc.), Speciality Grade (Glassine, Butter, Release, Sublimation), Industrial Grade (Insulating Kraft, Absorbent, Acid-Free), and Sustainable & Handmade Paper.',
    keywords: ['products', 'sell', 'offer', 'grades', 'product list', 'paper types', 'catalog'],
  },
  {
    id: 'food-packaging-products',
    category: 'Products Overview',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What products are used for food packaging?',
    alternativeQuestions: [
      'Do you have food-grade paper?',
      'What paper do you have for food packaging?',
      'Food packaging paper options',
      'Do you supply food packaging materials?',
    ],
    answer:
      'For food packaging, we supply certified Food Grade Paper & Board (grease- and moisture-resistant for direct contact), Greaseproof Paper (for bakery and fast food), Butter Paper (heat-resistant for baking and wrapping), and M.G. Bleached Kraft Paper (for food delivery bags and pouches).',
    keywords: ['food packaging', 'food grade', 'greaseproof', 'butter paper', 'bakery', 'direct food contact'],
  },
  {
    id: 'sustainable-handmade-overview',
    category: 'Products Overview',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'Do you sell handmade paper?',
    alternativeQuestions: [
      'Do you have eco-friendly or handmade paper?',
      'What handmade paper do you offer?',
      'Sustainable paper products',
      'Eco-friendly paper options',
    ],
    answer:
      'Yes, we offer an eco-grade Sustainable & Handmade Paper collection including Seed/Plantable Paper, 100% Cotton Rag Paper, Banana Fiber Paper, Grass Paper, and sanitized Elephant/Animal Dung Paper.',
    keywords: ['handmade paper', 'sustainable paper', 'eco-friendly', 'seed paper', 'plantable', 'cotton rag'],
  },

  // ==========================================================================
  // 3. CATEGORY A: WRITING & PRINTING GRADE (W&P)
  // ==========================================================================
  {
    id: 'art-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'Do you sell art paper?',
    alternativeQuestions: [
      'Do you have art paper?',
      'What is Art Paper?',
      'What is Art Paper used for?',
      'Tell me about art paper',
      'Art paper gloss and matt',
    ],
    answer:
      'Yes, we supply Art Paper (Gloss & Matt – C2S), which is a double-side coated fine graphic paper engineered for high-definition multi-color printing such as brochures, magazines, and catalogs.',
    keywords: ['art paper', 'gloss art paper', 'matt art paper', 'c2s', 'fine graphic', 'multi-color printing'],
  },
  {
    id: 'art-card',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Art Card?',
    alternativeQuestions: [
      'Do you sell art card?',
      'What is Art Card used for?',
      'Art card gloss and matt',
    ],
    answer:
      'Art Card (Gloss & Matt – C2S) is a high-GSM double-side coated graphic board used for book covers, luxury product packaging, greeting cards, and premium promotional collateral.',
    keywords: ['art card', 'c2s board', 'book covers', 'cards', 'luxury packaging'],
  },
  {
    id: 'chromo-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Chromo Paper?',
    alternativeQuestions: [
      'Do you sell chromo paper?',
      'What is Chromo Paper used for?',
      'Chromo paper c1s',
    ],
    answer:
      'Chromo Paper (C1S) is a single-side coated paper engineered specifically for wet-glue labels, stickers, wall calendars, and commercial posters.',
    keywords: ['chromo paper', 'c1s', 'stickers', 'labels', 'posters', 'wet-glue'],
  },
  {
    id: 'cast-coated-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Mirror Coated or Cast Coated Paper?',
    alternativeQuestions: [
      'Do you supply Cast Coated Paper?',
      'What is Mirror Coated Paper used for?',
      'Cast coated board',
    ],
    answer:
      'Mirror Coated / Cast Coated Paper & Board features an ultra-high gloss, mirror-finish surface designed for premium product labels, perfume cartons, and luxury cosmetic boxes.',
    keywords: ['cast coated', 'mirror coated', 'mirror-finish', 'cosmetics', 'perfume boxes', 'ultra-high gloss'],
  },
  {
    id: 'maplitho-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Maplitho?',
    alternativeQuestions: [
      'What is Maplitho paper used for?',
      'Do you sell woodfree paper?',
      'Do you supply Maplitho paper?',
      'Tell me about Maplitho',
    ],
    answer:
      'Woodfree Paper / Maplitho is a premium chemical pulp paper with high brightness and opacity, widely used for book publishing, corporate stationery, and commercial printing.',
    keywords: ['maplitho', 'woodfree paper', 'publishing', 'commercial printing', 'brightness', 'opacity'],
  },
  {
    id: 'creamwove-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Creamwove paper?',
    alternativeQuestions: [
      'Do you sell creamwove paper?',
      'What is creamwove used for?',
    ],
    answer:
      'Creamwove is an everyday high-bulk uncoated paper widely utilized for school notebooks, educational textbooks, diaries, and commercial bill books.',
    keywords: ['creamwove', 'notebooks', 'textbooks', 'bill books', 'uncoated', 'high-bulk'],
  },
  {
    id: 'copier-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'Do you sell copier paper?',
    alternativeQuestions: [
      'Do you have copier paper?',
      'What copier paper do you offer?',
      'Office printing paper',
      'Do you supply A4 paper?',
    ],
    answer:
      'Yes, we supply cut-size Copier Paper in A4, A3, and Foolscap sizes from both reputed Indian and imported mills, suitable for high-speed laser and inkjet office printing.',
    keywords: ['copier paper', 'a4', 'a3', 'foolscap', 'office printing', 'laser', 'inkjet', 'xerox'],
  },
  {
    id: 'colour-printing-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Colour Printing Paper?',
    alternativeQuestions: [
      'Do you sell tinted paper?',
      'Do you supply colour printing paper?',
    ],
    answer:
      'Colour Printing Paper is tinted and dyed woodfree paper designed for inserts, product leaflets, promotional circulars, and color-coded multi-part business forms.',
    keywords: ['colour printing paper', 'tinted paper', 'dyed paper', 'leaflets', 'inserts', 'business forms'],
  },
  {
    id: 'bond-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Bond Paper?',
    alternativeQuestions: [
      'Do you sell bond paper?',
      'What is bond paper used for?',
      'Letterhead paper',
    ],
    answer:
      'Bond Paper is a premium textured or smooth paper with high cotton or chemical woodfree content and watermarking, ideal for corporate letterheads, agreements, and legal documents.',
    keywords: ['bond paper', 'letterhead', 'watermark', 'corporate', 'legal documents', 'cotton paper'],
  },
  {
    id: 'ledger-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Ledger Paper?',
    alternativeQuestions: [
      'Do you supply ledger paper?',
      'What is ledger paper used for?',
    ],
    answer:
      'Ledger Paper is a durable, high tear-resistance paper designed for accounting books, registry ledgers, and permanent archival legal records.',
    keywords: ['ledger paper', 'accounting registers', 'permanent records', 'tear-resistance', 'ledgers'],
  },
  {
    id: 'bible-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Bible Paper or Lightweight Printing Paper?',
    alternativeQuestions: [
      'Do you sell bible paper?',
      'What is lightweight printing paper used for?',
      'Pharma insert paper',
    ],
    answer:
      'Bible Paper / Lightweight Printing Paper is ultra-low GSM, highly opaque paper engineered for holy books, comprehensive dictionaries, and folded pharmaceutical literature inserts.',
    keywords: ['bible paper', 'lightweight paper', 'ultra-low gsm', 'pharma inserts', 'dictionaries', 'opaque'],
  },
  {
    id: 'ivory-card',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Ivory Card?',
    alternativeQuestions: [
      'Do you sell ivory card?',
      'What is ivory board used for?',
      'Visiting card paper',
    ],
    answer:
      'Ivory Card is a premium uncoated board offering exceptional surface smoothness and stiffness, widely chosen for visiting cards, certificates, greeting cards, and luxury invitations.',
    keywords: ['ivory card', 'visiting cards', 'business cards', 'certificates', 'invitations', 'smoothness'],
  },
  {
    id: 'bristol-board',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Bristol Board?',
    alternativeQuestions: [
      'Do you sell brief card?',
      'What is bristol board used for?',
    ],
    answer:
      'Bristol Board / Brief Card is a heavyweight, multi-ply card stock used for index cards, tags, file covers, and drawing or presentation folders.',
    keywords: ['bristol board', 'brief card', 'index cards', 'tags', 'file covers', 'heavyweight'],
  },
  {
    id: 'mg-card-paper',
    category: 'Writing & Printing Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is M.G. Card and M.G. Paper?',
    alternativeQuestions: [
      'Do you sell machine glazed paper?',
      'What is MG paper used for?',
    ],
    answer:
      'M.G. (Machine Glazed) Card and Paper features one smooth, glossy glazed side and one rough reverse side, ideal for specialized packaging, wrappers, and laminations.',
    keywords: ['mg paper', 'mg card', 'machine glazed', 'glossy side', 'wrappers'],
  },

  // ==========================================================================
  // 4. CATEGORY B: PACKAGING GRADE (Paperboard & Flexible Packaging Paper)
  // ==========================================================================
  {
    id: 'fbb-board',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Folding Box Board (FBB)?',
    alternativeQuestions: [
      'Do you supply FBB?',
      'What is GC1 or GC2 board?',
      'What is FBB board used for?',
    ],
    answer:
      'Folding Box Board (F.B.B. / GC1 & GC2) is a virgin fiber board with a bleached chemical pulp top liner and mechanical middle ply, engineered for FMCG packaging and pharmaceutical cartons.',
    keywords: ['fbb', 'folding box board', 'gc1', 'gc2', 'virgin fiber', 'pharma cartons', 'fmcg'],
  },
  {
    id: 'sbs-board',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Solid Bleached Sulphate (SBS)?',
    alternativeQuestions: [
      'Do you supply SBS board?',
      'What is SBS board used for?',
    ],
    answer:
      'Solid Bleached Sulphate (S.B.S.) Board is a 100% virgin bleached chemical pulp board crafted for luxury cosmetics, perfume packaging, pharmaceutical cartons, and high-end food boxes.',
    keywords: ['sbs', 'solid bleached sulphate', '100% virgin pulp', 'cosmetic packaging', 'luxury packaging'],
  },
  {
    id: 'duplex-board',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'Do you sell Duplex Board?',
    alternativeQuestions: [
      'What is Duplex Board?',
      'Do you supply duplex board?',
      'What is duplex board used for?',
      'Tell me about duplex board LWC HWC',
    ],
    answer:
      'Yes, we supply Duplex Board (LWC / HWC) in both Grey Back and White Back formats, widely used for commercial packaging boxes, FMCG mono-cartons, garment boxes, and matchboxes.',
    keywords: ['duplex board', 'grey back', 'white back', 'lwc', 'hwc', 'mono-cartons', 'packaging boxes'],
  },
  {
    id: 'white-back-board',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is White Back Board (WBB)?',
    alternativeQuestions: [
      'Do you supply white back board?',
      'What is WBB board?',
    ],
    answer:
      'White Back Board (WBB) is a coated packaging board featuring a clean white reverse ply, engineered for premium inner-box presentation and retail displays.',
    keywords: ['white back board', 'wbb', 'white reverse', 'inner-box', 'retail packaging'],
  },
  {
    id: 'virgin-kraft-liner',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'Do you supply Kraft Paper?',
    alternativeQuestions: [
      'Do you sell kraft paper?',
      'What is Virgin Kraft Liner Paper and Board?',
      'Corrugation paper options',
      'What kraft paper do you have?',
    ],
    answer:
      'Yes, we supply Virgin Kraft Liner Paper & Board with high burst-factor (BF) unbleached virgin pulp, engineered for heavy-duty corrugated shipping cartons and packaging boxes.',
    keywords: ['kraft paper', 'virgin kraft liner', 'corrugation', 'shipping boxes', 'burst-factor', 'bf'],
  },
  {
    id: 'mg-brown-kraft',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is M.G. Brown Kraft Paper?',
    alternativeQuestions: [
      'Do you supply MG brown kraft?',
      'Kraft paper for grocery bags',
    ],
    answer:
      'M.G. Brown Kraft Paper is machine-glazed unbleached kraft paper designed for grocery bags, retail shopping sacks, and protective industrial wrapping.',
    keywords: ['mg brown kraft', 'grocery bags', 'shopping sacks', 'wrapping', 'machine glazed'],
  },
  {
    id: 'mf-brown-kraft',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is M.F. Brown Kraft Paper?',
    alternativeQuestions: [
      'Do you sell MF brown kraft paper?',
      'Kraft paper for multiwall bags',
    ],
    answer:
      'M.F. Brown Kraft Paper is machine-finished smooth unbleached kraft paper engineered for industrial multiwall cement/chemical sacks and protective lamination.',
    keywords: ['mf brown kraft', 'multiwall bags', 'lamination', 'machine finished', 'industrial bags'],
  },
  {
    id: 'mg-bleached-kraft',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is M.G. Bleached Kraft Paper?',
    alternativeQuestions: [
      'Do you supply bleached kraft paper?',
      'White kraft paper for food bags',
    ],
    answer:
      'M.G. Bleached Kraft Paper is high-strength white glazed kraft paper manufactured for premium food delivery bags, pouches, and branded retail packaging.',
    keywords: ['mg bleached kraft', 'white kraft', 'food delivery bags', 'pouches', 'glazed white'],
  },
  {
    id: 'mf-bleached-kraft',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is M.F. Bleached Kraft Paper?',
    alternativeQuestions: [
      'Do you sell MF bleached kraft?',
      'Medical packaging kraft paper',
    ],
    answer:
      'M.F. Bleached Kraft Paper is an even-finish white kraft paper engineered for sterile medical pouches, pharmaceutical wrappers, and flexible laminates.',
    keywords: ['mf bleached kraft', 'medical pouches', 'flexible laminates', 'white kraft'],
  },
  {
    id: 'food-grade-board',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Food Grade Paper and Board?',
    alternativeQuestions: [
      'Do you have food grade paper?',
      'Certified food packaging paper',
    ],
    answer:
      'Food Grade Paper & Board comprises certified grease- and moisture-resistant barrier boards approved for direct food contact in food boxes, trays, and takeaway containers.',
    keywords: ['food grade paper', 'food board', 'grease resistant', 'direct food contact', 'takeaway boxes'],
  },
  {
    id: 'greaseproof-paper',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Greaseproof Paper?',
    alternativeQuestions: [
      'Do you sell greaseproof paper?',
      'Paper for butter and bakery wrap',
    ],
    answer:
      'Greaseproof Paper is an impermeable barrier paper resistant to oil and fats, widely used for bakery wraps, butter packaging, and fast food basket liners.',
    keywords: ['greaseproof paper', 'bakery', 'butter wrap', 'oil resistant', 'fast food liners'],
  },
  {
    id: 'mf-tissue-paper',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is M.F. Tissue Paper?',
    alternativeQuestions: [
      'Do you sell wrapping tissue paper?',
      'Protective interleaving tissue',
    ],
    answer:
      'M.F. Tissue Paper is a soft, acid-free protective interleaving tissue designed for wrapping footwear, garments, leather goods, and luxury jewelry.',
    keywords: ['mf tissue', 'wrapping tissue', 'interleaving tissue', 'garment wrapping', 'shoe wrapping'],
  },
  {
    id: 'mg-poster-paper',
    category: 'Packaging Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is M.G. Poster Paper?',
    alternativeQuestions: [
      'Do you sell MG poster paper?',
      'What is MG poster paper used for?',
    ],
    answer:
      'M.G. Poster Paper is a lightweight, high-tensile glazed paper used for bidi wrapping, bottle labels, bangle packaging, and flexible packaging laminations.',
    keywords: ['mg poster', 'bidi wrapping', 'bottle labels', 'glazed paper', 'flexible lamination'],
  },

  // ==========================================================================
  // 5. CATEGORY C: SPECIALITY GRADE
  // ==========================================================================
  {
    id: 'glassine-paper',
    category: 'Speciality Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Glassine Paper?',
    alternativeQuestions: [
      'Do you sell glassine paper?',
      'What is glassine paper used for?',
    ],
    answer:
      'Glassine Paper is a high-density, greaseproof, air-tight, semi-transparent paper used for pharmaceutical sachets, window envelopes, and stamp preservation.',
    keywords: ['glassine paper', 'transparent paper', 'pharma sachets', 'window envelopes', 'greaseproof'],
  },
  {
    id: 'butter-paper',
    category: 'Speciality Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Butter Paper?',
    alternativeQuestions: [
      'Do you sell butter paper?',
      'Baking parchment paper',
    ],
    answer:
      'Butter Paper is a non-stick, heat-resistant parchment-type paper designed for commercial baking, confectionery, and food wrapping.',
    keywords: ['butter paper', 'baking paper', 'confectionery', 'non-stick', 'heat resistant'],
  },
  {
    id: 'release-paper',
    category: 'Speciality Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Release Paper?',
    alternativeQuestions: [
      'Do you sell silicone release paper?',
      'Release liner paper',
    ],
    answer:
      'Release Paper (Silicone Coated) is base paper treated with silicone coating, used as release backing for adhesive tapes, sanitary liners, and label matrixes.',
    keywords: ['release paper', 'silicone coated', 'adhesive backing', 'label release', 'sanitary liners'],
  },
  {
    id: 'gumming-sheet',
    category: 'Speciality Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Gumming Sheet or Self-Adhesive Base?',
    alternativeQuestions: [
      'Do you sell sticker paper?',
      'Self adhesive paper',
      'Barcode label paper',
    ],
    answer:
      'Gumming Sheet / Self-Adhesive Base is pre-glued adhesive paper engineered for barcode stickers, logistics shipping labels, and consumer product labeling.',
    keywords: ['gumming sheet', 'self-adhesive base', 'sticker paper', 'barcode labels', 'logistics stickers'],
  },
  {
    id: 'carbon-paper',
    category: 'Speciality Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Carbon Paper and OTC Base Paper?',
    alternativeQuestions: [
      'Do you sell carbon paper?',
      'One Time Carbon paper',
    ],
    answer:
      'Carbon Paper & One Time Carbon (OTC) Base Paper is specialized lightweight carbonizing tissue engineered for instant duplicate and triplicate copy sets.',
    keywords: ['carbon paper', 'otc', 'one time carbon', 'duplicate sets', 'carbonizing tissue'],
  },
  {
    id: 'sublimation-paper',
    category: 'Speciality Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Sublimation Paper?',
    alternativeQuestions: [
      'Do you sell heat transfer sublimation paper?',
      'Textile sublimation paper',
    ],
    answer:
      'Sublimation Paper is specially coated heat-transfer paper used for dye-sublimation printing on apparel textiles, ceramics, mugs, and promotional items.',
    keywords: ['sublimation paper', 'heat transfer', 'textile printing', 'dye-sublimation', 'ceramics'],
  },
  {
    id: 'sulphite-paper',
    category: 'Speciality Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Sulphite Paper?',
    alternativeQuestions: [
      'Do you sell sulphite paper?',
      'Food wrapping sulphite paper',
    ],
    answer:
      'Sulphite Paper is a high-purity glazed paper utilized for specialized confectionery, fruit wrapping, and food protection.',
    keywords: ['sulphite paper', 'fruit wrapping', 'confectionery', 'high-purity glazed'],
  },

  // ==========================================================================
  // 6. CATEGORY D: INDUSTRIAL GRADE
  // ==========================================================================
  {
    id: 'electric-insulating-kraft',
    category: 'Industrial Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Electric Grade Insulating Kraft Paper?',
    alternativeQuestions: [
      'Do you sell insulating paper?',
      'Transformer insulation paper',
    ],
    answer:
      'Electric Grade Insulating Kraft Paper is high-purity dielectric paper free of metallic impurities, engineered for electrical transformer windings and capacitor insulation.',
    keywords: ['insulating kraft', 'dielectric', 'transformer windings', 'capacitor insulation', 'electrical paper'],
  },
  {
    id: 'absorbent-kraft',
    category: 'Industrial Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Absorbent Kraft Paper?',
    alternativeQuestions: [
      'Do you supply absorbent kraft?',
      'Kraft paper for Sunmica laminates',
    ],
    answer:
      'Absorbent Kraft Paper is high-porosity paper with controlled resin absorbency, engineered as the core base for decorative and industrial laminates (Sunmica).',
    keywords: ['absorbent kraft', 'sunmica base', 'laminates', 'resin absorbency', 'high-porosity'],
  },
  {
    id: 'acid-free-paper',
    category: 'Industrial Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Acid-Free Paper?',
    alternativeQuestions: [
      'Do you supply archival acid-free paper?',
      'Metal interleaving paper',
    ],
    answer:
      'Acid-Free Paper is chemically neutralized, long-aging paper engineered for permanent document archives, fine art preservation, and metal interleaving.',
    keywords: ['acid-free paper', 'archives', 'art preservation', 'metal interleaving', 'long-aging'],
  },
  {
    id: 'crepe-tissue',
    category: 'Industrial Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Crepe Tissue?',
    alternativeQuestions: [
      'Do you sell crepe tissue?',
      'Elastic cable wrapping paper',
    ],
    answer:
      'Crepe Tissue is elasticized, high-stretch paper used for electrical cable wrapping, medical bandaging, and industrial tape backings.',
    keywords: ['crepe tissue', 'high-stretch', 'cable wrapping', 'medical bandaging', 'tape backings'],
  },
  {
    id: 'mg-tissue-parent-rolls',
    category: 'Industrial Grade',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What are M.G. Tissue and Hygiene Parent Rolls?',
    alternativeQuestions: [
      'Do you sell hygiene tissue parent rolls?',
      'Napkin and facial tissue rolls',
    ],
    answer:
      'M.G. Tissue & Hygiene Parent Rolls are lightweight soft tissue parent reels converted into paper napkins, facial tissues, and kitchen towels.',
    keywords: ['hygiene tissue', 'parent rolls', 'napkins', 'facial tissues', 'kitchen towels', 'mg tissue'],
  },

  // ==========================================================================
  // 7. CATEGORY E: SUSTAINABLE & HANDMADE PAPER (ECO-GRADES)
  // ==========================================================================
  {
    id: 'seed-plantable-paper',
    category: 'Sustainable & Handmade Paper',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Seed or Plantable Paper?',
    alternativeQuestions: [
      'Do you sell seed paper?',
      'Do you have plantable paper?',
      'Biodegradable seed embedded paper',
    ],
    answer:
      'Seed / Plantable Paper is biodegradable handmade paper embedded with live plant seeds that can be planted in soil to sprout herbs or flowers after use.',
    keywords: ['seed paper', 'plantable paper', 'biodegradable', 'plant seeds', 'sprout', 'handmade'],
  },
  {
    id: 'cotton-rag-paper',
    category: 'Sustainable & Handmade Paper',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Cotton Rag Paper?',
    alternativeQuestions: [
      'Do you sell cotton rag paper?',
      'Handmade watercolor paper',
      'Textile fiber paper',
    ],
    answer:
      'Cotton Rag Paper is made from 100% recycled cotton textile fiber, offering luxurious texture and archival durability for luxury wedding invitations, certificates, and watercolor art.',
    keywords: ['cotton rag paper', '100% cotton', 'wedding invitations', 'certificates', 'watercolor', 'handmade'],
  },
  {
    id: 'banana-fiber-paper',
    category: 'Sustainable & Handmade Paper',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Banana Fiber Paper?',
    alternativeQuestions: [
      'Do you sell banana fiber paper?',
      'Tree-free agricultural paper',
    ],
    answer:
      'Banana Fiber Paper is an eco-friendly, tree-free paper crafted from renewable agricultural banana bark byproduct fibers.',
    keywords: ['banana fiber paper', 'tree-free', 'agricultural byproduct', 'eco-friendly', 'handmade'],
  },
  {
    id: 'grass-paper',
    category: 'Sustainable & Handmade Paper',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Grass Paper?',
    alternativeQuestions: [
      'Do you sell grass paper?',
      'Eco-friendly grass fiber paper',
    ],
    answer:
      'Grass Paper is an eco-friendly blend incorporating raw sun-dried grass fiber, providing an organic natural look and reduced environmental footprint.',
    keywords: ['grass paper', 'grass fiber', 'eco-friendly', 'natural look', 'sun-dried grass'],
  },
  {
    id: 'elephant-animal-dung-paper',
    category: 'Sustainable & Handmade Paper',
    source: 'official_website',
    sourceUrl: 'https://reliablepapermart.com/products/',
    question: 'What is Elephant or Animal Dung Paper?',
    alternativeQuestions: [
      'Do you sell elephant dung paper?',
      'Animal dung recycled paper',
    ],
    answer:
      'Elephant / Animal Dung Paper is a sanitized, odorless, zero-wood pulp recycled organic waste paper promoting circular environmental conservation.',
    keywords: ['elephant dung paper', 'animal dung', 'sanitized', 'zero-wood pulp', 'circular economy'],
  },

  // ==========================================================================
  // 8. UNVERIFIED ILLUSTRATIVE DEMO ASSUMPTIONS (Kept for Phase 4 Compatibility)
  // ==========================================================================
  {
    id: 'demo-copier-gsm',
    category: 'Illustrative Demo Policies (Unverified)',
    source: 'illustrative_demo',
    sourceUrl: null,
    question: 'What GSM options are available for standard copier paper in the demo catalog?',
    alternativeQuestions: ['What GSM options do you have for copier paper?'],
    answer:
      'In our demo catalog, copier paper is listed in 70 GSM, 75 GSM, and 80 GSM options in A4 and A3 sizes with 500 sheets per ream.',
    keywords: ['gsm', 'copier gsm', '70 gsm', '75 gsm', '80 gsm', 'reams'],
  },
  {
    id: 'demo-minimum-order-quantity',
    category: 'Illustrative Demo Policies (Unverified)',
    source: 'illustrative_demo',
    sourceUrl: null,
    question: 'What is the Minimum Order Quantity (MOQ) in the illustrative demo?',
    alternativeQuestions: ['Demo MOQ'],
    answer:
      'Note: Official company minimum order quantities are custom-quoted by our sales desk. In early test demonstrations, standard copier paper was illustrated at 10 reams.',
    keywords: ['moq', 'minimum order quantity', 'illustrative moq'],
  },
  {
    id: 'demo-operating-hours',
    category: 'Illustrative Demo Policies (Unverified)',
    source: 'illustrative_demo',
    sourceUrl: null,
    question: 'What are your office working hours?',
    alternativeQuestions: [
      'What are your business operating hours?',
      'What are your hours?',
      'Working hours',
    ],
    answer:
      'Our office and warehouse operate Monday to Saturday from 9:30 AM to 6:30 PM IST. We are closed on Sundays and national public holidays.',
    keywords: ['hours', 'timings', 'working hours', 'operating hours', 'open', 'timing'],
  },
  {
    id: 'demo-delivery-locations',
    category: 'Illustrative Demo Policies (Unverified)',
    source: 'illustrative_demo',
    sourceUrl: null,
    question: 'Where do you deliver in the demo catalog?',
    alternativeQuestions: ['Delivery locations demo'],
    answer:
      'Reliable Paper Mart delivers across India, serving major industrial hubs such as Mumbai, Pune, Ahmedabad, Delhi-NCR, and Bangalore via trusted transport partners.',
    keywords: ['delivery locations', 'cities', 'mumbai', 'pune', 'ahmedabad', 'delhi', 'bangalore'],
  },
];

/**
 * Returns formatted text of all FAQ entries for backwards compatibility
 * @returns {string}
 */
export function getFormattedFaqText() {
  return faqEntries
    .map(
      (entry, index) =>
        `[FAQ ${index + 1}] Category: ${entry.category} (${entry.source})\nQuestion: ${entry.question}\nAnswer: ${entry.answer}`
    )
    .join('\n\n');
}

/**
 * Normalizes text into lower-case alphanumeric tokens, omitting stop words
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should',
    'would', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'our', 'your', 'my', 'their',
    'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how', 'tell', 'me', 'please',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

/**
 * Identifies high-intent queries that should target specific FAQ entries
 * @param {string} query
 * @returns {string|null} - High priority entry ID or category
 */
function detectDirectIntent(query) {
  const q = query.toLowerCase();

  // 1. Direct company name intent
  if (
    /^(what\s+is\s+(your\s+|the\s+)?company(\s+name)?|what\s+is\s+your\s+name|who\s+are\s+you|company\s+name\??)$/i.test(
      q.trim()
    ) ||
    (/(company|business)\s+name/i.test(q) && !q.includes('products') && !q.includes('sell'))
  ) {
    return 'company-name';
  }

  // 2. Years of experience intent
  if (/experience|years\s+in\s+business|how\s+long\s+have\s+you\s+been/i.test(q)) {
    return 'company-experience';
  }

  // 3. Headquarters intent
  if (/headquarter|head\s+office/i.test(q)) {
    return 'company-headquarters';
  }

  // 4. Registered address intent
  if (/registered\s+(office|address)|bhiwandi|dapode/i.test(q)) {
    return 'registered-office-address';
  }

  // 5. Sales office address intent (Exclude if question is asking about working hours or timings)
  if (
    (/sales\s+office|where\s+are\s+you\s+located|where\s+is\s+your\s+office|visit\s+your\s+office|kalbadevi/i.test(q)) &&
    !/hours|timings|working/i.test(q)
  ) {
    return 'sales-office-address';
  }

  // 6. Contact numbers / phone intent
  if (/phone|telephone|call\s+you|contact\s+numbers?/i.test(q)) {
    return 'contact-phone-numbers';
  }

  // 7. Email address intent
  if (/email|email\s+address|mail\s+address/i.test(q)) {
    return 'contact-email-address';
  }

  // 8. Contact sales team general intent
  if (/contact\s+(sales|team|details)|reach\s+(sales|team)|get\s+in\s+touch|how\s+(can|do)\s+i\s+contact/i.test(q)) {
    return 'contact-sales-team';
  }

  // 9. Vision intent
  if (/vision|2030|future\s+goals/i.test(q)) {
    return 'company-vision';
  }

  // 10. Paper selection help intent
  if (/help\s+(me\s+)?choose|select\s+the\s+right\s+paper|paper\s+selection/i.test(q)) {
    return 'paper-selection-help';
  }

  // 11. Pan-India supply intent
  if (/across\s+india|pan[- ]?india|all\s+over\s+india|deliver\s+outside\s+mumbai/i.test(q)) {
    return 'pan-india-supply';
  }

  // 12. General products list intent
  if (/what\s+products\s+do\s+you\s+sell|what\s+do\s+you\s+sell|what\s+products\s+does|types\s+of\s+paper/i.test(q)) {
    return 'products-overview';
  }

  // 13. Food packaging intent
  if (/food\s+packaging|food[- ]grade|bakery\s+paper/i.test(q)) {
    return 'food-packaging-products';
  }

  // 14. Handmade paper intent
  if (/handmade\s+paper|sustainable\s+paper|seed\s+paper|cotton\s+rag/i.test(q)) {
    return 'sustainable-handmade-overview';
  }

  return null;
}

/**
 * Checks whether a query specifically asks for unverified commercial policies
 * (e.g., MOQ, exact pricing, operating hours, delivery tomorrow, copier GSM options)
 * that have not been verified against the official website.
 * @param {string} cleanQuery
 * @returns {boolean}
 */
function isUnverifiedPolicyInquiry(cleanQuery) {
  // 1. Operating hours / timings
  if (/\b(hours|timings|working\s+hours|operating\s+hours|closing\s+time|opening\s+time)\b/i.test(cleanQuery)) {
    return true;
  }
  // 2. Minimum order quantity (MOQ)
  if (/\b(minimum\s+order(\s+quantity)?|moq)\b/i.test(cleanQuery)) {
    return true;
  }
  // 3. Delivery guarantees / next-day delivery
  if (/\b(guarantee\s+delivery|deliver(y)?\s+tomorrow|deliver(y)?\s+next\s+day|same\s+day\s+delivery)\b/i.test(cleanQuery)) {
    return true;
  }
  // 4. Exact pricing inquiries
  if (/\b(exact\s+price|copier\s+paper\s+price|price\s+list|cost\s+per\s+ream|rate\s+per\s+ton)\b/i.test(cleanQuery)) {
    return true;
  }
  // 5. Credit terms
  if (/\b(30[- ]day\s+credit|credit\s+terms|payment\s+credit)\b/i.test(cleanQuery)) {
    return true;
  }
  // 6. Specific unverified Copier GSM queries (e.g. "What GSM options do you have for copier paper?")
  if (/\bgsm\s+options\b|\bwhat\s+gsm\b|\bgsm\s+available\s+for\s+copier\b/i.test(cleanQuery)) {
    return true;
  }
  return false;
}

/**
 * Retrieves the most relevant FAQ entries for a given customer query
 * @param {string} query
 * @param {Object} [options]
 * @param {number} [options.maxEntries=5]
 * @param {Array<Object>} [options.history] - Prior messages to assist pronoun resolution
 * @returns {Array<Object>}
 */
export function getRelevantFaqEntries(query, options = {}) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();
  const maxEntries = options.maxEntries || 5;

  // Immediately filter out all entries with source: 'illustrative_demo'.
  // Only search verified official entries for customer-facing retrieval.
  const officialCandidates = faqEntries.filter((e) => e.source === 'official_website');

  // If query asks for known unverified commercial policies (e.g., MOQ, operating hours, delivery guarantees, copier GSM options),
  // return empty array so that exact fallback & human handoff are triggered.
  if (isUnverifiedPolicyInquiry(cleanQuery)) {
    return [];
  }

  // 1. Check for explicit intent match FIRST
  const directIntent = detectDirectIntent(cleanQuery);
  if (directIntent) {
    const directEntry = officialCandidates.find((e) => e.id === directIntent);
    if (directEntry) {
      // Direct intent matched: return ONLY the direct entry!
      // Do not attach related entries or category clutter.
      return [directEntry];
    }
  }

  // 2. Tokenize query
  const queryTokens = tokenize(cleanQuery);

  // If query is short or uses pronouns like "what is it used for?", extract prior context
  let historyTokens = [];
  if (
    queryTokens.length <= 4 &&
    Array.isArray(options.history) &&
    options.history.length > 0 &&
    (/\b(it|they|them|this|that|its|these|those)\b/i.test(cleanQuery) || /used\s+for/i.test(cleanQuery))
  ) {
    // Collect product names mentioned in recent history
    const recentHistoryText = options.history
      .map((h) => h.content || h.text || '')
      .join(' ');
    historyTokens = tokenize(recentHistoryText);
  }

  // 3. Score every verified official FAQ entry
  const scored = officialCandidates.map((entry) => {
    let score = 0;
    const entryQ = entry.question.toLowerCase();
    const entryCat = entry.category.toLowerCase();
    const entryAns = entry.answer.toLowerCase();

    // Exact question match
    if (entryQ === cleanQuery) score += 200;
    if (entry.alternativeQuestions?.some((alt) => alt.toLowerCase() === cleanQuery)) score += 180;

    // Phrase matches
    if (entryQ.includes(cleanQuery)) score += 80;
    if (entry.alternativeQuestions?.some((alt) => alt.toLowerCase().includes(cleanQuery))) score += 70;

    // Token overlap with question
    for (const token of queryTokens) {
      if (entryQ.includes(token)) score += 15;
      if (entry.keywords?.some((k) => k.toLowerCase().includes(token))) score += 12;
      if (entryCat.includes(token)) score += 8;
      if (entryAns.includes(token)) score += 4;
    }

    // Token overlap with history (lower weight)
    for (const hToken of historyTokens) {
      if (entryQ.includes(hToken)) score += 10;
      if (entry.keywords?.some((k) => k.toLowerCase().includes(hToken))) score += 8;
    }

    return { entry, score };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.score - a.score);

  // Filter entries that have a positive score
  const matches = scored.filter((s) => s.score > 0).map((s) => s.entry);

  if (matches.length > 0) {
    return matches.slice(0, maxEntries);
  }

  // When no official entry matches the customer's query, return empty array.
  // Never inject unrelated generic overview entries.
  return [];
}

/**
 * Returns formatted text of relevant FAQ entries including baseline company context
 * @param {string} query
 * @param {Object} [options]
 * @returns {string}
 */
export function getRelevantFaqContext(query, options = {}) {
  const relevantEntries = getRelevantFaqEntries(query, options);

  if (!relevantEntries || relevantEntries.length === 0) {
    return '';
  }

  const formattedEntries = relevantEntries
    .map(
      (entry, idx) =>
        `[FACT ${idx + 1}] Category: ${entry.category}\nQuestion: ${entry.question}\nAnswer: ${entry.answer}`
    )
    .join('\n\n');

  // When a direct intent matched (or only 1 company information fact), return ONLY that fact.
  // Do not attach baseline context or unrelated company facts.
  const isDirectSingleMatch =
    relevantEntries.length === 1 && relevantEntries[0].category === 'Company Information';

  if (isDirectSingleMatch) {
    return formattedEntries;
  }

  return `COMPANY BACKGROUND:\n${COMPANY_BASELINE_CONTEXT}\n\nRELEVANT VERIFIED KNOWLEDGE:\n${formattedEntries}`;
}

export default faqEntries;
