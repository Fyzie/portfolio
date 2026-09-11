"use client";

import { useState, useEffect } from 'react';
import { Eye, MessageSquare, Database, BarChart3, Settings, Wrench, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ChartPoint {
  step: string;
  actual?: number;
  forecast?: number;
}

export default function Playground() {
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Default state for aluminum extrusion parameters
  const [inputs, setInputs] = useState({ temp: '475', pressure: '25.0', speed: '12.0' });
  const [isForecasting, setIsForecasting] = useState(false);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const tabs = [
    { id: 'analytics', label: 'Data Analytics', icon: <BarChart3 size={18} /> },
    { id: 'cv', label: 'Computer Vision', icon: <Eye size={18} /> },
    { id: 'nlp', label: 'NLP / Gen AI', icon: <MessageSquare size={18} /> },
    { id: 'rag', label: 'RAG Systems', icon: <Database size={18} /> },
  ];

  // Load shared database history on component mount
  const fetchHistory = async () => {
    try {
      setErrorMessage('');
      const res = await fetch(`${backendUrl}/api/forecast-history`);
      if (!res.ok) throw new Error("Failed to fetch history");
      
      const result = await res.json();
      const logs = result.data || [];

      if (logs.length > 0) {
        const formatted: ChartPoint[] = [];
        
        logs.slice(-5).forEach((log: any, idx: number) => {
          formatted.push({
            step: `Run ${idx + 1}`,
            actual: Number(log.yield_forecast[0]),
          });
        });

        const latest = logs[0];
        if (latest && latest.yield_forecast) {
          latest.yield_forecast.forEach((val: number, i: number) => {
            formatted.push({
              step: `Forecast +${i + 1}`,
              actual: i === 0 ? Number(val) : undefined,
              forecast: Number(val),
            });
          });
        }

        setChartData(formatted);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not load initial history from database.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const temp = parseFloat(inputs.temp);
    const pressure = parseFloat(inputs.pressure);
    const speed = parseFloat(inputs.speed);

    // Aluminum extrusion telemetry validation bounds
    if (temp < 400 || temp > 550) {
      setErrorMessage("⚠️ Warning: Billet temperature must be between 400°C and 550°C for aluminum.");
      return;
    }
    if (pressure < 5.0 || pressure > 45.0) {
      setErrorMessage("⚠️ Warning: Ram pressure must be between 5.0 and 45.0 MPa.");
      return;
    }
    if (speed < 2.0 || speed > 30.0) {
      setErrorMessage("⚠️ Warning: Extrusion speed must be between 2.0 and 30.0 mm/s.");
      return;
    }

    setIsForecasting(true);

    try {
      const res = await fetch(`${backendUrl}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp, pressure, speed }),
      });

      if (!res.ok) throw new Error(`Inference failed: ${res.statusText}`);

      const result = await res.json();
      const forecastPoints: number[] = result.forecast;

      const existingActuals = chartData.filter(d => d.actual !== undefined && d.forecast === undefined);
      
      const newChartPoints: ChartPoint[] = [
        ...existingActuals.slice(-3),
        { step: 'Current', actual: forecastPoints[0], forecast: forecastPoints[0] },
        { step: 'T+1', forecast: forecastPoints[1] },
        { step: 'T+2', forecast: forecastPoints[2] },
        { step: 'T+3', forecast: forecastPoints[3] },
        { step: 'T+4', forecast: forecastPoints[4] },
      ];

      setChartData(newChartPoints);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error running model inference');
    } finally {
      setIsForecasting(false);
    }
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Activity size={20} className="text-orange-500" />
                      <h3 className="font-bold text-lg">Aluminum Extrusion Parameters</h3>
                    </div>
                    <button
                      onClick={fetchHistory}
                      title="Sync with database"
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleForecast} className="flex flex-col gap-4 text-sm">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-slate-600 font-medium">Billet Temp (°C)</label>
                        <span className="text-xs text-slate-400">Range: 400 - 550</span>
                      </div>
                      <input 
                        type="number" 
                        step="0.5"
                        required
                        min="400"
                        max="550"
                        value={inputs.temp}
                        onChange={(e) => setInputs({ ...inputs, temp: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="e.g. 475" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-slate-600 font-medium">Ram Pressure (MPa)</label>
                        <span className="text-xs text-slate-400">Range: 5 - 45</span>
                      </div>
                      <input 
                        type="number"
                        step="0.1"
                        required
                        min="5"
                        max="45"
                        value={inputs.pressure}
                        onChange={(e) => setInputs({ ...inputs, pressure: e.target.value })} 
                        className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="e.g. 25.0" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-slate-600 font-medium">Extrusion Speed (mm/s)</label>
                        <span className="text-xs text-slate-400">Range: 2 - 30</span>
                      </div>
                      <input 
                        type="number" 
                        step="0.1"
                        required
                        min="2"
                        max="30"
                        value={inputs.speed}
                        onChange={(e) => setInputs({ ...inputs, speed: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" 
                        placeholder="e.g. 12.0" 
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isForecasting}
                      className="mt-4 w-full bg-slate-800 text-white font-medium py-3 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                    >
                      {isForecasting ? 'Running Model...' : 'Generate 5-Point Forecast'}
                    </button>

                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-600 mt-2">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Live Forecasting Chart Area */}
                <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 flex flex-col p-6">
                  <div className="mb-4 text-left">
                    <h4 className="font-semibold text-slate-800">Extrusion Quality & Yield Forecast (%)</h4>
                    <p className="text-xs text-slate-500">
                      Predicting subsequent trajectory based on Random Forest regressor & continuous visitor logs.
                    </p>
                  </div>

                  <div className="w-full h-[320px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="step" stroke="#64748b" fontSize={12} />
                          <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            name="Past Production Yield" 
                            dot={{ r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="forecast" 
                            stroke="#f97316" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                            name="Predicted Next 5 Steps" 
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        Loading database entries...
                      </div>
                    )}
                  </div>
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