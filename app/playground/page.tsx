"use client";

import { useState, useEffect } from 'react';
import { Eye, MessageSquare, Database, BarChart3, Settings, Wrench, Activity, RefreshCw, AlertCircle, Cpu, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ChartPoint {
  step?: string;
  actual?: number;
  forecast?: number;
  name?: string;
  probability?: number;
  value?: number;
}

export default function Playground() {
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Model Selection State ('forecast' | 'classification' | 'regression')
  const [analyticsType, setAnalyticsType] = useState('classification');
  
  // Input States
  const [forecastInputs, setForecastInputs] = useState({ temp: '475', pressure: '25.0', speed: '12.0' });
  const [classInputs, setClassInputs] = useState({
    vibration: '0.5',
    temperature: '65.0',
    pressure: '7.8',
    rms_vibration: '0.6',
    mean_temp: '90.5'
  });
  const [regInputs, setRegInputs] = useState({
    targeted_productivity: '0.80',
    smv: '26.16',
    over_time: '7080',
    incentive: '98',
    no_of_workers: '59.0'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Chart & DB States
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const tabs = [
    { id: 'analytics', label: 'Data Analytics', icon: <BarChart3 size={18} /> },
    { id: 'cv', label: 'Computer Vision', icon: <Eye size={18} /> },
    { id: 'nlp', label: 'NLP / Gen AI', icon: <MessageSquare size={18} /> },
    { id: 'rag', label: 'RAG Systems', icon: <Database size={18} /> },
  ];

  // Fetch history dynamically based on active task type
  const fetchHistory = async () => {
    try {
      setErrorMessage('');
      const res = await fetch(`${backendUrl}/api/get-history?task_type=${analyticsType}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      
      const result = await res.json();
      const logs = result.data || [];
      setRecentLogs(logs);

      if (logs.length > 0 && analyticsType === 'forecast') {
        const formatted: ChartPoint[] = [];
        
        // Populate past runs first
        logs.slice(0, 3).reverse().forEach((log: any, idx: number) => {
          formatted.push({ step: `Run ${idx + 1}`, actual: Number(log.outputs.forecast[0]) });
        });

        // Add a clear separation or current baseline point
        const latest = logs[0];
        if (latest && latest.outputs?.forecast) {
          formatted.push({ step: 'Current', actual: Number(latest.outputs.forecast[0]), forecast: Number(latest.outputs.forecast[0]) });
          
          // Future steps starting right after current
          latest.outputs.forecast.forEach((val: number, i: number) => {
            if (i > 0) {
              formatted.push({
                step: `Forecast +${i}`,
                forecast: Number(val),
              });
            }
          });
        }
        setChartData(formatted);
      } else if (analyticsType === 'classification' && logs.length > 0) {
        const latest = logs[0];
        if (latest && latest.outputs?.probabilities) {
          setChartData([
            { name: 'Class 0 (No Fault)', probability: Number((latest.outputs.probabilities[0] * 100).toFixed(1)) },
            { name: 'Class 1 (Bearing Fault)', probability: Number((latest.outputs.probabilities[1] * 100).toFixed(1)) },
            { name: 'Class 2 (Overheating)', probability: Number((latest.outputs.probabilities[2] * 100).toFixed(1)) },
          ]);
        }
      } else if (analyticsType === 'regression' && logs.length > 0) {
        const latest = logs[0];
        if (latest && latest.outputs?.predicted_productivity !== undefined) {
          setChartData([
            { name: 'Target Productivity', value: Number(latest.inputs.targeted_productivity) },
            { name: 'Predicted Actual', value: Number(latest.outputs.predicted_productivity.toFixed(3)) },
          ]);
        }
      } else {
        setChartData([]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not load initial history from database.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [analyticsType]);

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    const temp = parseFloat(forecastInputs.temp);
    const pressure = parseFloat(forecastInputs.pressure);
    const speed = parseFloat(forecastInputs.speed);

    if (temp < 400 || temp > 550) return setErrorMessage("⚠️ Billet temperature must be 400°C - 550°C.");
    
    try {
      const res = await fetch(`${backendUrl}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp, pressure, speed }),
      });
      if (!res.ok) throw new Error(`Inference failed: ${res.statusText}`);
      const result = await res.json();
      const forecastPoints: number[] = result.forecast;

      // Structure new run explicitly in the future horizon
      const newChartPoints: ChartPoint[] = [
        { step: 'Current', actual: forecastPoints[0], forecast: forecastPoints[0] },
        { step: 'Forecast +1', forecast: forecastPoints[1] },
        { step: 'Forecast +2', forecast: forecastPoints[2] },
        { step: 'Forecast +3', forecast: forecastPoints[3] },
        { step: 'Forecast +4', forecast: forecastPoints[4] },
      ];
      setChartData(newChartPoints);
      await fetchHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error running model inference');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFaultClassify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const res = await fetch(`${backendUrl}/api/industrial-fault-classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibration: parseFloat(classInputs.vibration),
          temperature: parseFloat(classInputs.temperature),
          pressure: parseFloat(classInputs.pressure),
          rms_vibration: parseFloat(classInputs.rms_vibration),
          mean_temp: parseFloat(classInputs.mean_temp),
        }),
      });
      if (!res.ok) throw new Error(`Inference failed: ${res.statusText}`);
      const result = await res.json();
      
      setChartData([
        { name: 'Class 0 (Normal)', probability: Number((result.probabilities[0] * 100).toFixed(1)) },
        { name: 'Class 1 (Fault A)', probability: Number((result.probabilities[1] * 100).toFixed(1)) },
        { name: 'Class 2 (Fault B)', probability: Number((result.probabilities[2] * 100).toFixed(1)) },
      ]);
      await fetchHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error running fault classification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGarmentRegress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const res = await fetch(`${backendUrl}/api/garments-regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targeted_productivity: parseFloat(regInputs.targeted_productivity),
          smv: parseFloat(regInputs.smv),
          over_time: parseInt(regInputs.over_time),
          incentive: parseInt(regInputs.incentive),
          no_of_workers: parseFloat(regInputs.no_of_workers),
        }),
      });
      if (!res.ok) throw new Error(`Inference failed: ${res.statusText}`);
      const result = await res.json();
      
      const predictedVal = Number(result.predicted_productivity.toFixed(3));
      const targetVal = parseFloat(regInputs.targeted_productivity);

      setChartData([
        { name: 'Target Productivity', value: targetVal },
        { name: 'Predicted Actual', value: predictedVal },
      ]);
      await fetchHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error running productivity regression');
    } finally {
      setIsProcessing(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8 md:p-15 font-sans">
      <div className="max-w-6xl mx-auto">
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
              <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
                
                {/* Task Selector Dropdown */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Cpu size={20} className="text-blue-500" />
                      Select Machine Learning Task
                    </h3>
                  </div>
                  <select 
                    value={analyticsType} 
                    onChange={(e) => setAnalyticsType(e.target.value)}
                    className="w-full md:w-auto px-4 py-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="classification">Classification (Industrial Fault Detection)</option>
                    <option value="regression">Regression (Garment Worker Productivity)</option>
                    <option value="forecast">Multi-Step Forecasting (Aluminum Yield)</option>
                  </select>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  {/* Controls Sidebar */}
                  <div className="w-full md:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-6 h-fit">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Activity size={20} className="text-orange-500" />
                        <h3 className="font-bold text-lg">
                          {analyticsType === 'forecast' && 'Extrusion Parameters'}
                          {analyticsType === 'classification' && 'Sensor Telemetry'}
                          {analyticsType === 'regression' && 'Garment Production Metrics'}
                        </h3>
                      </div>
                      <button onClick={fetchHistory} title="Sync with database" className="text-slate-400 hover:text-slate-600 transition-colors">
                        <RefreshCw size={16} />
                      </button>
                    </div>
                    
                    {/* FORECAST FORM */}
                    {analyticsType === 'forecast' && (
                      <form onSubmit={handleForecast} className="flex flex-col gap-4 text-sm">
                        <div>
                          <label className="text-slate-600 font-medium">Billet Temp (°C)</label>
                          <input type="number" step="0.5" required min="400" max="550" value={forecastInputs.temp} onChange={(e) => setForecastInputs({ ...forecastInputs, temp: e.target.value })} className="mt-1 w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Ram Pressure (MPa)</label>
                          <input type="number" step="0.1" required min="5" max="45" value={forecastInputs.pressure} onChange={(e) => setForecastInputs({ ...forecastInputs, pressure: e.target.value })} className="mt-1 w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Extrusion Speed (mm/s)</label>
                          <input type="number" step="0.1" required min="2" max="30" value={forecastInputs.speed} onChange={(e) => setForecastInputs({ ...forecastInputs, speed: e.target.value })} className="mt-1 w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <button type="submit" disabled={isProcessing} className="mt-4 w-full bg-slate-800 text-white font-medium py-3 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50">
                          {isProcessing ? 'Running Model...' : 'Generate Forecast'}
                        </button>
                      </form>
                    )}

                    {/* INDUSTRIAL FAULT CLASSIFICATION FORM */}
                    {analyticsType === 'classification' && (
                      <form onSubmit={handleFaultClassify} className="flex flex-col gap-3 text-sm">
                        <div>
                          <label className="text-slate-600 font-medium text-xs">Vibration (mm/s)</label>
                          <input type="number" step="0.01" required value={classInputs.vibration} onChange={(e) => setClassInputs({ ...classInputs, vibration: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium text-xs">Temperature (°C)</label>
                          <input type="number" step="0.1" required value={classInputs.temperature} onChange={(e) => setClassInputs({ ...classInputs, temperature: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium text-xs">Pressure (bar)</label>
                          <input type="number" step="0.01" required value={classInputs.pressure} onChange={(e) => setClassInputs({ ...classInputs, pressure: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium text-xs">RMS Vibration</label>
                          <input type="number" step="0.001" required value={classInputs.rms_vibration} onChange={(e) => setClassInputs({ ...classInputs, rms_vibration: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium text-xs">Mean Temp (°C)</label>
                          <input type="number" step="0.1" required value={classInputs.mean_temp} onChange={(e) => setClassInputs({ ...classInputs, mean_temp: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <button type="submit" disabled={isProcessing} className="mt-2 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                          {isProcessing ? 'Analyzing...' : 'Classify Fault State'}
                        </button>
                      </form>
                    )}

                    {/* GARMENT WORKER PRODUCTIVITY REGRESSION FORM WITH INFO TOOLTIPS */}
                    {analyticsType === 'regression' && (
                      <form onSubmit={handleGarmentRegress} className="flex flex-col gap-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-slate-600 font-medium text-xs">Targeted Productivity (0 - 1)</label>
                            <div className="relative group cursor-pointer">
                              <Info size={14} className="text-slate-400 hover:text-blue-600" />
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                Targeted productivity set by the Authority for each team for each day.
                              </div>
                            </div>
                          </div>
                          <input type="number" step="0.01" min="0" max="1" required value={regInputs.targeted_productivity} onChange={(e) => setRegInputs({ ...regInputs, targeted_productivity: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-slate-600 font-medium text-xs">SMV (Standard Minute Value)</label>
                            <div className="relative group cursor-pointer">
                              <Info size={14} className="text-slate-400 hover:text-blue-600" />
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                Standard Minute Value, it is the allocated time for a task.
                              </div>
                            </div>
                          </div>
                          <input type="number" step="0.01" required value={regInputs.smv} onChange={(e) => setRegInputs({ ...regInputs, smv: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-slate-600 font-medium text-xs">Over Time (Minutes)</label>
                            <div className="relative group cursor-pointer">
                              <Info size={14} className="text-slate-400 hover:text-blue-600" />
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                Represents the amount of overtime by each team in minutes.
                              </div>
                            </div>
                          </div>
                          <input type="number" step="1" required value={regInputs.over_time} onChange={(e) => setRegInputs({ ...regInputs, over_time: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-slate-600 font-medium text-xs">Incentive (BDT)</label>
                            <div className="relative group cursor-pointer">
                              <Info size={14} className="text-slate-400 hover:text-blue-600" />
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                Represents the amount of financial incentive (in BDT) that motivates action.
                              </div>
                            </div>
                          </div>
                          <input type="number" step="1" required value={regInputs.incentive} onChange={(e) => setRegInputs({ ...regInputs, incentive: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <label className="text-slate-600 font-medium text-xs">Number of Workers</label>
                            <div className="relative group cursor-pointer">
                              <Info size={14} className="text-slate-400 hover:text-blue-600" />
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                Number of workers in each team.
                              </div>
                            </div>
                          </div>
                          <input type="number" step="0.5" required value={regInputs.no_of_workers} onChange={(e) => setRegInputs({ ...regInputs, no_of_workers: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <button type="submit" disabled={isProcessing} className="mt-2 w-full bg-emerald-600 text-white font-medium py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                          {isProcessing ? 'Calculating...' : 'Predict Productivity'}
                        </button>
                      </form>
                    )}

                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-600 mt-4">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>

                  {/* Chart Area */}
                  <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 flex flex-col p-6">
                    <div className="mb-4 text-left">
                      <h4 className="font-semibold text-slate-800">
                        {analyticsType === 'forecast' && "Yield Forecast Trajectory"}
                        {analyticsType === 'classification' && "Fault Class Probability Distribution (%)"}
                        {analyticsType === 'regression' && "Worker Productivity Score (0 to 1)"}
                      </h4>
                      <p className="text-xs text-slate-500">Live model output visualization.</p>
                    </div>

                    <div className="w-full h-[320px]">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {analyticsType === 'forecast' ? (
                            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="step" stroke="#64748b" fontSize={12} />
                              <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }} />
                              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Current Baseline" dot={{ r: 4 }} />
                              <Line type="monotone" dataKey="forecast" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" name="Future Forecast (T+1 to T+4)" dot={{ r: 4 }} />
                            </LineChart>
                          ) : (
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={13} />
                              <YAxis stroke="#64748b" fontSize={12} domain={analyticsType === 'classification' ? [0, 100] : [0, 1]} tickFormatter={(val) => analyticsType === 'classification' ? `${val}%` : val.toFixed(2)} />
                              <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }} />
                              <Bar dataKey={analyticsType === 'classification' ? "probability" : "value"} radius={[4, 4, 0, 0]} maxBarSize={60}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                          {analyticsType === 'forecast' ? 'Loading database entries...' : 'Enter parameters and click predict to view graph.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Recent Visitor Logs Table */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">Recent Submissions ({analyticsType.toUpperCase()})</h4>
                      <p className="text-xs text-slate-500">Live feed showing recent inputs and results tested by visitors.</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full shrink-0">
                      Top 5 Live Logs
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="py-3 px-4 font-semibold">Time</th>
                          {analyticsType === 'forecast' && (
                            <>
                              <th className="py-3 px-4 font-semibold">Billet Temp (°C)</th>
                              <th className="py-3 px-4 font-semibold">Ram Pressure (MPa)</th>
                              <th className="py-3 px-4 font-semibold">Speed (mm/s)</th>
                            </>
                          )}
                          {analyticsType === 'classification' && (
                            <>
                              <th className="py-3 px-4 font-semibold">Vibration</th>
                              <th className="py-3 px-4 font-semibold">Temp (°C)</th>
                              <th className="py-3 px-4 font-semibold">Pressure</th>
                              <th className="py-3 px-4 font-semibold">Result (Probs)</th>
                            </>
                          )}
                          {analyticsType === 'regression' && (
                            <>
                              <th className="py-3 px-4 font-semibold">Target Prod.</th>
                              <th className="py-3 px-4 font-semibold">SMV</th>
                              <th className="py-3 px-4 font-semibold">Workers</th>
                              <th className="py-3 px-4 font-semibold">Predicted Actual</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {recentLogs.length > 0 ? (
                          recentLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/60 transition-colors">
                              <td className="py-3 px-4 text-slate-500 text-xs font-mono">
                                {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                              </td>
                              {analyticsType === 'forecast' && (
                                <>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.temp}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.pressure}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.speed}</td>
                                </>
                              )}
                              {analyticsType === 'classification' && (
                                <>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.vibration}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.temperature}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.pressure}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800 text-xs font-mono">
                                    {log.outputs?.probabilities ? log.outputs.probabilities.map((p: number) => (p * 100).toFixed(1) + '%').join(', ') : '-'}
                                  </td>
                                </>
                              )}
                              {analyticsType === 'regression' && (
                                <>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.targeted_productivity}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.smv}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.no_of_workers}</td>
                                  <td className="py-3 px-4 font-semibold text-emerald-600">{log.outputs?.predicted_productivity?.toFixed(3)}</td>
                                </>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 text-sm">No visitor submissions found for this task yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
            
            {/* OTHER TABS */}
            {activeTab === 'cv' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed w-full max-w-2xl mx-auto">
                  <Wrench size={48} className="text-slate-400 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">Work in Progress</h3>
                  <p className="text-slate-500">I am currently building out this computer vision module. Check back soon!</p>
                </div>
              </div>
            )}
            {activeTab === 'nlp' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed w-full max-w-2xl mx-auto">
                  <Wrench size={48} className="text-slate-400 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">Work in Progress</h3>
                </div>
              </div>
            )}
            {activeTab === 'rag' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed w-full max-w-2xl mx-auto">
                  <Wrench size={48} className="text-slate-400 mb-4" />
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">Work in Progress</h3>
                </div>
              </div>
            )}
          </div>
        </div> 
      </div>
    </main>
  );
}