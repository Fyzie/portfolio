"use client";

import { useState } from 'react';
import { Eye, MessageSquare, Database, BarChart3, Settings, Wrench, Activity } from 'lucide-react';

export default function Playground() {
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Dummy state for our future forecasting inputs
  const [inputs, setInputs] = useState({ temp: '', pressure: '', speed: '' });
  const [isForecasting, setIsForecasting] = useState(false);

  const tabs = [
    { id: 'analytics', label: 'Data Analytics', icon: <BarChart3 size={18} /> },
    { id: 'cv', label: 'Computer Vision', icon: <Eye size={18} /> },
    { id: 'nlp', label: 'NLP / Gen AI', icon: <MessageSquare size={18} /> },
    { id: 'rag', label: 'RAG Systems', icon: <Database size={18} /> },
  ];

  const handleForecast = (e: React.FormEvent) => {
    e.preventDefault();
    setIsForecasting(true);
    // Simulate backend delay
    setTimeout(() => setIsForecasting(false), 1500);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8 md:p-15 font-sans">
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">AI Playground</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Interactive demos. Select a domain below to test live models and data pipelines.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/50 p-2 rounded-xl inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="font-bold text-slate-700 flex items-center gap-2">
              <Settings size={18} className="text-slate-400" />
              Demo Environment: {tabs.find(t => t.id === activeTab)?.label}
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            
            {activeTab === 'analytics' && (
              <div className="flex-1 flex flex-col md:flex-row gap-8 animate-in fade-in duration-500">
                {/* Controls Sidebar */}
                <div className="w-full md:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-6 h-fit">
                  <div className="flex items-center gap-2 mb-6 text-slate-800">
                    <Activity size={20} className="text-orange-500" />
                    <h3 className="font-bold text-lg">Manufacturing Forecast</h3>
                  </div>
                  
                  <form onSubmit={handleForecast} className="flex flex-col gap-4 text-sm">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Temperature (°C)</label>
                      <input 
                        type="number" 
                        required
                        value={inputs.temp}
                        onChange={(e) => setInputs({...inputs, temp: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="e.g. 180" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Pressure (bar)</label>
                      <input 
                        type="number"
                        required
                        value={inputs.pressure}
                        onChange={(e) => setInputs({...inputs, pressure: e.target.value})} 
                        className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="e.g. 4.5" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Machine Speed (RPM)</label>
                      <input 
                        type="number" 
                        required
                        value={inputs.speed}
                        onChange={(e) => setInputs({...inputs, speed: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="e.g. 1200" 
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isForecasting}
                      className="mt-4 w-full bg-slate-800 text-white font-medium py-3 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                    >
                      {isForecasting ? 'Running Model...' : 'Generate 5-Point Forecast'}
                    </button>
                  </form>
                </div>

                {/* Chart Area */}
                <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                  {isForecasting ? (
                    <div className="animate-pulse flex flex-col items-center">
                      <BarChart3 size={48} className="text-orange-400 mb-4" />
                      <p className="text-slate-500 font-medium">Predicting future trends...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-full h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                        [ Recharts Line Chart will render here ]
                      </div>
                      <p className="text-slate-500 mt-4 text-sm max-w-sm">
                        Enter manufacturing parameters to predict the next 5 production yield points based on historical data.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'cv' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed w-full max-w-2xl mx-auto">
                  <Wrench size={48} className="text-slate-400 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">Work in Progress</h3>
                  <p className="text-slate-500">I am currently building out this computer vision module. Check back soon!</p>
                </div>

                {/* --- OLD UI COMMENTED OUT --- */}
                {/* 
                <Eye size={48} className="text-blue-500 mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">Computer Vision Sandbox</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  Upload an image to test my custom PyTorch and SAHI-sliced object detection models.
                </p>
                <div className="w-full max-w-md h-64 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors">
                  [ Image Upload Component Goes Here ]
                </div>
                */}
              </div>
            )}

            {activeTab === 'nlp' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed w-full max-w-2xl mx-auto">
                  <Wrench size={48} className="text-slate-400 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">Work in Progress</h3>
                  <p className="text-slate-500">I am currently building out this generative AI module. Check back soon!</p>
                </div>

                {/* --- OLD UI COMMENTED OUT --- */}
                {/* 
                <h3 className="text-2xl font-bold mb-2">Google AI Studio Chat</h3>
                <p className="text-slate-500 mb-6">Test the context-aware LLM endpoints protected by Upstash Redis rate limiting.</p>
                <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 p-4 flex flex-col w-full">
                  <div className="flex-1 flex items-center justify-center text-slate-400 italic">
                    [ Chat History Renders Here ]
                  </div>
                  <div className="mt-4 flex gap-2">
                    <input type="text" placeholder="Type your prompt..." className="flex-1 p-3 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500" />
                    <button className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors">Send</button>
                  </div>
                </div>
                */}
              </div>
            )}

            {activeTab === 'rag' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed w-full max-w-2xl mx-auto">
                  <Wrench size={48} className="text-slate-400 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">Work in Progress</h3>
                  <p className="text-slate-500">I am currently building out this retrieval-augmented generation module. Check back soon!</p>
                </div>

                {/* --- OLD UI COMMENTED OUT --- */}
                {/* 
                <Database size={48} className="text-emerald-500 mb-4 opacity-50" />
                <h3 className="text-2xl font-bold mb-2">Retrieval-Augmented Generation</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  Query my engineering documentation. The model fetches relevant vectors before generating an answer.
                </p>
                <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 p-6 rounded-xl text-left">
                  <p className="text-sm font-mono text-slate-400 mb-4">status: vector database connected...</p>
                  <input type="text" placeholder="Ask a technical question..." className="w-full p-4 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                */}
              </div>
            )}

          </div>
        </div> 

      </div>
    </main>
  );
}