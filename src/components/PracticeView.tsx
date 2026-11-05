import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Sparkles,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Zap,
  Target,
  Brain,
  Layers,
  Edit3,
  ListOrdered,
  HelpCircle,
  Flame,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Verb, UserStats, QuizMode } from '../types';
import { IRREGULAR_VERBS } from '../data/verbs';
import {
  QuizQuestion,
  generateQuestionForVerb,
  pickNextVerbsForQuiz,
  isAnswerCorrect,
  normalizeAnswer,
} from '../utils/quizEngine';
import { soundEffects, speakWord } from '../utils/audio';

interface PracticeViewProps {
  stats: UserStats;
  onRecordResult: (verbId: string, isCorrect: boolean, xp: number) => void;
  onNavigateToTutor?: (verb?: Verb) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  stats,
  onRecordResult,
  onNavigateToTutor,
}) => {
  // Session Configuration State
  const [selectedLevel, setSelectedLevel] = useState<number>(0); // 0 = all, 1, 2, 3
  const [selectedMode, setSelectedMode] = useState<QuizMode>('mixed');
  const [sessionActive, setSessionActive] = useState<boolean>(false);

  // Active Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [sessionFailedVerbs, setSessionFailedVerbs] = useState<Verb[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Typing inputs
  const [typedPast, setTypedPast] = useState<string>('');
  const [typedParticiple, setTypedParticiple] = useState<string>('');
  const pastInputRef = useRef<HTMLInputElement>(null);

  // Answer Evaluation State
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [streakInSession, setStreakInSession] = useState<number>(0);

  // Flashcard mode flip state
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Results screen
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<{ correct: number; total: number; xpEarned: number }>({
    correct: 0,
    total: 0,
    xpEarned: 0,
  });

  // Calculate quick stats for display
  const troubledVerbsCount = Object.values(stats.verbsProgress).filter(
    (p) => !p.mastered && p.incorrectCount > 0
  ).length;

  const startQuiz = (levelOverride?: number, customFailedList?: Verb[]) => {
    const lvl = levelOverride !== undefined ? levelOverride : selectedLevel;
    const verbsToUse = pickNextVerbsForQuiz(stats, lvl, 10, customFailedList || []);

    if (verbsToUse.length === 0) return;

    const generated = verbsToUse.map((v) => generateQuestionForVerb(v, selectedMode));
    setQuestions(generated);
    setCurrentIndex(0);
    setSessionFailedVerbs([]);
    setSelectedOption(null);
    setTypedPast('');
    setTypedParticiple('');
    setIsEvaluated(false);
    setIsCorrect(false);
    setIsFlipped(false);
    setStreakInSession(0);
    setSessionFinished(false);
    setSessionActive(true);
    setSessionScore({ correct: 0, total: generated.length, xpEarned: 0 });
  };

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (sessionActive && currentQ && currentQ.type === 'typing') {
      setTimeout(() => pastInputRef.current?.focus(), 150);
    }
  }, [sessionActive, currentIndex, currentQ?.type]);

  const handleSelectOption = (opt: string) => {
    if (isEvaluated) return;
    soundEffects.playClick(stats.soundEnabled);
    setSelectedOption(opt);
  };

  const handleVerify = () => {
    if (!currentQ || isEvaluated) return;

    let correct = false;

    if (currentQ.type === 'typing') {
      const pastOk = isAnswerCorrect(typedPast, currentQ.verb.pastSimple);
      const partOk = isAnswerCorrect(typedParticiple, currentQ.verb.pastParticiple);
      correct = pastOk && partOk;
    } else if (currentQ.type === 'fill-in-blank' || currentQ.type === 'mc-past' || currentQ.type === 'mc-participle' || currentQ.type === 'mc-pair') {
      if (!selectedOption) return;
      correct = normalizeAnswer(selectedOption) === normalizeAnswer(currentQ.correctAnswer);
    }

    setIsCorrect(correct);
    setIsEvaluated(true);

    const xpForQuestion = correct ? 10 : 2;
    onRecordResult(currentQ.verb.id, correct, xpForQuestion);

    if (correct) {
      soundEffects.playCorrect(stats.soundEnabled);
      setStreakInSession((prev) => prev + 1);
      setSessionScore((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        xpEarned: prev.xpEarned + xpForQuestion,
      }));
    } else {
      soundEffects.playIncorrect(stats.soundEnabled);
      setStreakInSession(0);
      setSessionFailedVerbs((prev) => [...prev, currentQ.verb]);
      setSessionScore((prev) => ({
        ...prev,
        xpEarned: prev.xpEarned + xpForQuestion,
      }));
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setTypedPast('');
      setTypedParticiple('');
      setIsEvaluated(false);
      setIsCorrect(false);
      setIsFlipped(false);
    } else {
      // Check if there are failed verbs to retry in spaced repetition
      setSessionFinished(true);
      if (sessionScore.correct >= Math.floor(questions.length * 0.7)) {
        soundEffects.playLevelUp(stats.soundEnabled);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }
  };

  // Render Setup / Home Practice Dashboard
  if (!sessionActive) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28">
        {/* Welcome Hero Card */}
        <div className="bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/40 text-emerald-100 text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Gimnasio de Verbos
              </span>
              <span className="bg-amber-400 text-amber-950 font-black text-xs px-2 py-0.5 rounded-full">
                178 Verbos
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight leading-tight">
              ¡Entrena tu cerebro al estilo Duolingo!
            </h2>
            <p className="mt-2 text-emerald-100 text-xs sm:text-sm max-w-md leading-relaxed">
              Practica pronunciación, memoriza las 3 columnas y domina la ortografía con repaso espaciado.
            </p>

            {/* Quick Action: Start Smart Session */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => startQuiz()}
                className="btn-tactile-amber px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>¡Iniciar Sesión Inteligente! (10 verbos)</span>
              </button>

              {troubledVerbsCount > 0 && (
                <button
                  onClick={() => {
                    const troubled = IRREGULAR_VERBS.filter(
                      (v) => stats.verbsProgress[v.id]?.incorrectCount > 0 && !stats.verbsProgress[v.id]?.mastered
                    );
                    startQuiz(0, troubled);
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl border border-white/30 backdrop-blur-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Repasar {troubledVerbsCount} con fallos</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Level Filters */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-slate-800 text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              1. Selecciona Nivel de Dificultad
            </h3>
            <span className="text-xs text-slate-400 font-semibold">178 verbos en total</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 0, label: 'Todos', count: 178, color: 'border-slate-300' },
              { id: 1, label: 'Nivel 1: Básico', count: 70, color: 'border-emerald-500' },
              { id: 2, label: 'Nivel 2: Medio', count: 50, color: 'border-amber-500' },
              { id: 3, label: 'Nivel 3: Avanzado', count: 58, color: 'border-purple-500' },
            ].map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={`p-3 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <p className={`text-xs font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {lvl.label}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {lvl.count} verbos
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Practice Modes */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs space-y-3">
          <h3 className="font-heading font-black text-slate-800 text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            2. Modo de Evaluación
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                id: 'mixed' as QuizMode,
                name: 'Modo Mixto Inteligente',
                desc: 'Combina opciones múltiples, oraciones y escritura.',
                icon: Brain,
                tag: 'Recomendado',
              },
              {
                id: 'multiple-choice' as QuizMode,
                name: 'Opción Múltiple',
                desc: 'Identifica la forma correcta entre 4 alternativas.',
                icon: ListOrdered,
              },
              {
                id: 'typing' as QuizMode,
                name: 'Escritura Directa',
                desc: 'Digita el Pasado y Participio para ortografía perfecta.',
                icon: Edit3,
                tag: 'Ortografía',
              },
              {
                id: 'fill-in-blank' as QuizMode,
                name: 'Completar Espacios',
                desc: 'Aplica el verbo dentro de oraciones reales en contexto.',
                icon: HelpCircle,
              },
            ].map((mode) => {
              const isSelected = selectedMode === mode.id;
              const Icon = mode.icon;

              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-800">{mode.name}</span>
                      {mode.tag && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-md">
                          {mode.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                      {mode.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Play Button */}
        <button
          onClick={() => startQuiz()}
          className="w-full btn-tactile-green py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Gamepad2 className="w-6 h-6" />
          <span>¡COMENZAR PRÁCTICA!</span>
        </button>
      </div>
    );
  }

  // Render Session Finished Results Screen
  if (sessionFinished) {
    const accuracy = Math.round((sessionScore.correct / sessionScore.total) * 100);

    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center space-y-6 pb-28 animate-pop">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-linear-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-xl">
          <Trophy className="w-12 h-12" />
        </div>

        <div>
          <h2 className="text-3xl font-heading font-black text-slate-800">
            {accuracy >= 80 ? '¡Excelente Trabajo!' : accuracy >= 50 ? '¡Buen Intento!' : '¡Sigue Practicando!'}
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Has completado la sesión de 10 verbos irregulares
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Aciertos</p>
            <p className="text-xl font-black text-emerald-600 mt-1">
              {sessionScore.correct} / {sessionScore.total}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Precisión</p>
            <p className="text-xl font-black text-blue-600 mt-1">{accuracy}%</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase">XP Ganado</p>
            <p className="text-xl font-black text-amber-500 mt-1">+{sessionScore.xpEarned}</p>
          </div>
        </div>

        {/* Failed verbs to retry */}
        {sessionFailedVerbs.length > 0 && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              Verbos que debes repasar ({sessionFailedVerbs.length}):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sessionFailedVerbs.map((v) => (
                <span
                  key={v.id}
                  className="bg-white text-rose-700 border border-rose-200 text-xs font-bold px-2 py-1 rounded-lg shadow-2xs flex items-center gap-1"
                >
                  {v.infinitive}
                  <button
                    onClick={() => speakWord(v.infinitive)}
                    className="text-rose-400 hover:text-rose-600"
                    title="Escuchar pronunciación"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3 pt-2">
          {sessionFailedVerbs.length > 0 && (
            <button
              onClick={() => startQuiz(selectedLevel, sessionFailedVerbs)}
              className="w-full btn-tactile-amber py-3.5 rounded-2xl font-black text-base shadow-md cursor-pointer"
            >
              Repasar sólo los errores ({sessionFailedVerbs.length})
            </button>
          )}

          <button
            onClick={() => startQuiz(selectedLevel)}
            className="w-full btn-tactile-green py-3.5 rounded-2xl font-black text-base shadow-md cursor-pointer"
          >
            Otra ronda nueva (10 verbos)
          </button>

          <button
            onClick={() => setSessionActive(false)}
            className="w-full btn-tactile-white py-3 rounded-2xl font-bold text-sm text-slate-700 cursor-pointer"
          >
            Volver al Menú Principal
          </button>
        </div>
      </div>
    );
  }

  // Active Quiz Question View
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-5 pb-36">
      {/* Top Session Bar: Progress and Exit */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (window.confirm('¿Seguro que deseas salir de la sesión?')) {
              setSessionActive(false);
            }
          }}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition"
          title="Abandonar sesión"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Progress Bar */}
        <div className="flex-1 h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
          <div
            className="h-full bg-linear-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className="text-xs font-black text-slate-500 whitespace-nowrap">
          {currentIndex + 1} / {questions.length}
        </span>

        {/* Streak Flame in Session */}
        {streakInSession >= 2 && (
          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{streakInSession}x</span>
          </div>
        )}
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-xs space-y-4">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              Nivel {currentQ.verb.level} • {currentQ.verb.level === 1 ? 'Básico' : currentQ.verb.level === 2 ? 'Intermedio' : 'Avanzado'}
            </span>
            <h3 className="text-base sm:text-lg font-heading font-black text-slate-800 mt-2">
              {currentQ.prompt}
            </h3>
          </div>

          {/* Audio Pronunciation Button */}
          <button
            onClick={() => speakWord(currentQ.verb.infinitive)}
            className="p-2.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition shadow-xs active:scale-95 shrink-0"
            title="Escuchar infinitivo en inglés nativo"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-prompt / Target Verb Card */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-wide">
            {currentQ.verb.infinitive}
          </p>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Español: <strong className="text-slate-700">{currentQ.verb.spanish}</strong>
          </p>

          {/* Sentence Context if Fill in Blank */}
          {currentQ.sentenceWithBlank && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Oración de ejemplo:</p>
              <p className="text-sm font-bold text-slate-800 mt-1 italic">
                "{currentQ.sentenceWithBlank}"
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                ({currentQ.verb.exampleEs})
              </p>
            </div>
          )}
        </div>

        {/* Evaluation Input: Multiple Choice */}
        {currentQ.options && currentQ.options.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            {currentQ.options.map((opt, idx) => {
              const isChosen = selectedOption === opt;
              let btnClass = 'btn-tactile-white';

              if (isEvaluated) {
                if (normalizeAnswer(opt) === normalizeAnswer(currentQ.correctAnswer)) {
                  btnClass = 'bg-emerald-500 text-white border-emerald-600';
                } else if (isChosen && !isCorrect) {
                  btnClass = 'bg-rose-500 text-white border-rose-600 animate-shake';
                } else {
                  btnClass = 'opacity-40 bg-slate-100 border-slate-200';
                }
              } else if (isChosen) {
                btnClass = 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isEvaluated}
                  className={`w-full py-3.5 px-4 rounded-2xl text-left font-bold text-sm sm:text-base flex items-center justify-between transition-all cursor-pointer ${btnClass}`}
                >
                  <span className="tracking-wide">{opt}</span>
                  {isEvaluated && normalizeAnswer(opt) === normalizeAnswer(currentQ.correctAnswer) && (
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  )}
                  {isEvaluated && isChosen && !isCorrect && (
                    <XCircle className="w-5 h-5 text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Evaluation Input: Direct Typing */}
        {currentQ.type === 'typing' && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                1. Pasado Simple (Past Simple):
              </label>
              <input
                ref={pastInputRef}
                type="text"
                value={typedPast}
                onChange={(e) => setTypedPast(e.target.value)}
                disabled={isEvaluated}
                placeholder="ej: went, ate, saw..."
                className={`w-full px-4 py-3 rounded-2xl border-2 text-base font-bold transition focus:outline-hidden ${
                  isEvaluated
                    ? isAnswerCorrect(typedPast, currentQ.verb.pastSimple)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-rose-500 bg-rose-50 text-rose-800'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerify();
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                2. Participio Pasado (Past Participle):
              </label>
              <input
                type="text"
                value={typedParticiple}
                onChange={(e) => setTypedParticiple(e.target.value)}
                disabled={isEvaluated}
                placeholder="ej: gone, eaten, seen..."
                className={`w-full px-4 py-3 rounded-2xl border-2 text-base font-bold transition focus:outline-hidden ${
                  isEvaluated
                    ? isAnswerCorrect(typedParticiple, currentQ.verb.pastParticiple)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-rose-500 bg-rose-50 text-rose-800'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerify();
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action / Evaluation Bottom Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200 p-4 shadow-xl">
        <div className="max-w-xl mx-auto">
          {!isEvaluated ? (
            <button
              onClick={handleVerify}
              disabled={
                currentQ.type === 'typing'
                  ? !typedPast.trim() || !typedParticiple.trim()
                  : !selectedOption
              }
              className={`w-full py-4 rounded-2xl font-black text-base shadow-md transition-all cursor-pointer ${
                (currentQ.type === 'typing' ? typedPast.trim() && typedParticiple.trim() : selectedOption)
                  ? 'btn-tactile-green'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border-b-0'
              }`}
            >
              COMPROBAR RESPUESTA
            </button>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <div
                className={`p-3.5 rounded-2xl border-2 flex items-start gap-3 ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-black text-base">
                      {isCorrect ? '¡Excelente! +10 XP' : '¡Respuesta Incorrecta!'}
                    </p>
                    <button
                      onClick={() => speakWord(currentQ.verb.pastSimple)}
                      className="text-xs font-bold flex items-center gap-1 hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Escuchar
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm mt-1 font-medium leading-snug">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                className={`w-full py-3.5 rounded-2xl font-black text-base shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  isCorrect ? 'btn-tactile-green' : 'btn-tactile-amber'
                }`}
              >
                <span>CONTINUAR</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
