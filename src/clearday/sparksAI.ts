import { SparkSuggestion } from './types';

const HF_TOKEN = process.env.REACT_APP_HF_TOKEN || '';

/**
 * Smart deterministic heuristics for Sparks suggestions
 * Fallback when HF API unavailable
 */
function smartHeuristics(text: string): SparkSuggestion {
  const lower = text.toLowerCase();

  // Detect domain
  const professionalKeywords = ['team', 'work', 'meeting', 'project', 'client', 'deadline', 'sync', 'review', 'goal'];
  const personalKeywords = ['gym', 'health', 'family', 'friend', 'hobby', 'exercise', 'walk', 'read'];

  let domain: 'Professional' | 'Personal' = 'Professional';
  if (personalKeywords.some(k => lower.includes(k))) {
    domain = 'Personal';
  }

  // Detect urgency
  const urgencyKeywords = ['urgent', 'asap', 'deadline', 'today', 'now', 'emergency', 'critical'];
  let urgency = 50;
  if (urgencyKeywords.some(k => lower.includes(k))) {
    urgency = 75;
  }

  // Detect importance
  const importanceKeywords = ['goal', 'strategic', 'quarterly', 'important', 'key', 'critical', 'objective'];
  let importance = 50;
  if (importanceKeywords.some(k => lower.includes(k))) {
    importance = 75;
  }

  // Detect effort
  let time: 'quick' | 'short' | 'medium' | 'deep' = 'short';
  if (text.length < 20) {
    time = 'quick';
  } else if (text.length > 80) {
    time = 'medium';
  }

  // Determine quadrant
  let quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q2';
  if (urgency > 50 && importance > 50) {
    quadrant = 'Q1';
  } else if (urgency <= 50 && importance > 50) {
    quadrant = 'Q2';
  } else if (urgency > 50 && importance <= 50) {
    quadrant = 'Q3';
  } else {
    quadrant = 'Q4';
  }

  return {
    quadrant,
    domain,
    time,
    urgency,
    importance,
    refined: text.trim(),
  };
}

/**
 * Call Hugging Face API for real AI suggestion
 * Fallback to heuristics if unavailable
 */
export async function suggestSparkQuadrant(text: string): Promise<SparkSuggestion> {
  if (!HF_TOKEN) {
    // No token, use heuristics
    return smartHeuristics(text);
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: `Classify this task into an Eisenhower quadrant. Response as JSON only: {quadrant: "Q1|Q2|Q3|Q4", domain: "Professional|Personal", urgency: 5-95, importance: 5-95, time: "quick|short|medium|deep"}. Task: "${text}"`,
          parameters: {
            max_new_tokens: 150,
          },
        }),
      }
    );

    if (!response.ok) {
      return smartHeuristics(text);
    }

    const data = await response.json();
    const generated = data?.[0]?.generated_text || '';

    // Parse JSON from response
    const jsonMatch = generated.match(/\{[^}]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        quadrant: parsed.quadrant || smartHeuristics(text).quadrant,
        domain: parsed.domain || 'Professional',
        time: parsed.time || 'short',
        urgency: Math.min(95, Math.max(5, parsed.urgency || 50)),
        importance: Math.min(95, Math.max(5, parsed.importance || 50)),
        refined: text.trim(),
      };
    }

    return smartHeuristics(text);
  } catch {
    return smartHeuristics(text);
  }
}
