import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Brain,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Volume2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Verb } from '../types';
import { speakWord } from '../utils/audio';

interface AITutorViewProps {
  initialVerb?: Verb | null;
}

export const AITutorView: React.FC<AITutorViewProps> = ({ initialVerb }) => {
  const [prompt, setPrompt] = useState<string>(
    initialVerb
      ? `Explícame con ejemplos detallados y un truco mnemotécnico el verbo irregular "${initialVerb.infinitive}" (${initialVerb.spanish}) y sus formas: ${initialVerb.pastSimple} y ${initialVerb.pastParticiple}.`
      : ''
  );
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const quickQuestions = [
    {
      label: 'Diferencia entre LIE y LAY',
      query: 'Explícame detalladamente la diferencia gramatical, conjugaciones y trucos para no confundir LIE (lay, lain) y LAY (laid, laid).',
    },
    {
      label: '¿Por qué HANG tiene HUNG y HANGED?',
      query: '¿Cuándo se debe usar el pasado "hung" y cuándo "hanged" para el verbo hang? Explica el contexto con ejemplos.',
    },
    {
      label: 'Mnemotecnia para verbos con 3 formas iguales',
      query: 'Dame una lista y un truco mental infalible para recordar todos los verbos irregulares cuyas 3 formas son idénticas (como cut, cost, put, hit, etc.).',
    },
    {
      label: 'El patrón I-A-U (Sing, Drink, Swim)',
      query: 'Explica el patrón fonético y vocal I - A - U (sing-sang-sung, drink-drank-drunk, swim-swam-swum, begin-began-begun). ¿Qué otros verbos lo siguen?',
    },
  ];

  const handleAsk = async (textToSend?: string) => {
    const q = textToSend || prompt;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          verbContext: initialVerb
            ? {
                verb: initialVerb.infinitive,
                past: initialVerb.pastSimple,
                participle: initialVerb.pastParticiple,
                spanish: initialVerb.spanish,
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'API_KEY_NOT_CONFIGURED') {
          setErrorMessage(
            'Para activar el Tutor IA con Pensamiento Profundo, asegúrate de adjuntar tu clave de API en Settings > Secrets.'
          );
        } else {
          setErrorMessage(data.error || 'Ocurrió un error al consultar al tutor inteligente.');
        }
      } else {
        setResponse(data.reply);
      }
    } catch (err: any) {
      console.error('Tutor error:', err);
      setErrorMessage(
        'No se pudo conectar con el servicio inteligente. Verifica tu conexión a internet o la configuración del servidor.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4 pb-28">
      {/* Banner Hero */}
      <div className="bg-linear-to-br from-purple-700 via-indigo-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-purple-500/30 text-purple-200 text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-purple-400/30 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> Modo Pensamiento Profundo Activo
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-black tracking-tight leading-snug">
            Tutor Lingüístico Inteligente
          </h2>
          <p className="mt-1 text-purple-200 text-xs sm:text-sm max-w-lg leading-relaxed">
            Resuelve dudas complejas, etimologías, reglas mnemotécnicas e irregularidades históricas del inglés impulsado por <strong>Gemini 4 Argon</strong>.
          </p>
        </div>
      </div>

      {/* Quick Topic Chips */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Consultas complejas frecuentes:
        </p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(q.query);
                handleAsk(q.query);
              }}
              className="bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 hover:border-purple-300 transition shadow-2xs text-left"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase">
          Escribe tu pregunta sobre verbos irregulares:
        </label>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Ej: ¿Por qué GO tiene WENT en pasado? o Dame una regla para no olvidar SHED..."
            className="w-full p-3.5 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleAsk()}
            disabled={!prompt.trim() || isLoading}
            className={`btn-tactile-blue px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md cursor-pointer ${
              !prompt.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Razonando con Pensamiento Profundo...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Consultar al Tutor</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-xs sm:text-sm text-rose-800 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Aviso del Sistema:</p>
            <p className="mt-0.5 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* AI Deep Reasoning Response Box */}
      {response && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-purple-200 shadow-sm space-y-3 animate-pop">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2 text-purple-800">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-heading font-black text-base">
                Explicación Lingüística Detallada
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              Gemini 4 Argon • High Thinking
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap font-sans text-xs sm:text-sm">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};
