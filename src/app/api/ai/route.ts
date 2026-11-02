import { NextResponse } from 'next/server';

// Provider config: on Vercel, set GROQ_API_KEY / GEMINI_API_KEY. Locally, Ollama can still work.
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:1.5b';

async function withTimeout<T>(ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    const result = await fn(controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch {
    return null;
  }
}

async function queryGroq(prompt: string) {
  if (!GROQ_API_KEY) return null;
  return withTimeout(15000, async (signal) => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 280,
      }),
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return text ? { text: text.trim(), provider: `llama-3.3-70b (Groq Cloud)` } : null;
  });
}

async function queryGemini(prompt: string) {
  if (!GEMINI_API_KEY) return null;
  return withTimeout(15000, async (signal) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 280,
          },
        }),
        signal,
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? { text: text.trim(), provider: `gemini-2.0-flash (Google AI)` } : null;
  });
}

async function queryOllama(prompt: string) {
  return withTimeout(12000, async (signal) => {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.6,
          num_predict: 280,
        },
      }),
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response ? { text: data.response.trim(), provider: `qwen2.5:1.5b (Ollama Localhost)` } : null;
  });
}

// Tries Groq first, then Gemini, then local Ollama (dev only).
async function queryLLM(prompt: string) {
  return (await queryGroq(prompt)) || (await queryGemini(prompt)) || (await queryOllama(prompt));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'analyze-room') {
      const { listing, profile } = payload;
      const prompt = `You are Flatly AI, an expert Indian co-living and roommate advisor.
Analyze this room vacancy for a seeker:
Room Title: "${listing.title}"
Location: ${listing.location} (City: ${listing.city || 'India'})
Rent: ₹${listing.rent}/month
Amenities: ${(listing.tags || []).join(', ')}
About: "${listing.description || ''}"

Seeker Profile:
- Sleep Schedule: ${profile?.habits?.sleepTime || 'Moderate'}
- Cleanliness: ${profile?.habits?.cleanliness || 'Regular tidy up'}
- Food: ${profile?.habits?.foodPreference || 'No preference'}
- Smoking: ${profile?.habits?.smoking || 'Non-smoker'}

Provide a concise, helpful 3-point analysis in clean bullet points:
1. 🎯 Value & Location Verdict (is ₹${listing.rent} fair for ${listing.location}?)
2. ⚡ Compatibility Match (lifestyle alignment with seeker)
3. 💡 Key Question to ask the flatmate before paying token money`;

      const response = await queryLLM(prompt);

      if (response) {
        return NextResponse.json({
          provider: response.provider,
          isLocal: response.provider.includes('Ollama'),
          analysis: response.text,
        });
      }

      // No provider answered — never return fake AI data
      return NextResponse.json(
        { error: 'AI service unavailable (Groq/Gemini keys missing or rate-limited on server).' },
        { status: 503 }
      );
    }

    if (action === 'analyze-expenses') {
      const { flatName, totalRent, expenses, members } = payload;
      const prompt = `You are Flatly Hisab AI.
Analyze these shared apartment expenses for flat "${flatName || 'Co-living Pad'}":
Monthly Rent: ₹${totalRent || 0}
Total Expenses Recorded: ${expenses?.length || 0}
Recent Expenses:
${(expenses || []).slice(0, 6).map((e: any) => `- ₹${e.amount} for "${e.title}"`).join('\n')}

Roommates: ${(members || []).map((m: any) => m.name).join(', ')}

Provide a concise 3-bullet breakdown:
1. 📊 Total spend & top expense area
2. ⚖️ Fairness & Debt settle-up observation
3. 💡 1 practical tip to save money next month`;

      const response = await queryLLM(prompt);

      if (response) {
        return NextResponse.json({
          provider: response.provider,
          isLocal: response.provider.includes('Ollama'),
          analysis: response.text,
        });
      }

      // No provider answered — never return fake AI data
      return NextResponse.json(
        { error: 'AI service unavailable (Groq/Gemini keys missing or rate-limited on server).' },
        { status: 503 }
      );
    }

    if (action === 'rewrite-complaint') {
      const { text } = payload;
      const prompt = `You are Flatly AI Co-Living Mediator.
Rewrite this roommate issue/complaint into a polite, friendly, but clear WhatsApp message for the flat group:
Original: "${text}"

Reply ONLY with the rewritten message in a friendly Hinglish/English tone that prevents passive aggression and builds mutual respect.`;

      const response = await queryLLM(prompt);

      if (response) {
        return NextResponse.json({
          provider: response.provider,
          isLocal: response.provider.includes('Ollama'),
          rewritten: response.text,
        });
      }

      // No provider answered — never return fake AI data
      return NextResponse.json(
        { error: 'AI service unavailable (Groq/Gemini keys missing or rate-limited on server).' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
