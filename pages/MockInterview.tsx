import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getInterviewChat } from '../services/geminiService';
import { Mic, Send, Square, Volume2, User, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const MockInterview: React.FC = () => {
  const { profile } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  
  const chatRef = useRef<any>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Speech Recognition Setup (Browser Native)
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + " " + transcript);
      };
      recognition.start();
    } else {
      alert("Speech recognition not supported in this browser.");
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSession = async () => {
    setSessionActive(true);
    setMessages([{ id: 'init', role: 'model', text: `Hello ${profile.name}! I am your AI interviewer. I see you are applying for ${profile.targetRole || 'a role'}. Shall we begin with a brief introduction about yourself?` }]);
    
    // Initialize Chat object
    chatRef.current = getInterviewChat([], profile.targetRole || 'Software Engineer');
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !chatRef.current) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Fixed: sendMessage expects { message: string }, and response has .text getter
      const result = await chatRef.current.sendMessage({ message: userMsg.text });
      const responseText = result.text || "I couldn't generate a response.";
      
      const modelMsg = { id: (Date.now() + 1).toString(), role: 'model' as const, text: responseText };
      setMessages(prev => [...prev, modelMsg]);
      speak(responseText);
    } catch (error) {
      console.error(error);
      alert("Error getting response.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!sessionActive) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-brand-100 dark:bg-brand-900/30 text-brand-600 mx-auto rounded-full flex items-center justify-center">
            <Cpu size={40} />
          </div>
          <h2 className="text-2xl font-bold dark:text-white">Mock Interview Simulator</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Practice for your {profile.targetRole || 'dream job'} interview. 
            The AI will ask role-specific questions and evaluate your responses.
          </p>
          <button 
            onClick={startSession}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
            <span className="font-semibold dark:text-white">AI Interviewer ({profile.targetRole})</span>
        </div>
        <button onClick={() => window.speechSynthesis.cancel()} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500">
            <Volume2 size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 dark:bg-slate-700 dark:text-white rounded-tl-none'
                }`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
            </div>
        ))}
        {loading && (
             <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none flex gap-2">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex gap-2">
            <button 
                onClick={startListening}
                className={`p-3 rounded-xl transition-colors ${isRecording ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
            >
                {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
            </button>
            <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your answer..."
                className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button 
                onClick={sendMessage}
                disabled={!inputText.trim() || loading}
                className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send size={20} />
            </button>
        </div>
      </div>

    </div>
  );
};