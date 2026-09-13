import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Special headers for Service Worker and Web Manifest
app.get('/sw.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

app.get('/manifest.webmanifest', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'manifest.webmanifest'));
});

app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/logo.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'logo.png'));
});

app.get('/og-image.png', (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'og-image.png'));
});

app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.use(express.static(__dirname));

// Lazy initialization of GoogleGenAI
let aiClient = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// AI Trip Planner endpoint - Strictly using Approved Services & Budget Comparisons
app.post('/api/ai/trip-plan', async (req, res) => {
  try {
    const {
      destination = 'Tanzania',
      days = 3,
      travelers = 2,
      startDate = '',
      endDate = '',
      estimatedBudget = 500,
      currency = 'USD',
      preferences = '',
      notes = '',
      existingSchedule = '',
      existingItinerary = '',
      linkTransport = true,
      linkAccommodation = true,
      linkFood = true,
      targetTripTitle = '',
      tripTitle = '',
      approvedServices = [],
      manuallySelectedServices = []
    } = req.body || {};

    const effectiveTitle = targetTripTitle || tripTitle || '';
    const effectiveNotes = [preferences, notes].filter(Boolean).join('. ');
    const effectiveExisting = existingSchedule || existingItinerary || '';
    const parsedDays = Math.min(Math.max(Number(days) || 3, 1), 14);
    const parsedTravelers = Math.max(Number(travelers) || 2, 1);
    const budgetNum = Math.max(Number(estimatedBudget) || 0, 0);
    const curr = currency || 'USD';

    // 1. Strictly sanitize and filter approved services (NEVER use unapproved services)
    const rawServices = Array.isArray(approvedServices) ? approvedServices : [];
    const validApproved = rawServices.filter(s => {
      if (!s) return false;
      const st = String(s.status || '').toLowerCase();
      return st === 'approved' || s.approved === true;
    });

    const matchDest = (s) => {
      if (!destination || destination.toLowerCase() === 'tanzania') return true;
      const p = String(s.place || s.location || s.destination || '').toLowerCase();
      const d = destination.toLowerCase();
      return p.includes(d) || d.includes(p);
    };

    // Filter by category and location match
    const filterCategory = (type) => {
      const typeLower = type.toLowerCase();
      const inType = validApproved.filter(s => String(s.type || '').toLowerCase() === typeLower);
      const inDest = inType.filter(matchDest);
      return inDest.length ? inDest : inType;
    };

    const availAcc = filterCategory('Accommodation');
    const availTrans = filterCategory('Transport');
    const availFood = filterCategory('Food');

    // Helper to calculate realistic cost for duration and travelers without inventing prices
    const calcCost = (svc, type) => {
      if (!svc) return { unitPrice: 0, total: 0, priceUnavailable: true, label: 'Price unavailable' };
      const rawPrice = Number(svc.price);
      if (isNaN(rawPrice) || rawPrice <= 0 || svc.price === null || svc.price === undefined || svc.price === '') {
        return { unitPrice: 0, total: 0, priceUnavailable: true, label: 'Price unavailable' };
      }

      let total = 0;
      let label = '';
      if (type === 'Accommodation') {
        const nights = Math.max(parsedDays - 1, 1);
        total = rawPrice * nights;
        label = `$${rawPrice}/night × ${nights} night${nights > 1 ? 's' : ''} = $${total}`;
      } else if (type === 'Transport') {
        const pMethod = (svc.pricingMethod || svc.priceUnit || '').toLowerCase();
        if (pMethod.includes('seat')) {
          total = rawPrice * parsedTravelers;
          label = `$${rawPrice}/seat × ${parsedTravelers} traveler${parsedTravelers > 1 ? 's' : ''} = $${total}`;
        } else if (pMethod.includes('day')) {
          total = rawPrice * parsedDays;
          label = `$${rawPrice}/day × ${parsedDays} day${parsedDays > 1 ? 's' : ''} = $${total}`;
        } else if (pMethod.includes('trip') || pMethod.includes('ride')) {
          total = rawPrice;
          label = `$${rawPrice} (${svc.pricingMethod || 'Per ride/trip'}) = $${total}`;
        } else {
          total = rawPrice * parsedDays;
          label = `$${rawPrice}/day × ${parsedDays} day${parsedDays > 1 ? 's' : ''} = $${total}`;
        }
      } else if (type === 'Food') {
        // Per meal or per day per traveler
        total = rawPrice * parsedTravelers * parsedDays;
        label = `$${rawPrice}/day/traveler × ${parsedTravelers} traveler${parsedTravelers > 1 ? 's' : ''} × ${parsedDays} day${parsedDays > 1 ? 's' : ''} = $${total}`;
      }
      return { unitPrice: rawPrice, total, priceUnavailable: false, label };
    };

    // Build price comparison options (Option A, Option B, Option C)
    const buildCategoryComparison = (categoryName, list, isLinked, manualSelected) => {
      if (!isLinked) {
        return {
          category: categoryName,
          status: 'unlinked',
          notice: `${categoryName} unlinked by organiser preference.`,
          options: [],
          selected: null
        };
      }

      if (!list || list.length === 0) {
        return {
          category: categoryName,
          status: 'no_approved_services',
          notice: `No approved ${categoryName} services found for ${destination}. The AI will not invent fake businesses or prices.`,
          options: [],
          selected: null
        };
      }

      // Check if organizer manually selected a service
      let manual = null;
      if (manualSelected && manualSelected.length) {
        manual = manualSelected.find(m => String(m.type || '').toLowerCase() === categoryName.toLowerCase());
      }

      // Sort by price ascending
      const sorted = [...list].sort((a, b) => {
        const pA = (a.price !== null && a.price !== undefined && !isNaN(Number(a.price))) ? Number(a.price) : 999999;
        const pB = (b.price !== null && b.price !== undefined && !isNaN(Number(b.price))) ? Number(b.price) : 999999;
        return pA - pB;
      });

      const options = sorted.slice(0, 3).map((s, idx) => {
        const costInfo = calcCost(s, categoryName);
        const optLetter = idx === 0 ? 'Option A' : idx === 1 ? 'Option B' : 'Option C';
        const numPrice = costInfo.priceUnavailable ? null : costInfo.unitPrice;
        return {
          letter: optLetter,
          id: s.id || '',
          name: s.name || '',
          price: numPrice,
          unitPrice: costInfo.priceUnavailable ? 'Price unavailable' : costInfo.unitPrice,
          totalCost: costInfo.priceUnavailable ? 0 : costInfo.total,
          costLabel: costInfo.label,
          priceUnavailable: costInfo.priceUnavailable,
          isManual: manual && manual.id === s.id,
          details: s.details || s.description || ''
        };
      });

      // Default selection: manual if chosen, otherwise lowest cost option
      let selected = options[0] || null;
      if (manual) {
        const foundManualInOpts = options.find(o => o.id === manual.id);
        if (foundManualInOpts) {
          selected = foundManualInOpts;
        } else {
          const costInfo = calcCost(manual, categoryName);
          const numPrice = costInfo.priceUnavailable ? null : costInfo.unitPrice;
          selected = {
            letter: 'Manual Selected',
            id: manual.id || '',
            name: manual.name || '',
            price: numPrice,
            unitPrice: costInfo.priceUnavailable ? 'Price unavailable' : costInfo.unitPrice,
            totalCost: costInfo.priceUnavailable ? 0 : costInfo.total,
            costLabel: costInfo.label,
            priceUnavailable: costInfo.priceUnavailable,
            isManual: true,
            details: manual.details || ''
          };
          options.unshift(selected);
        }
      }

      return {
        category: categoryName,
        status: 'available',
        notice: null,
        options,
        selected
      };
    };

    const compAcc = buildCategoryComparison('Accommodation', availAcc, linkAccommodation, manuallySelectedServices);
    const compTrans = buildCategoryComparison('Transport', availTrans, linkTransport, manuallySelectedServices);
    const compFood = buildCategoryComparison('Food', availFood, linkFood, manuallySelectedServices);

    // Calculate budget sum
    const totalCostSelected = 
      (compAcc.selected ? compAcc.selected.totalCost : 0) +
      (compTrans.selected ? compTrans.selected.totalCost : 0) +
      (compFood.selected ? compFood.selected.totalCost : 0);

    const isWithinBudget = totalCostSelected <= budgetNum || budgetNum === 0;
    const remainingBudget = Math.max(budgetNum - totalCostSelected, 0);
    const budgetDeficit = Math.max(totalCostSelected - budgetNum, 0);

    // Prepare alternatives if budget is insufficient
    const budgetAlternatives = [];
    if (!isWithinBudget) {
      if (compAcc.options.length > 1 && compAcc.selected && compAcc.selected.letter !== 'Option A') {
        const cheaperAcc = compAcc.options[0];
        budgetAlternatives.push({
          category: 'Accommodation',
          text: `Switch to ${cheaperAcc.name} (${cheaperAcc.costLabel}) to save $${compAcc.selected.totalCost - cheaperAcc.totalCost}`,
          serviceId: cheaperAcc.id
        });
      }
      if (compTrans.options.length > 1 && compTrans.selected && compTrans.selected.letter !== 'Option A') {
        const cheaperTrans = compTrans.options[0];
        budgetAlternatives.push({
          category: 'Transport',
          text: `Switch to ${cheaperTrans.name} (${cheaperTrans.costLabel}) to save $${compTrans.selected.totalCost - cheaperTrans.totalCost}`,
          serviceId: cheaperTrans.id
        });
      }
      if (compFood.options.length > 1 && compFood.selected && compFood.selected.letter !== 'Option A') {
        const cheaperFood = compFood.options[0];
        budgetAlternatives.push({
          category: 'Food',
          text: `Switch to ${cheaperFood.name} (${cheaperFood.costLabel}) to save $${compFood.selected.totalCost - cheaperFood.totalCost}`,
          serviceId: cheaperFood.id
        });
      }
      if (parsedDays > 2) {
        budgetAlternatives.push({
          category: 'Duration',
          text: `Adjust trip duration from ${parsedDays} days to ${parsedDays - 1} days to lower vehicle and lodge costs.`,
          serviceId: null
        });
      }
    }

    const priceComparisonSummary = {
      estimatedBudget: budgetNum,
      currency: curr,
      estimatedTotal: totalCostSelected,
      remainingBudget: remainingBudget,
      isWithinBudget: isWithinBudget,
      budgetDeficit: budgetDeficit,
      budgetNotice: isWithinBudget 
        ? `✅ Trip fits within estimated budget of ${curr} ${budgetNum}. Remaining budget: ${curr} ${remainingBudget}`
        : `Your estimated budget is not enough for the current selected services. Deficit: ${curr} ${budgetDeficit}. Review the lower-cost alternatives below.`,
      categories: {
        accommodation: compAcc,
        transport: compTrans,
        food: compFood
      },
      alternatives: budgetAlternatives
    };

    // Call Gemini with strict prompt constraints
    const ai = getAI();
    if (ai) {
      const prompt = `You are the specialized AI Trip Organiser Co-Pilot for TripBnA (Tanzania & East Africa Travel Platform).
Your task is to build a realistic, actionable ${parsedDays}-day itinerary for an Organised Trip.

CRITICAL DIRECTIVES:
1. ONLY USE REAL APPROVED SERVICES: You are provided with the platform's approved services below. Do NOT invent fake businesses, fake hotel names, fake transport companies, or fake prices.
2. If a service has 'Price unavailable', do NOT guess a price. Mark it as 'Price unavailable'.
3. If no approved service is available for a category, state clearly: "No approved [Category] service found for [Destination]".
4. BUDGET IS PRIMARY CONSTRAINT: Organiser's Estimated Budget is ${curr} ${budgetNum}.
   Current Selected Services Cost: ${curr} ${totalCostSelected}.
   Within Budget: ${isWithinBudget}.
   Deficit: ${budgetDeficit}.

TRIP CONTEXT:
Trip Title: "${effectiveTitle || destination} Expedition"
Destination: ${destination}
Duration: ${parsedDays} Days
Travelers: ${parsedTravelers} people
Start Date: ${startDate || 'Upcoming'}
End Date: ${endDate || 'Upcoming'}
Preferences: ${effectiveNotes || 'None'}
${effectiveExisting ? `Existing Itinerary: ${effectiveExisting}` : ''}

APPROVED SERVICES DATA:
Accommodation Selected: ${compAcc.selected ? `${compAcc.selected.name} (${compAcc.selected.costLabel})` : compAcc.notice || 'None'}
Transport Selected: ${compTrans.selected ? `${compTrans.selected.name} (${compTrans.selected.costLabel})` : compTrans.notice || 'None'}
Food Selected: ${compFood.selected ? `${compFood.selected.name} (${compFood.selected.costLabel})` : compFood.notice || 'None'}

Return a structured JSON object matching this schema:
{
  "title": "${effectiveTitle || `${parsedDays}-Day ${destination} Expedition`}",
  "destination": "${destination}",
  "duration": "${parsedDays} Days",
  "summary": "Engaging 2-3 sentence overview of this schedule.",
  "days": [
    {
      "day": 1,
      "title": "Day 1 Title",
      "morning": "Morning schedule & pickup description",
      "afternoon": "Afternoon activity",
      "evening": "Sunset activity & dinner",
      "pickup": "${compTrans.selected ? compTrans.selected.name : 'Meeting point'}",
      "stay": "${compAcc.selected ? compAcc.selected.name : 'Lodge stay'}",
      "meals": "${compFood.selected ? compFood.selected.name : 'Breakfast & dinner'}",
      "checkin": "14:00",
      "checkout": "10:00",
      "breakfast": "Breakfast details",
      "lunch": "Lunch details",
      "dinner": "Dinner details",
      "activities": "Activities description"
    }
  ],
  "packingList": ["Sunscreen", "Safari hat", "Binoculars", "Camera"],
  "insiderTips": ["Carry small cash for tipping", "Early morning drives give best sightings"]
}
Respond ONLY with valid JSON. Do NOT include markdown blocks.`;

      const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

          const responseText = response.text || '';
          const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
          const parsed = JSON.parse(cleaned);

          if (parsed && parsed.days && Array.isArray(parsed.days)) {
            const plan = {
              ...parsed,
              budgetComparison: priceComparisonSummary,
              estCostUsd: totalCostSelected,
              estimatedBudget: budgetNum,
              currency: curr,
              selectedAccommodation: compAcc.selected,
              selectedTransport: compTrans.selected,
              selectedFood: compFood.selected
            };
            return res.json({ success: true, plan, source: modelName });
          }
        } catch (err) {
          console.info(`Model ${modelName} transient issue (${err.message || 'unavailable'}), checking next fallback option...`);
        }
      }
    }

    // Deterministic fallback solver using ONLY the real approved services and pricing
    const fallbackDays = Array.from({ length: parsedDays }).map((_, i) => ({
      day: i + 1,
      title: i === 0 ? `Arrival & Welcome to ${destination}` : i === 1 ? `Signature Wildlife & Safari Circuit` : i === 2 ? `Cultural Discovery & Scenic Wonders` : `Hidden Gems & Farewell in ${destination}`,
      morning: i === 0 ? `Arrival transfer and tour briefing.` : `Early morning safari drive and wildlife tracking.`,
      afternoon: `Scenic exploration and viewpoint visit.`,
      evening: `Sunset views followed by dinner.`,
      pickup: compTrans.selected ? `${compTrans.selected.name} (${compTrans.selected.place || destination})` : `${destination} Meeting Point`,
      stay: compAcc.selected ? `${compAcc.selected.name} (${compAcc.selected.place || destination})` : 'Standard eco-lodge stay',
      meals: compFood.selected ? `${compFood.selected.name}` : 'Breakfast and safari lunch pack included',
      checkin: '14:00',
      checkout: '10:00',
      breakfast: 'Spiced chai & fresh fruit breakfast',
      lunch: 'Safari picnic lunch box',
      dinner: compFood.selected ? `${compFood.selected.name}` : 'Local dinner',
      activities: `Guided excursion in ${destination} exploring highlights and natural landscapes.`
    }));

    const deterministicPlan = {
      title: effectiveTitle || `${parsedDays}-Day ${destination} Expedition`,
      destination: destination,
      duration: `${parsedDays} Days`,
      summary: `Carefully calculated trip plan for ${destination} utilizing verified approved services strictly optimized for your ${curr} ${budgetNum} budget.`,
      days: fallbackDays,
      dailyItinerary: fallbackDays,
      budgetComparison: priceComparisonSummary,
      estCostUsd: totalCostSelected,
      estimatedBudget: budgetNum,
      currency: curr,
      selectedAccommodation: compAcc.selected,
      selectedTransport: compTrans.selected,
      selectedFood: compFood.selected,
      packingList: [
        'Neutral safari apparel (khaki, olive, tan)',
        'Wide-brim sun hat & UV sunglasses',
        'Binoculars and telephoto camera',
        'Insect repellent & refillable water bottle'
      ],
      insiderTips: [
        'All included services are verified approved platform partners.',
        'Early sunrise excursions provide the clearest light and most active wildlife.'
      ]
    };

    return res.json({ success: true, plan: deterministicPlan, source: 'curated-approved' });
  } catch (error) {
    console.error('Trip plan generation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate trip plan' });
  }
});

// AI Trip Assistant Q&A endpoint
app.post('/api/ai/trip-assist', async (req, res) => {
  try {
    const { question = '', context = '', action = '' } = req.body || {};
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getAI();
    if (ai) {
      const prompt = `You are the TripBnA AI Organiser Co-Pilot and East Africa Travel Specialist (Tanzania, Zanzibar, Serengeti, Kilimanjaro, Arusha).
Assist the Trip Organiser with their itinerary, service logistics (Transport, Accommodation, Food), budget planning, and member management.

User Instruction / Question: "${question}"
Current Context: "${context || 'Trip Organiser Itinerary Planning'}"
Action Mode: "${action || 'assist'}"

Instructions:
1. Provide a professional, warm, concise, and helpful response (max 3 short paragraphs).
2. If the user asks to link with transport, accommodation, or food, confirm that the linking toggle can be activated and explain how those services enhance the trip.
3. If they ask about accepting or ignoring an itinerary, explain how to accept to save to their trip or ignore to discard.
4. Keep advice culturally authentic and practically actionable for East Africa travel.`;

      const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
          });

          if (response && response.text) {
            return res.json({ success: true, answer: response.text });
          }
        } catch (err) {
          console.info(`Trip assist model ${modelName} transient issue, checking next fallback option...`);
        }
      }
    }

    // Helpful response if Gemini key not set or during spikes
    const canned = `Jambo! As your TripBnA Organiser Co-Pilot, I am here to help you coordinate this trip smoothly. You can toggle links to Transport (4x4 safari vehicles and airport transfers), Accommodation (luxury tented lodges and beach villas), or Food (Swahili barbecues and authentic seafood). When you are happy with the schedule, simply click "Accept & Integrate" to publish the itinerary directly to your travelers!`;
    return res.json({ success: true, answer: canned });
  } catch (error) {
    console.error('AI Trip Assist error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

