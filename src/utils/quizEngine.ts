import { Verb, UserStats, QuizMode } from '../types';
import { IRREGULAR_VERBS } from '../data/verbs';

export type QuestionType =
  | 'mc-past' // Choose past simple
  | 'mc-participle' // Choose past participle
  | 'mc-pair' // Choose "Past / Participle"
  | 'mc-spanish' // Choose infinitive from Spanish
  | 'fill-in-blank' // Fill in blank in sentence
  | 'typing'; // Type both past and participle

export interface QuizQuestion {
  id: string;
  verb: Verb;
  type: QuestionType;
  prompt: string;
  subPrompt?: string;
  options?: string[]; // for multiple choice
  correctAnswer: string; // or combined string
  sentenceWithBlank?: string;
  targetForm?: 'past' | 'participle' | 'both';
  explanation: string;
}

// Clean alternative forms for matching, e.g. "was / were" or "learnt / learned"
export function normalizeAnswer(ans: string): string {
  return ans.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isAnswerCorrect(userAns: string, targetExpected: string): boolean {
  const normUser = normalizeAnswer(userAns);
  const acceptable = targetExpected.split('/').map((s) => normalizeAnswer(s));
  return acceptable.includes(normUser);
}

// Helper to get random distractors from verbs
function getRandomDistractors(correct: string, pool: string[], count: number = 3): string[] {
  const filtered = pool.filter((item) => normalizeAnswer(item) !== normalizeAnswer(correct));
  const shuffled = [...new Set(filtered)].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Smart Spaced Repetition Picker
export function pickNextVerbsForQuiz(
  stats: UserStats,
  selectedLevel: number = 0, // 0 = all, 1, 2, 3
  count: number = 10,
  failedQueue: Verb[] = []
): Verb[] {
  // 1. Filter by level if specified
  const pool = selectedLevel === 0 ? IRREGULAR_VERBS : IRREGULAR_VERBS.filter((v) => v.level === selectedLevel);

  // 2. Separate into priority buckets
  const inSessionFailed = [...failedQueue];
  const troubledVerbs: Verb[] = [];
  const unpracticedVerbs: Verb[] = [];
  const masteredVerbs: Verb[] = [];

  pool.forEach((v) => {
    const prog = stats.verbsProgress[v.id];
    if (!prog || prog.correctCount === 0) {
      unpracticedVerbs.push(v);
    } else if (!prog.mastered || prog.incorrectCount > 0) {
      troubledVerbs.push(v);
    } else {
      masteredVerbs.push(v);
    }
  });

  // Shuffle buckets
  inSessionFailed.sort(() => 0.5 - Math.random());
  troubledVerbs.sort(() => 0.5 - Math.random());
  unpracticedVerbs.sort(() => 0.5 - Math.random());
  masteredVerbs.sort(() => 0.5 - Math.random());

  // Compose list emphasizing troubled and inSessionFailed
  const selected: Verb[] = [];
  const addedIds = new Set<string>();

  const addVerb = (v: Verb) => {
    if (!addedIds.has(v.id) && selected.length < count) {
      addedIds.add(v.id);
      selected.push(v);
    }
  };

  inSessionFailed.forEach(addVerb);
  troubledVerbs.forEach(addVerb);
  unpracticedVerbs.forEach(addVerb);
  masteredVerbs.forEach(addVerb);

  // If still not enough, take randomly from pool
  const allShuffled = [...pool].sort(() => 0.5 - Math.random());
  allShuffled.forEach(addVerb);

  return selected.sort(() => 0.5 - Math.random());
}

export function generateQuestionForVerb(
  verb: Verb,
  preferredMode: QuizMode = 'mixed'
): QuizQuestion {
  const allVerbs = IRREGULAR_VERBS;
  const qId = `${verb.id}_${Date.now()}_${Math.random()}`;

  // Decide question type based on preferredMode
  let qType: QuestionType;
  if (preferredMode === 'multiple-choice') {
    const r = Math.random();
    qType = r < 0.4 ? 'mc-pair' : r < 0.7 ? 'mc-past' : 'mc-participle';
  } else if (preferredMode === 'typing') {
    qType = 'typing';
  } else if (preferredMode === 'fill-in-blank') {
    qType = 'fill-in-blank';
  } else {
    // Mixed Mode: Smart variety
    const r = Math.random();
    if (r < 0.28) qType = 'mc-pair';
    else if (r < 0.52) qType = 'mc-past';
    else if (r < 0.75) qType = 'fill-in-blank';
    else qType = 'typing';
  }

  // 1. Multiple Choice: Pair (Past + Participle)
  if (qType === 'mc-pair') {
    const correctAns = `${verb.pastSimple}  •  ${verb.pastParticiple}`;
    const allPairs = allVerbs.map((v) => `${v.pastSimple}  •  ${v.pastParticiple}`);
    const distractors = getRandomDistractors(correctAns, allPairs, 3);
    const options = [correctAns, ...distractors].sort(() => 0.5 - Math.random());

    return {
      id: qId,
      verb,
      type: 'mc-pair',
      prompt: `¿Cuáles son las formas de Pasado y Participio de:`,
      subPrompt: `"${verb.infinitive.toUpperCase()}" (${verb.spanish})`,
      options,
      correctAnswer: correctAns,
      targetForm: 'both',
      explanation: `Infinitivo: ${verb.infinitive} | Pasado: ${verb.pastSimple} | Participio: ${verb.pastParticiple}`,
    };
  }

  // 2. Multiple Choice: Past Simple
  if (qType === 'mc-past') {
    const correctAns = verb.pastSimple.split('/')[0].trim();
    const allPasts = allVerbs.map((v) => v.pastSimple.split('/')[0].trim());
    const distractors = getRandomDistractors(correctAns, allPasts, 3);
    const options = [correctAns, ...distractors].sort(() => 0.5 - Math.random());

    return {
      id: qId,
      verb,
      type: 'mc-past',
      prompt: `Selecciona el Pasado Simple (Past Simple) de:`,
      subPrompt: `"${verb.infinitive.toUpperCase()}" (${verb.spanish})`,
      options,
      correctAnswer: correctAns,
      targetForm: 'past',
      explanation: `El Pasado Simple de ${verb.infinitive} es "${verb.pastSimple}".`,
    };
  }

  // 3. Fill in the Blank (Using sentence context)
  if (qType === 'fill-in-blank') {
    // Look at sentence, e.g. "I bought a new laptop." -> "I _____ (buy) a new laptop."
    const pastFirstWord = verb.pastSimple.split('/')[0].trim();
    const regex = new RegExp(`\\b${pastFirstWord}\\b`, 'i');
    let sentenceWithBlank = verb.exampleEn;
    let target = pastFirstWord;

    if (regex.test(verb.exampleEn)) {
      sentenceWithBlank = verb.exampleEn.replace(regex, `_____ (${verb.infinitive})`);
      target = pastFirstWord;
    } else {
      // Fallback template
      sentenceWithBlank = `Yesterday, they _____ (${verb.infinitive}) the whole day.`;
      target = pastFirstWord;
    }

    const allPasts = allVerbs.map((v) => v.pastSimple.split('/')[0].trim());
    const distractors = getRandomDistractors(target, allPasts, 3);
    const options = [target, ...distractors].sort(() => 0.5 - Math.random());

    return {
      id: qId,
      verb,
      type: 'fill-in-blank',
      prompt: `Completa la oración con la forma verbal correcta:`,
      subPrompt: verb.exampleEs,
      sentenceWithBlank,
      options,
      correctAnswer: target,
      targetForm: 'past',
      explanation: `Oración completa: "${verb.exampleEn}" (${verb.exampleEs})`,
    };
  }

  // 4. Typing Mode (Direct typing for orthography & spelling mastery)
  return {
    id: qId,
    verb,
    type: 'typing',
    prompt: `Escribe las formas del verbo:`,
    subPrompt: `"${verb.infinitive.toUpperCase()}" — Significado: ${verb.spanish}`,
    correctAnswer: `${verb.pastSimple} | ${verb.pastParticiple}`,
    targetForm: 'both',
    explanation: `Infinitivo: ${verb.infinitive} → Pasado: ${verb.pastSimple} → Participio: ${verb.pastParticiple}`,
  };
}
