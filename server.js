import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
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

// AI Trip Planner endpoint
app.post('/api/ai/trip-plan', async (req, res) => {
  try {
    const {
      destination = 'Tanzania',
      days = 3,
      budget = 'Moderate',
      travelStyle = 'Safari & Nature',
      travelers = 2,
      preferences = '',
      linkTransport = true,
      linkAccommodation = true,
      linkFood = true,
      targetTripTitle = ''
    } = req.body || {};

    const ai = getAI();
    if (ai) {
      const linkingInstructions = [
        linkTransport ? 'Include specific transport logistics: pickup locations, transfers, and vehicle recommendations (e.g. 4x4 Safari Land Cruiser, airport taxi, ferry).' : 'Keep transport flexible.',
        linkAccommodation ? 'Include specific accommodation options: overnight lodge/tented camp/hotel recommendations, check-in and check-out advice.' : 'Keep lodging optional.',
        linkFood ? 'Include specific meal recommendations: breakfast, lunch spots, dinner, and authentic Swahili dishes (e.g. Nyama Choma, Coconut Fish Curry, Ugali, Zanzibar Pilau).' : 'Keep meals simple.'
      ].join(' ');

      const prompt = `You are the specialized AI Trip Organiser Co-Pilot for TripBnA (Tanzania & East Africa Travel Platform).
Your goal is to build an actionable, realistic, and highly organized ${days}-day itinerary for a Trip Organiser.
Trip: "${targetTripTitle || destination} Adventure"
Destination: ${destination}
Duration: ${days} Days
Travelers: ${travelers} people
Budget Level: ${budget}
Travel Style: ${travelStyle}
Special Instructions / Preferences: ${preferences || 'None'}
Service Linking Directive: ${linkingInstructions}

Return a structured JSON object with this EXACT schema:
{
  "title": "${targetTripTitle || `${days}-Day ${destination} Expedition`}",
  "destination": "${destination}",
  "duration": "${days} Days",
  "estCostUsd": 350,
  "estimatedBudgetUSD": "$350 - $650 per traveler",
  "summary": "Engaging 2-3 sentence overview of this trip schedule.",
  "linkedServices": {
    "transport": ${linkTransport},
    "accommodation": ${linkAccommodation},
    "food": ${linkFood}
  },
  "days": [
    {
      "day": 1,
      "title": "Arrival & Welcome Exploration",
      "morning": "Morning schedule & pickup",
      "afternoon": "Afternoon activity & visit",
      "evening": "Sunset activity & dinner",
      "pickup": "Arrival Airport / Hotel Pickup (4x4 Safari Vehicle)",
      "checkin": "14:00",
      "checkout": "10:00",
      "breakfast": "Tropical fruit buffet & spiced Chai",
      "lunch": "Savannah picnic lunchbox",
      "dinner": "Swahili barbecue & bush dinner",
      "stay": "Serengeti Heritage Tented Lodge",
      "meals": "Breakfast, Picnic Lunch, Welcome Dinner",
      "activities": "Orientation briefing, panoramic view drive, wildlife spotting."
    }
  ],
  "recommendedTransport": "Verified 4x4 Safari Land Cruiser with pop-up roof",
  "recommendedAccommodation": "Luxury eco-lodge or coastal boutique resort",
  "recommendedFood": "Fresh Swahili grilled seafood, Nyama Choma, Zanzibar spiced rice",
  "transportTip": "Private safari vehicle included with verified English/Swahili guide",
  "packingList": ["Binoculars", "Khaki / neutral safari apparel", "Camera with telephoto lens", "Sunscreen & wide hat", "Yellow fever card & repellent"],
  "insiderTips": ["Carry small cash for guide tipping", "Charge camera batteries overnight at camp solar hubs", "Early sunrise drives provide the best predator sightings"]
}

Respond ONLY with valid JSON. Do not include markdown code block syntax.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const responseText = response.text || '';
        const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        // Ensure both days and dailyItinerary are available
        if (parsed.days && !parsed.dailyItinerary) parsed.dailyItinerary = parsed.days;
        if (parsed.dailyItinerary && !parsed.days) parsed.days = parsed.dailyItinerary;
        return res.json({ success: true, plan: parsed, source: 'gemini' });
      } catch (err) {
        console.warn('Gemini API call or parse failed, falling back to curated plan:', err.message);
      }
    }

    // High quality fallback if API key is not configured yet or during spikes
    const dayCount = Math.min(Math.max(Number(days) || 3, 1), 14);
    const fallbackDays = Array.from({ length: dayCount }).map((_, i) => ({
      day: i + 1,
      title: i === 0 ? `Arrival & Welcome to ${destination}` : i === 1 ? `Signature Wildlife & Safari Circuit` : i === 2 ? `Cultural Village & Scenic Wonders` : `Hidden Gems & Farewell in ${destination}`,
      morning: i === 0 ? `Arrival transfer, hotel check-in, and tour briefing with verified guide.` : `Early morning sunrise game drive with prime predator activity.`,
      afternoon: `Scenic lunch break followed by guided afternoon exploration and viewpoint visit.`,
      evening: `Sunset sundowner followed by campfire dinner and Swahili hospitality.`,
      pickup: linkTransport ? `${destination} Central Hotel / Airport Pickup (4x4 Safari Cruiser)` : `${destination} Meeting Point`,
      checkin: '14:00',
      checkout: '10:00',
      breakfast: linkFood ? `Tropical fruit platter, eggs, and freshly brewed Tanzanian coffee` : `Standard breakfast`,
      lunch: linkFood ? `Bush safari lunchbox with fresh juices and pastries` : `Local lunch`,
      dinner: linkFood ? (i % 2 === 0 ? `Traditional Nyama Choma with Ugali & Kachumbari` : `Zanzibari Coconut Fish Curry with Spiced Pilau`) : `Dinner at lodge`,
      stay: linkAccommodation ? `${destination} Safari Eco-Lodge & Glamping Camp` : `${destination} Guest Stay`,
      meals: linkFood ? `Breakfast, Lunch & Dinner Included` : `Breakfast included`,
      activities: `Scenic drives, guided wildlife tracking, photo stops, and local cultural interaction.`
    }));

    const fallbackPlan = {
      title: targetTripTitle || `${days}-Day Ultimate ${destination} Expedition`,
      destination: destination,
      duration: `${days} Days`,
      estCostUsd: budget === 'Luxury' ? 1250 : budget === 'Backpacker' ? 180 : 380,
      estimatedBudgetUSD: budget === 'Luxury' ? '$1,200 - $2,200' : budget === 'Backpacker' ? '$180 - $450' : '$350 - $750',
      summary: `A carefully designed adventure across ${destination}, balancing comfort, wildlife spectacles, and authentic local cuisine. Tailored for ${travelStyle.toLowerCase()} travelers.`,
      linkedServices: {
        transport: linkTransport,
        accommodation: linkAccommodation,
        food: linkFood
      },
      days: fallbackDays,
      dailyItinerary: fallbackDays,
      recommendedTransport: linkTransport ? `4x4 Safari Land Cruiser with pop-up roof & certified driver guide` : `Self-arranged or public shuttle`,
      recommendedAccommodation: linkAccommodation ? `${destination} Savannah Luxury Tented Camp / Eco-Lodge` : `Local standard accommodation`,
      recommendedFood: linkFood ? `Swahili fish curry, Serengeti bush barbecue, tropical fruit` : `Local dining`,
      transportTip: `TripBnA verified drivers available with pop-up roof safari jeeps.`,
      packingList: [
        'Lightweight neutral safari clothing (khaki, olive, tan)',
        'Wide-brim hat, polarized sunglasses & SPF 50 sunscreen',
        'Binoculars and camera with zoom lens',
        'Insect repellent (DEET 30%+) & anti-malarial medication',
        'Reusable water bottle & power bank (UK Type G plug)'
      ],
      insiderTips: [
        `Greet locals with friendly Swahili: "Jambo" (Hello) or "Habari" (How are you).`,
        `Directly link your itinerary to verified TripBnA transport, accommodation, and food partners for instant confirmation.`,
        `Early morning game drives starting around 6:00 AM offer the highest chances of seeing lions and leopards on the hunt.`
      ]
    };

    return res.json({ success: true, plan: fallbackPlan, source: 'curated' });
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

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        return res.json({ success: true, answer: response.text });
      } catch (err) {
        console.warn('Gemini trip-assist failed, falling back to canned response:', err.message);
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

