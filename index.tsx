import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCcw, 
  Trophy, 
  GraduationCap, 
  Coffee, 
  Globe, 
  Briefcase, 
  Volume2, 
  Loader2, 
  Dumbbell, 
  CheckCircle,
  XCircle,
  Brain,
  Award,
  Star,
  Target,
  BookOpen,
  Calendar
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

// Initialization for TTS
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Helper
const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// UI Text
const UI_TEXT = {
  es: {
    welcome: "Bienvenido",
    pickNative: "Soy nativo en...",
    pickTarget: "Quiero aprender...",
    start: "Comenzar",
    back: "Atrás",
    next: "Siguiente",
    complete: "Completar",
    levelsTitle: "Niveles",
    lessonsTitle: "Lecciones",
    summaryTitle: "¡NIVEL SUPERADO!",
    summaryDesc: "Has dominado nuevas expresiones del nivel",
    menuBtn: "Menú principal",
    repeatBtn: "Repetir",
    tapToTranslate: "Toca para traducir",
    vocab: "Vocabulario",
    cards: "tarjetas",
    listening: "Escuchando...",
    reviewTitle: "Repaso Diario",
    reviewSubtitle: "Refuerza lo aprendido",
    noLearnedWords: "Aún no has aprendido palabras. ¡Empieza una lección!",
    learnedWordsCount: "Palabras aprendidas",
    quizCorrect: "¡Correcto!",
    quizWrong: "¡Casi!",
    quizFinish: "Repaso completado",
    check: "Comprobar",
    reviewFinish: "¡Excelente repaso!",
    reviewFinishDesc: "Tu memoria es cada vez más fuerte.",
    score: "Puntuación",
    continue: "Continuar",
    myVocab: "Mi Vocabulario",
    viewList: "Ver lista completa",
    noVocab: "Aún no has aprendido palabras."
  }
};

// Content Database
const CONTENT: any = {
  en: {
    B1: { 
      name: "Intermediate", color: "bg-amber-500", 
      lessons: [{ id: "en_b1_1", title: "Daily Phrasal Verbs", icon: <Coffee />, items: [
        { id: "e1", word: "To run out of", translation: "Quedarse sin", phrase: "We ran out of milk.", pronunciation: "/wi ræn aʊt əv mɪlk/", phraseEs: "Nos quedamos sin leche." },
        { id: "e2", word: "To turn out", translation: "Resultar", phrase: "It turned out fine.", pronunciation: "/ɪt tɜrnd aʊt faɪn/", phraseEs: "Resultó bien." }
      ]}]
    },
    B2: { 
      name: "Upper Intermediate", color: "bg-indigo-600", 
      lessons: [{ id: "en_b2_1", title: "Business Idioms", icon: <Briefcase />, items: [
        { id: "e3", word: "On the same page", translation: "Estar de acuerdo", phrase: "Are we all on the same page?", pronunciation: "/ɑr wi ɔl ɒn ðə seɪm peɪdʒ/", phraseEs: "¿Estamos todos de acuerdo?" }
      ]}]
    },
    C1: { 
      name: "Advanced", color: "bg-rose-700", 
      lessons: [{ id: "en_c1_1", title: "Academic Vocabulary", icon: <GraduationCap />, items: [
        { id: "e4", word: "To spearhead", translation: "Liderar / Encabezar", phrase: "She spearheaded the project.", pronunciation: "/ʃi ˈspɪrhɛdɪd ðə ˈprɒdʒɛkt/", phraseEs: "Ella encabezó el proyecto." },
        { id: "e5", word: "Ubiquitous", translation: "Omnipresente", phrase: "AI is becoming ubiquitous.", pronunciation: "/eɪ-aɪ ɪz bɪˈkʌmɪŋ juːˈbɪkwɪtəs/", phraseEs: "La IA se está volviendo omnipresente." }
      ]}]
    }
  },
  de: {
    B1: { 
      name: "Mittelstufe", color: "bg-orange-500", 
      lessons: [{ id: "de_b1_1", title: "Alltagsverben", icon: <Coffee />, items: [
        { id: "d1", word: "Sich freuen auf", translation: "Tener ganas de", phrase: "Ich freue mich auf dich.", pronunciation: "/ɪç ˈfʁɔʏə mɪç aʊf dɪç/", phraseEs: "Tengo muchas ganas de verte." },
        { id: "d2", word: "Entscheiden", translation: "Decidir", phrase: "Ich muss mich entscheiden.", pronunciation: "/ɪç mʊs mɪç ɛntˈʃaɪdn/", phraseEs: "Debo decidirme." }
      ]}]
    },
    B2: { 
      name: "Fortgeschrittene", color: "bg-blue-600", 
      lessons: [{ id: "de_b2_1", title: "Berufswelt", icon: <Briefcase />, items: [
        { id: "d3", word: "Herausforderung", translation: "Desafío / Reto", phrase: "Das ist eine große Herausforderung.", pronunciation: "/das ɪst ˈaɪnə ˈɡʁoːsə hɛˈʁaʊsfɔʁdəʁʊŋ/", phraseEs: "Eso es un gran desafío." },
        { id: "d4", word: "Verantwortung", translation: "Responsabilidad", phrase: "Er trägt die Verantwortung.", pronunciation: "/ɛɐ̯ tʁɛːkt diː fɛɐ̯ˈʔantvɔʁtʊŋ/", phraseEs: "Él lleva la responsabilidad." }
      ]}]
    },
    C1: { 
      name: "Oberstufe", color: "bg-purple-800", 
      lessons: [{ id: "de_c1_1", title: "Akademisches Deutsch", icon: <GraduationCap />, items: [
        { id: "d5", word: "Allgegenwärtig", translation: "Omnipresente", phrase: "Technologie ist allgegenwärtig.", pronunciation: "/tɛçnoloˈɡiː ɪst alɡeːɡnˈvɛɐ̯tɪç/", phraseEs: "La tecnología es omnipresente." },
        { id: "d6", word: "Federführend", translation: "Líder / Protagonista", phrase: "Sie war federführend bei dem Projekt.", pronunciation: "/ziː vaːɐ̯ ˈfeːdɐfyːʁənt baɪ deːm pʁoˈjɛkt/", phraseEs: "Ella fue la líder en el proyecto." }
      ]}]
    }
  },
  fr: {
    B1: { 
      name: "Intermédiaire", color: "bg-cyan-500", 
      lessons: [{ id: "fr_b1_1", title: "La Vie Quotidienne", icon: <Coffee />, items: [
        { id: "f1", word: "Avoir hâte de", translation: "Tener ganas de", phrase: "J'ai hâte de te voir.", pronunciation: "/ʒe ɑt də tə vwaʁ/", phraseEs: "Tengo muchas ganas de verte." },
        { id: "f2", word: "S'avérer", translation: "Resultar ser", phrase: "Cela s'est avéré faux.", pronunciation: "/sla sɛt avɛʁe fo/", phraseEs: "Eso resultó ser falso." }
      ]}]
    },
    B2: { 
      name: "Avancé", color: "bg-blue-700", 
      lessons: [{ id: "fr_b2_1", title: "Monde du Travail", icon: <Briefcase />, items: [
        { id: "f3", word: "Brûler les étapes", translation: "Saltarse pasos", phrase: "Il ne faut pas brûler les étapes.", pronunciation: "/il nə fo pa bʁyle lez etap/", phraseEs: "No hay que saltarse los pasos." },
        { id: "f4", word: "Atout", translation: "Ventaja / Activo", phrase: "C'est un atout majeur.", pronunciation: "/sɛt œ̃ atu maʒœʁ/", phraseEs: "Es una gran ventaja." }
      ]}]
    },
    C1: { 
      name: "Autonome", color: "bg-emerald-800", 
      lessons: [{ id: "fr_c1_1", title: "Langue Soutenue", icon: <GraduationCap />, items: [
        { id: "f5", word: "Omniprésent", translation: "Omnipresente", phrase: "Le stress est omniprésent.", pronunciation: "/lə stʁɛs ɛt ɔmnipʁezɑ̃/", phraseEs: "El estrés es omnipresente." },
        { id: "f6", word: "Atténuer", translation: "Mitigar / Paliar", phrase: "Atténuer les risques.", pronunciation: "/atenɥe le ʁisk/", phraseEs: "Mitigar los riesgos." }
      ]}]
    }
  }
};

const App = () => {
  const [view, setView] = useState('vocabulary_list'); 
  const [targetLang, setTargetLang] = useState('en');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Audio Context Ref to reuse context and prevent limits
  const audioContextRef = useRef<AudioContext | null>(null);

  // Review Mode States
  const [learnedWords, setLearnedWords] = useState<any[]>([]);
  const [quizItems, setQuizItems] = useState<any[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  const t = UI_TEXT.es;

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Load learned words from local storage
  useEffect(() => {
    const saved = localStorage.getItem('tiny_lessons_progress');
    if (saved) {
      setLearnedWords(JSON.parse(saved));
    }
  }, []);

  // Effect to automatically save word when flipped
  useEffect(() => {
    if (flipped && activeLesson && activeLesson.items[currentIndex]) {
      saveWord(activeLesson.items[currentIndex]);
    }
  }, [flipped, currentIndex]);

  const saveWord = (item: any) => {
    const exists = learnedWords.find(w => w.id === item.id);
    if (!exists) {
      const newLearned = [...learnedWords, { ...item, lang: targetLang, level: selectedLevel, learnedAt: Date.now() }];
      setLearnedWords(newLearned);
      localStorage.setItem('tiny_lessons_progress', JSON.stringify(newLearned));
    }
  };

  const getVoice = (lang: string) => {
    switch(lang) {
      case 'en': return 'Zephyr';
      case 'de': return 'Fenrir';
      case 'fr': return 'Charon';
      case 'es': return 'Kore';
      default: return 'Zephyr';
    }
  };

  const playAudio = async (text: string, langCode: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    const voice = getVoice(langCode);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak clearly in ${langCode}: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        
        const buffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const startReview = () => {
    const langWords = learnedWords.filter(w => w.lang === targetLang);
    if (langWords.length < 1) return;

    // Create a quiz: for each word, pick distractors from the same language or a pool
    const quiz = [...langWords].sort(() => Math.random() - 0.5).slice(0, 5).map(word => {
      const otherWords = langWords.filter(w => w.id !== word.id);
      const distractors = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.translation);
      
      // If not enough distractors, add some filler
      while (distractors.length < 3) distractors.push("---");

      const options = [...distractors, word.translation].sort(() => Math.random() - 0.5);
      
      return {
        ...word,
        options
      };
    });

    setQuizItems(quiz);
    setQuizIndex(0);
    setQuizScore(0);
    setView('review_quiz');
  };

  const handleQuizAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    const correct = answer === quizItems[quizIndex].translation;
    setIsCorrect(correct);
    if (correct) setQuizScore(prev => prev + 1);
  };

  const nextQuizItem = () => {
    if (quizIndex === quizItems.length - 1) {
      setView('review_summary');
    } else {
      setQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  // VISTAS
  if (view === 'language_setup') {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-indigo-50 rounded-full mb-6">
              <Globe className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Tiny Lessons</h1>
            <p className="text-slate-400 mt-2 font-medium">B1 • B2 • C1</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-4">{t.pickTarget}</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'en', name: 'English', icon: '🇬🇧' },
                  { id: 'de', name: 'Deutsch', icon: '🇩🇪' },
                  { id: 'fr', name: 'Français', icon: '🇫🇷' }
                ].map(lang => (
                  <button 
                    key={lang.id}
                    onClick={() => setTargetLang(lang.id)}
                    className={`flex items-center justify-between p-5 rounded-3xl font-bold border-2 transition-all ${targetLang === lang.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                  >
                    <span className="text-lg">{lang.name}</span>
                    <span className="text-2xl">{lang.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setView('levels')}
              className="w-full py-5 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 mt-4"
            >
              {t.start}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'levels') {
    const langWords = learnedWords.filter(w => w.lang === targetLang);
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
        <header className="max-w-md w-full mb-8 text-center mt-4">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => setView('language_setup')} className="p-3 bg-white rounded-full shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-400"/></button>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border border-slate-100">
               <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">ES → {targetLang.toUpperCase()}</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">{t.levelsTitle}</h1>
        </header>

        <main className="max-w-md w-full grid gap-4 mb-24">
          {/* Review Card */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-100 overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-black leading-none">{langWords.length}</span>
                  <span className="text-[10px] uppercase font-black opacity-60">{t.learnedWordsCount}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">{t.reviewTitle}</h3>
              <p className="text-white/70 text-sm mb-6">{t.reviewSubtitle}</p>
              <button 
                disabled={langWords.length === 0}
                onClick={startReview}
                className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.start}
              </button>
            </div>
            <Brain className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10" />
          </div>

          <button 
            onClick={() => setView('vocabulary_list')}
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">{t.myVocab}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.viewList}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300" />
          </button>

          <div className="h-px bg-slate-200 my-2"></div>

          {Object.entries(CONTENT[targetLang]).map(([key, data]: any) => (
            <button
              key={key}
              onClick={() => {setSelectedLevel(key); setView('lesson_select');}}
              className="group bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 hover:border-indigo-400 transition-all text-left active:scale-95"
            >
              <div className={`${data.color} w-10 h-1.5 rounded-full mb-4`}></div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{key} - {data.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Vocabulario y frases avanzadas para dominar el idioma.</p>
            </button>
          ))}
        </main>
      </div>
    );
  }

  if (view === 'vocabulary_list') {
    const langWords = learnedWords.filter(w => w.lang === targetLang).sort((a, b) => b.learnedAt - a.learnedAt);

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
         <header className="max-w-md w-full flex items-center gap-4 mb-8 mt-4">
            <button onClick={() => setView('levels')} className="p-3 bg-white rounded-full shadow-sm border border-slate-100 hover:bg-slate-50">
              <ChevronLeft className="w-5 h-5 text-slate-400"/>
            </button>
            <h1 className="text-2xl font-black text-slate-900 italic tracking-tighter">{t.myVocab}</h1>
         </header>

         <main className="max-w-md w-full flex-1">
           {langWords.length === 0 ? (
             <div className="text-center mt-20 opacity-50 flex flex-col items-center">
               <div className="bg-slate-200 p-6 rounded-full mb-4">
                 <BookOpen className="w-12 h-12 text-slate-400" />
               </div>
               <p className="text-slate-500 font-medium">{t.noVocab}</p>
             </div>
           ) : (
             <div className="grid gap-3 mb-10">
               {langWords.map((item, idx) => (
                 <div key={idx} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col gap-2 hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-xl font-bold text-slate-800 leading-tight">{item.word}</h3>
                       <p className="text-indigo-600 font-medium">{item.translation}</p>
                     </div>
                     <button 
                        disabled={isSpeaking}
                        onClick={(e) => { e.stopPropagation(); playAudio(item.word, targetLang); }}
                        className="p-3 bg-indigo-50 rounded-full text-indigo-600 active:scale-95 transition-all hover:bg-indigo-100 disabled:opacity-50"
                     >
                        {isSpeaking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                     </button>
                   </div>
                   
                   <div className="h-px bg-slate-50 my-1"></div>
                   
                   <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                     <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500">{item.level}</span>
                     <div className="flex items-center gap-1">
                       <Calendar className="w-3 h-3" />
                       <span>{new Date(item.learnedAt).toLocaleDateString()}</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </main>
      </div>
    );
  }

  if (view === 'lesson_select') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button onClick={() => setView('levels')} className="flex items-center text-slate-500 mb-8 font-bold uppercase text-xs tracking-widest">
          <ChevronLeft className="w-5 h-5" /> {t.back}
        </button>
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">{t.lessonsTitle}</h1>
          <div className="grid gap-3">
            {CONTENT[targetLang][selectedLevel!].lessons.map((lesson: any) => (
              <button
                key={lesson.id}
                onClick={() => {setActiveLesson(lesson); setView('lesson'); setCurrentIndex(0); setFlipped(false);}}
                className="flex items-center justify-between p-6 bg-white rounded-[2.5rem] border border-slate-200 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mr-4">
                    {React.cloneElement(lesson.icon, { className: "text-indigo-600" })}
                  </div>
                  <div className="text-left">
                    <h4 className="font-extrabold text-slate-800">{lesson.title}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{lesson.items.length} {t.cards}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'lesson') {
    const card = activeLesson.items[currentIndex];
    const levelColor = CONTENT[targetLang][selectedLevel!].color;
    const progress = ((currentIndex + 1) / activeLesson.items.length) * 100;

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
        <div className="max-w-md mx-auto w-full flex items-center gap-4 mb-10">
          <button onClick={() => setView('lesson_select')} className="p-2 hover:bg-white rounded-full"><ChevronLeft /></button>
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full ${levelColor} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs font-black text-slate-400">{currentIndex + 1}/{activeLesson.items.length}</span>
        </div>

        <div className="flex-1 flex items-center justify-center max-w-md mx-auto w-full mb-24">
          <div className="relative w-full aspect-[4/5] cursor-pointer" onClick={() => setFlipped(!flipped)} style={{ perspective: '1200px' }}>
            <div className="w-full h-full transition-all duration-500 shadow-2xl rounded-[3rem]" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', position: 'relative' }}>
              
              {/* FRONTAL */}
              <div className="absolute inset-0 bg-white rounded-[3rem] p-10 flex flex-col items-center justify-center text-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                <div className={`${levelColor} text-white px-3 py-1 rounded-full text-[10px] font-black uppercase mb-8 tracking-widest`}>{targetLang === 'en' ? 'English' : targetLang === 'de' ? 'Deutsch' : 'Français'}</div>
                
                <h2 className="text-4xl font-black text-slate-900 leading-tight mb-8">{card.word}</h2>
                
                <button 
                  disabled={isSpeaking}
                  onClick={(e) => { e.stopPropagation(); playAudio(card.word, targetLang); }}
                  className="p-5 bg-slate-50 rounded-full text-indigo-600 hover:scale-110 transition-transform active:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSpeaking ? <Loader2 className="w-8 h-8 animate-spin" /> : <Volume2 className="w-8 h-8" />}
                </button>

                <div className="mt-12 text-slate-300 flex flex-col items-center">
                  <RefreshCcw className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{t.tapToTranslate}</span>
                </div>
              </div>

              {/* TRASERA */}
              <div className={`absolute inset-0 ${levelColor} text-white rounded-[3rem] p-10 flex flex-col items-center justify-center text-center`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Traducción</span>
                <h2 className="text-3xl font-bold mb-10">{card.translation}</h2>
                
                <div className="w-16 h-1.5 bg-white/20 rounded-full mb-8"></div>
                
                <p className="text-xl italic font-medium leading-relaxed mb-2">"{card.phrase}"</p>
                {card.pronunciation && (
                  <p className="text-sm font-mono text-white/60 mb-6 bg-black/10 px-3 py-1 rounded-lg inline-block border border-white/10">
                    {card.pronunciation}
                  </p>
                )}
                
                <button 
                  disabled={isSpeaking}
                  onClick={(e) => { e.stopPropagation(); playAudio(card.phrase, targetLang); }}
                  className="mx-auto flex items-center justify-center w-14 h-14 bg-white/20 rounded-full hover:bg-white/30 transition-all mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/20"
                >
                  {isSpeaking ? <Loader2 className="w-6 h-6 animate-spin" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <p className="text-xs opacity-80">({card.phraseEs})</p>
              </div>

            </div>
          </div>
        </div>

        <div className="fixed bottom-10 left-6 right-6 max-w-md mx-auto flex gap-3">
          <button disabled={currentIndex === 0} onClick={() => {setCurrentIndex(currentIndex-1); setFlipped(false)}} className={`flex-1 py-5 rounded-3xl font-black text-sm uppercase transition-all ${currentIndex === 0 ? 'opacity-20' : 'bg-white text-slate-900 border-2 border-slate-200 active:scale-95'}`}>{t.back}</button>
          <button onClick={() => currentIndex === activeLesson.items.length - 1 ? setView('summary') : (setCurrentIndex(currentIndex+1), setFlipped(false))} className={`flex-[2] py-5 rounded-3xl font-black text-sm uppercase text-white shadow-xl transition-all ${levelColor} hover:brightness-110 active:scale-95`}>
            {currentIndex === activeLesson.items.length - 1 ? t.complete : t.next}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'summary') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full">
          <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Trophy className="text-amber-900 w-12 h-12" />
          </div>
          <h2 className="text-4xl font-black mb-4 italic tracking-tighter uppercase">{t.summaryTitle}</h2>
          <p className="text-slate-400 mb-12 text-lg">{t.summaryDesc} {selectedLevel}.</p>
          <div className="grid gap-4">
            <button onClick={() => setView('levels')} className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-transform">{t.menuBtn}</button>
            <button onClick={() => {setView('lesson'); setCurrentIndex(0); setFlipped(false);}} className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <RefreshCcw className="w-5 h-5" /> {t.repeatBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'review_quiz') {
    const item = quizItems[quizIndex];
    const progress = ((quizIndex + 1) / quizItems.length) * 100;

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
        <div className="max-w-md mx-auto w-full flex items-center gap-4 mb-12 mt-4">
          <button onClick={() => setView('levels')} className="p-2 hover:bg-white rounded-full"><XCircle /></button>
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full bg-indigo-600 transition-all duration-500`} style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xs font-black text-slate-400">{quizIndex + 1}/{quizItems.length}</span>
        </div>

        <div className="flex-1 max-w-md mx-auto w-full text-center">
          <div className="bg-white rounded-[3rem] p-10 shadow-xl mb-12 border border-slate-100">
             <div className="flex justify-center mb-6">
                <Target className="w-10 h-10 text-indigo-500 opacity-20" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">¿Qué significa...?</h3>
             <h2 className="text-4xl font-black text-slate-900 mb-8">{item.word}</h2>
             <button 
                disabled={isSpeaking}
                onClick={() => playAudio(item.word, targetLang)}
                className="mx-auto flex items-center justify-center w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpeaking ? <Loader2 className="w-6 h-6 animate-spin" /> : <Volume2 className="w-6 h-6" />}
              </button>
          </div>

          <div className="grid gap-3">
            {item.options.map((opt: string, i: number) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOpt = opt === item.translation;
              
              let btnClass = "bg-white border-2 border-slate-100 text-slate-700";
              if (selectedAnswer) {
                if (isCorrectOpt) btnClass = "bg-emerald-500 border-emerald-500 text-white animate-pulse";
                else if (isSelected) btnClass = "bg-rose-500 border-rose-500 text-white";
                else btnClass = "opacity-40 border-slate-50 text-slate-400";
              }

              return (
                <button
                  key={i}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleQuizAnswer(opt)}
                  className={`p-5 rounded-3xl font-bold text-lg transition-all active:scale-95 ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {selectedAnswer && (
          <div className={`fixed bottom-0 left-0 right-0 p-8 ${isCorrect ? 'bg-emerald-50' : 'bg-rose-50'} border-t-2 ${isCorrect ? 'border-emerald-200' : 'border-rose-200'} transition-all animate-in slide-in-from-bottom duration-500`}>
             <div className="max-w-md mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {isCorrect ? <CheckCircle /> : <XCircle />}
                   </div>
                   <div>
                      <h4 className={`font-black uppercase tracking-widest text-sm ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isCorrect ? t.quizCorrect : t.quizWrong}
                      </h4>
                      {!isCorrect && <p className="text-rose-600 text-xs">Era: <span className="font-bold">{item.translation}</span></p>}
                   </div>
                </div>
                <button 
                  onClick={nextQuizItem}
                  className={`px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-lg active:scale-95 ${isCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}
                >
                  {t.next}
                </button>
             </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'review_summary') {
    return (
      <div className="min-h-screen bg-indigo-700 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto blur-xl absolute inset-0"></div>
            <div className="w-32 h-32 bg-indigo-500 rounded-full flex items-center justify-center mx-auto relative shadow-2xl border-4 border-white/20">
               <Award className="text-white w-16 h-16" />
            </div>
          </div>
          <h2 className="text-4xl font-black mb-4 italic tracking-tighter uppercase">{t.reviewFinish}</h2>
          <p className="text-indigo-200 mb-12 text-lg">{t.reviewFinishDesc}</p>
          
          <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 mb-12 flex justify-around">
             <div>
                <span className="block text-4xl font-black mb-1">{quizScore}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t.score}</span>
             </div>
             <div className="w-px bg-white/10"></div>
             <div>
                <span className="block text-4xl font-black mb-1">{quizItems.length}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total</span>
             </div>
          </div>

          <div className="grid gap-4">
            <button onClick={() => setView('levels')} className="w-full py-5 bg-white text-indigo-700 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-transform shadow-xl">{t.menuBtn}</button>
            <button onClick={startReview} className="w-full py-5 bg-indigo-800 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform border border-white/10">
              <RefreshCcw className="w-5 h-5" /> {t.repeatBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);