import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini AI client initialization with required User-Agent
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to rule-based extract urgency keywords
function detectUrgencyKeywords(text: string): { keywords: string[]; inferredPriority: 'Critical' | 'High' | 'Medium' | 'Low' | 'None' } {
  const lower = text.toLowerCase();
  const criticalWords = ['critical', 'emergency', 'immediately', 'blocker', 'p0', 'drop everything'];
  const highWords = ['asap', 'urgent', 'high priority', 'right away', 'today', 'eod', 'as soon as possible'];
  const mediumWords = ['soon', 'this week', 'medium', 'follow up', 'tomorrow'];
  const lowWords = ['low priority', 'whenever', 'no rush', 'backlog', 'nice to have'];

  const detectedCritical = criticalWords.filter((w) => lower.includes(w));
  const detectedHigh = highWords.filter((w) => lower.includes(w));
  const detectedMedium = mediumWords.filter((w) => lower.includes(w));
  const detectedLow = lowWords.filter((w) => lower.includes(w));

  const allDetected = [...detectedCritical, ...detectedHigh, ...detectedMedium, ...detectedLow];

  let inferredPriority: 'Critical' | 'High' | 'Medium' | 'Low' | 'None' = 'Medium';
  if (detectedCritical.length > 0) {
    inferredPriority = 'Critical';
  } else if (detectedHigh.length > 0) {
    inferredPriority = 'High';
  } else if (detectedLow.length > 0) {
    inferredPriority = 'Low';
  } else if (detectedMedium.length > 0) {
    inferredPriority = 'Medium';
  } else {
    inferredPriority = 'Medium';
  }

  return { keywords: allDetected, inferredPriority };
}

// Fallback Voice Parser (heuristic)
function fallbackVoiceParser(transcript: string) {
  const { keywords, inferredPriority } = detectUrgencyKeywords(transcript);
  const sentences = transcript
    .split(/(?:and then|also|next,|\.|\n)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);

  if (sentences.length === 0) {
    return [
      {
        title: transcript.slice(0, 70),
        description: transcript,
        priority: inferredPriority,
        category: 'General',
        urgencyKeywordsDetected: keywords,
        extractedFrom: 'voice' as const,
      },
    ];
  }

  return sentences.map((sentence) => {
    const itemUrgency = detectUrgencyKeywords(sentence);
    // clean up leading filler
    let clean = sentence.replace(/^(please|i need to|we have to|remember to|make sure to)\s+/i, '');
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);

    let category = 'General';
    const lower = sentence.toLowerCase();
    if (lower.includes('emea') || lower.includes('contact') || lower.includes('team')) category = 'EMEA Outreach';
    else if (lower.includes('deal') || lower.includes('ap') || lower.includes('renew') || lower.includes('cx')) category = 'Sales / AP Deals';
    else if (lower.includes('meet') || lower.includes('call') || lower.includes('sync')) category = 'Client Success';
    else if (lower.includes('fix') || lower.includes('deploy') || lower.includes('bug') || lower.includes('code')) category = 'Engineering';

    return {
      title: clean.slice(0, 80),
      description: sentence,
      priority: itemUrgency.keywords.length > 0 ? itemUrgency.inferredPriority : inferredPriority,
      category,
      urgencyKeywordsDetected: itemUrgency.keywords.length > 0 ? itemUrgency.keywords : keywords,
      extractedFrom: 'voice' as const,
    };
  });
}

// Fallback Meeting Script Parser
function fallbackScriptParser(scriptText: string) {
  const lines = scriptText.split('\n').map((l) => l.trim()).filter(Boolean);
  const actionItems: any[] = [];

  let idCounter = 1;
  for (const line of lines) {
    const isAction =
      /^(action item|todo|to-do|task|next step|follow up|\[\s*\]|\*|-|\d+\.)/i.test(line) ||
      /\b(will|should|must|needs to|action:|assigned to)\b/i.test(line);

    if (isAction || lines.length <= 5) {
      let clean = line.replace(/^(action item:?|todo:?|to-do:?|task:?|\[\s*\]|\*|-|\d+\.)\s*/i, '').trim();
      if (!clean) continue;

      const urgency = detectUrgencyKeywords(clean);
      let assignee = 'Unassigned';
      const speakerMatch = line.match(/^([A-Za-z\s]+):/);
      if (speakerMatch) {
        assignee = speakerMatch[1].trim();
      }

      actionItems.push({
        id: `action-${Date.now()}-${idCounter++}`,
        title: clean.slice(0, 90),
        description: clean,
        priority: urgency.inferredPriority,
        category: clean.toLowerCase().includes('ap') || clean.toLowerCase().includes('deal') ? 'Sales / AP Deals' : 'Client Success',
        assignee,
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        urgencyRationale: urgency.keywords.length > 0 ? `Identified urgency keywords: ${urgency.keywords.join(', ')}` : 'Standard delivery timeline',
        selected: true,
      });
    }
  }

  if (actionItems.length === 0) {
    const urgency = detectUrgencyKeywords(scriptText);
    actionItems.push({
      id: `action-${Date.now()}-1`,
      title: 'Review meeting key decisions & follow up',
      description: scriptText.slice(0, 200),
      priority: urgency.inferredPriority,
      category: 'Client Success',
      assignee: 'Team Lead',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      urgencyRationale: 'Extracted from transcript notes',
      selected: true,
    });
  }

  return {
    meetingSummary: 'Actionable items extracted from conversation transcript and decision log.',
    actionItems,
  };
}

// POST: Parse voice transcript into discrete priority-driven tasks
app.post('/api/tasks/parse-voice', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'Transcript string is required' });
  }

  const { keywords: localKeywords, inferredPriority: localPriority } = detectUrgencyKeywords(transcript);

  if (!ai) {
    // Return heuristic response when GEMINI_API_KEY is not configured
    const fallback = fallbackVoiceParser(transcript);
    return res.json({ tasks: fallback, source: 'heuristic' });
  }

  try {
    const prompt = `Analyze this spoken voice input transcribed from a user and extract all discrete, actionable tasks.
For each task:
1. Formulate a crisp, professional title (under 80 characters, imperative verb e.g. "Prepare AP deal renewal deck", "Follow up with EMEA team").
2. Provide a descriptive summary of what needs to be done.
3. Determine priority strictly based on urgency cues:
   - "Critical": words like 'immediately', 'critical', 'emergency', 'blocker', 'p0', 'drop everything'.
   - "High": words like 'asap', 'urgent', 'today', 'eod', 'right away', 'high priority'.
   - "Medium": 'soon', 'this week', normal operational task.
   - "Low": 'low priority', 'whenever', 'backlog', 'nice to have'.
   - "None": unranked.
4. Categorize into one of: 'Engineering', 'Sales / AP Deals', 'Client Success', 'Operations', 'Leadership', 'EMEA Outreach', or 'General'.
5. Extract due date or due time if mentioned (ISO format YYYY-MM-DD or standard time string like 16:00).
6. List all urgency words detected.

Spoken input:
"""${transcript}"""`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: {
                      type: Type.STRING,
                      description: 'One of: Critical, High, Medium, Low, None',
                    },
                    category: { type: Type.STRING },
                    dueDate: { type: Type.STRING },
                    dueTime: { type: Type.STRING },
                    urgencyKeywordsDetected: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['title', 'description', 'priority', 'category'],
                },
              },
            },
            required: ['tasks'],
          },
        },
      });
      responseText = response.text || '{}';
    } catch (err: any) {
      console.warn('Primary model 3.8-flash busy, trying 3.1-flash-lite...', err?.message);
      try {
        const responseLite = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt + '\nReturn strictly valid JSON with {"tasks": [...]}',
          config: {
            responseMimeType: 'application/json',
          },
        });
        responseText = responseLite.text || '{}';
      } catch (liteErr) {
        throw err;
      }
    }

    const parsed = JSON.parse(responseText || '{}');
    const tasks = (parsed.tasks || []).map((t: any) => ({
      ...t,
      // Ensure priority matches exactly one of the 5 allowed levels
      priority: ['Critical', 'High', 'Medium', 'Low', 'None'].includes(t.priority)
        ? t.priority
        : localPriority,
      urgencyKeywordsDetected: t.urgencyKeywordsDetected?.length > 0 ? t.urgencyKeywordsDetected : localKeywords,
      extractedFrom: 'voice',
    }));

    if (tasks.length === 0) {
      return res.json({ tasks: fallbackVoiceParser(transcript), source: 'fallback' });
    }

    return res.json({ tasks, source: 'gemini' });
  } catch (error) {
    console.error('Gemini voice parse error:', error);
    // Graceful fallback to heuristic extraction
    return res.json({ tasks: fallbackVoiceParser(transcript), source: 'fallback' });
  }
});

// POST: Parse meeting script / notes into reviewable checklist
app.post('/api/tasks/parse-script', async (req, res) => {
  const { scriptText, meetingTitle } = req.body;
  if (!scriptText || typeof scriptText !== 'string') {
    return res.status(400).json({ error: 'scriptText string is required' });
  }

  if (!ai) {
    const fallback = fallbackScriptParser(scriptText);
    return res.json({ ...fallback, source: 'heuristic' });
  }

  try {
    const prompt = `You are an executive meeting assistant and task manager.
Analyze the following meeting transcript, conversation script, or call notes.
${meetingTitle ? `Meeting Context / Title: "${meetingTitle}"` : ''}

Extract every actionable item, assigned task, commitment, and follow-up obligation.
For each item:
1. Provide a clear, actionable title (e.g. "Send updated SLA metrics to Account Partner", "Resolve EMEA notification bot webhook timeout").
2. Detailed description including relevant context from the meeting.
3. Priority level strictly matching: 'Critical', 'High', 'Medium', 'Low', 'None' (evaluate based on urgency words: immediately/ASAP/critical/urgent -> Critical or High).
4. Category (e.g., 'Sales / AP Deals', 'Client Success', 'Engineering', 'EMEA Outreach', 'Operations', 'Leadership').
5. Assignee (name of the person committed to or responsible for the task, or 'Unassigned').
6. Inferred or stated due date (YYYY-MM-DD format if mentioned, or reasonable estimate).
7. Urgency rationale explaining why this task received its priority level.

Script text:
"""${scriptText}"""`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              meetingSummary: {
                type: Type.STRING,
                description: '1-2 sentence high-level executive summary of the meeting focus and outcomes',
              },
              actionItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: {
                      type: Type.STRING,
                      description: 'One of: Critical, High, Medium, Low, None',
                    },
                    category: { type: Type.STRING },
                    assignee: { type: Type.STRING },
                    dueDate: { type: Type.STRING },
                    urgencyRationale: { type: Type.STRING },
                  },
                  required: ['title', 'description', 'priority', 'category'],
                },
              },
            },
            required: ['meetingSummary', 'actionItems'],
          },
        },
      });
      responseText = response.text || '{}';
    } catch (err: any) {
      console.warn('Primary model 3.8-flash busy for script, trying 3.1-flash-lite...', err?.message);
      try {
        const responseLite = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt + '\nReturn strictly valid JSON with {"meetingSummary": "...", "actionItems": [...]}',
          config: {
            responseMimeType: 'application/json',
          },
        });
        responseText = responseLite.text || '{}';
      } catch (liteErr) {
        throw err;
      }
    }

    const parsed = JSON.parse(responseText || '{}');
    let idCounter = 1;
    const actionItems = (parsed.actionItems || []).map((item: any) => ({
      id: `action-${Date.now()}-${idCounter++}`,
      ...item,
      priority: ['Critical', 'High', 'Medium', 'Low', 'None'].includes(item.priority)
        ? item.priority
        : 'Medium',
      selected: true, // Default checked in review modal
    }));

    if (actionItems.length === 0) {
      return res.json({ ...fallbackScriptParser(scriptText), source: 'fallback' });
    }

    return res.json({
      meetingSummary: parsed.meetingSummary || 'Action items extracted successfully.',
      actionItems,
      source: 'gemini',
    });
  } catch (error) {
    console.error('Gemini script parse error:', error);
    return res.json({ ...fallbackScriptParser(scriptText), source: 'fallback' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// In production, serve the built frontend. In dev, mount Vite middlewares.
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`TaskMaster Server listening on port ${PORT}`);
  });
}

startServer();
