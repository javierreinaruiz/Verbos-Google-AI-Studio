import React, { useState, useMemo } from 'react';
import {
  Search,
  Volume2,
  CheckCircle,
  Clock,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Verb, UserStats, VerbLevel } from '../types';
import { IRREGULAR_VERBS } from '../data/verbs';
import { speakWord } from '../utils/audio';

interface LibraryViewProps {
  stats: UserStats;
  onSelectVerbForTutor?: (verb: Verb) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  stats,
  onSelectVerbForTutor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<number>(0); // 0 = all
  const [statusFilter, setStatusFilter] = useState<'all' | 'mastered' | 'learning' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedVerbId, setExpandedVerbId] = useState<string | null>(null);

  // Filtered and searched verbs
  const filteredVerbs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return IRREGULAR_VERBS.filter((verb) => {
      // 1. Text search
      if (term) {
        const matchesInf = verb.infinitive.toLowerCase().includes(term);
        const matchesPast = verb.pastSimple.toLowerCase().includes(term);
        const matchesPart = verb.pastParticiple.toLowerCase().includes(term);
        const matchesEs = verb.spanish.toLowerCase().includes(term);
        if (!matchesInf && !matchesPast && !matchesPart && !matchesEs) return false;
      }

      // 2. Level filter
      if (levelFilter !== 0 && verb.level !== levelFilter) {
        return false;
      }

      // 3. Status filter
      const prog = stats.verbsProgress[verb.id];
      const isMastered = prog?.mastered;
      const isLearning = prog && prog.correctCount > 0 && !prog.mastered;
      const isPending = !prog || (prog.correctCount === 0 && prog.incorrectCount === 0);

      if (statusFilter === 'mastered' && !isMastered) return false;
      if (statusFilter === 'learning' && !isLearning) return false;
      if (statusFilter === 'pending' && !isPending) return false;

      // 4. Category filter
      if (categoryFilter !== 'all' && verb.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [searchTerm, levelFilter, statusFilter, categoryFilter, stats.verbsProgress]);

  const masteredTotal = Object.values(stats.verbsProgress).filter((p) => p.mastered).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-4 pb-28">
      {/* Header and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Biblioteca de Verbos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            178 verbos con pronunciación, niveles, ejemplos y trucos mnemotécnicos.
          </p>
        </div>

        {/* Mini progress tracker */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-2xl shrink-0">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Dominio total</p>
            <p className="text-sm font-black text-emerald-700 leading-none">
              {masteredTotal} <span className="text-xs font-semibold text-slate-400">/ 178</span>
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Search Box */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por inglés o español (ej: write, went, comer, ser)..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200 bg-white font-semibold text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition shadow-xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
        {/* Level Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-400 text-[11px] uppercase shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Nivel:
          </span>
          {[
            { id: 0, label: 'Todos (178)' },
            { id: 1, label: 'Básico (70)' },
            { id: 2, label: 'Intermedio (50)' },
            { id: 3, label: 'Avanzado (58)' },
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setLevelFilter(lvl.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                levelFilter === lvl.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-400 text-[11px] uppercase shrink-0 mr-1">
            Estado:
          </span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'mastered', label: '⭐ Dominados' },
            { id: 'learning', label: '⚡ En Práctica' },
            { id: 'pending', label: '⏳ Pendientes' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Pattern / Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="font-bold text-slate-400 text-[11px] uppercase shrink-0 mr-1">
            Patrón:
          </span>
          {[
            { id: 'all', label: 'Todos los patrones' },
            { id: '3-same', label: '3 Iguales (cut-cut-cut)' },
            { id: 'past-participle-same', label: 'Pasado=Participio (buy-bought-bought)' },
            { id: 'inf-participle-same', label: 'Inf=Participio (come-came-come)' },
            { id: '3-different', label: '3 Distintos (see-saw-seen)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500">
          Mostrando {filteredVerbs.length} de 178 verbos
        </span>
        {filteredVerbs.length < 178 && (
          <button
            onClick={() => {
              setSearchTerm('');
              setLevelFilter(0);
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            Restablecer filtros
          </button>
        )}
      </div>

      {/* Verbs List */}
      <div className="space-y-2.5">
        {filteredVerbs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 space-y-2">
            <p className="text-3xl">🔍</p>
            <h4 className="font-bold text-slate-700">No se encontraron verbos</h4>
            <p className="text-xs text-slate-500">
              Prueba cambiando los términos de búsqueda o los filtros de nivel.
            </p>
          </div>
        ) : (
          filteredVerbs.map((verb) => {
            const prog = stats.verbsProgress[verb.id];
            const isMastered = prog?.mastered;
            const isLearning = prog && prog.correctCount > 0 && !prog.mastered;
            const isExpanded = expandedVerbId === verb.id;

            return (
              <div
                key={verb.id}
                className={`bg-white rounded-2xl border-2 transition-all shadow-xs overflow-hidden ${
                  isMastered
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : isLearning
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Main Row */}
                <div
                  onClick={() => setExpandedVerbId(isExpanded ? null : verb.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-2 sm:gap-4 cursor-pointer hover:bg-slate-50/60"
                >
                  {/* Left: Mastery icon and Infinitive */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status Badge */}
                    <div
                      className="shrink-0"
                      title={
                        isMastered
                          ? 'Dominado (3+ aciertos seguidos)'
                          : isLearning
                          ? 'En práctica activa'
                          : 'Pendiente por aprender'
                      }
                    >
                      {isMastered ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          ⭐
                        </div>
                      ) : isLearning ? (
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                          ⚡
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Word Titles */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
                          {verb.infinitive}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            verb.level === 1
                              ? 'bg-emerald-100 text-emerald-800'
                              : verb.level === 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          L{verb.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold truncate">
                        {verb.spanish}
                      </p>
                    </div>
                  </div>

                  {/* Middle: 3 forms preview */}
                  <div className="hidden md:flex items-center gap-3 text-xs font-bold text-slate-700">
                    <span className="bg-slate-100 px-2 py-1 rounded-lg">
                      <span className="text-slate-400 font-normal mr-1">Past:</span>
                      {verb.pastSimple}
                    </span>
                    <span className="bg-slate-100 px-2 py-1 rounded-lg">
                      <span className="text-slate-400 font-normal mr-1">Participle:</span>
                      {verb.pastParticiple}
                    </span>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakWord(verb.infinitive);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition"
                      title="Pronunciar en inglés"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      className="p-1 text-slate-400 hover:text-slate-600"
                      aria-label="Expandir detalles"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/70 space-y-3 animate-fade-in">
                    {/* The 3 Columns Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Infinitive
                        </span>
                        <span className="font-heading font-black text-sm sm:text-base text-slate-800 block mt-0.5">
                          {verb.infinitive}
                        </span>
                        <button
                          onClick={() => speakWord(verb.infinitive)}
                          className="mt-1 text-[11px] text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          <Volume2 className="w-3 h-3" /> Audio
                        </button>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Past Simple
                        </span>
                        <span className="font-heading font-black text-sm sm:text-base text-slate-800 block mt-0.5">
                          {verb.pastSimple}
                        </span>
                        <button
                          onClick={() => speakWord(verb.pastSimple)}
                          className="mt-1 text-[11px] text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          <Volume2 className="w-3 h-3" /> Audio
                        </button>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Past Participle
                        </span>
                        <span className="font-heading font-black text-sm sm:text-base text-slate-800 block mt-0.5">
                          {verb.pastParticiple}
                        </span>
                        <button
                          onClick={() => speakWord(verb.pastParticiple)}
                          className="mt-1 text-[11px] text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
                        >
                          <Volume2 className="w-3 h-3" /> Audio
                        </button>
                      </div>
                    </div>

                    {/* Example Sentence Box */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">
                        Oración en contexto:
                      </p>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">
                            "{verb.exampleEn}"
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            {verb.exampleEs}
                          </p>
                        </div>
                        <button
                          onClick={() => speakWord(verb.exampleEn)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shrink-0"
                          title="Escuchar oración completa"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions: Tutor AI mnemonic request */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-500">
                        {prog ? (
                          <span>
                            Prácticas: <strong>{prog.correctCount}</strong> aciertos, <strong>{prog.incorrectCount}</strong> fallos
                          </span>
                        ) : (
                          <span>Aún no practicado</span>
                        )}
                      </div>

                      {onSelectVerbForTutor && (
                        <button
                          onClick={() => onSelectVerbForTutor(verb)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Mnemotecnia con IA</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
