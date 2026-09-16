"use client";

import { useState, useEffect } from 'react';
import { Eye, MessageSquare, Database, BarChart3, Settings, Wrench, Activity, RefreshCw, AlertCircle, Cpu, Info, Upload, X } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ChartPoint {
  step?: string;
  actual?: number;
  forecast?: number;
  name?: string;
  probability?: number;
  value?: number;
}

interface Detection {
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [xmin, ymin, xmax, ymax]
  center_x: number;
  center_y: number;
}

export default function Playground() {
  const [activeTab, setActiveTab] = useState('analytics');
  
  // Model Selection State ('forecast' | 'classification' | 'regression')
  const [analyticsType, setAnalyticsType] = useState('classification');
  
  // Input States with Industrial Boundaries
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

  // Computer Vision States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const tabs = [
    { id: 'analytics', label: 'Data Analytics', icon: <BarChart3 size={18} /> },
    { id: 'cv', label: 'Computer Vision', icon: <Eye size={18} /> },
    { id: 'nlp', label: 'NLP / Gen AI', icon: <MessageSquare size={18} /> },
    { id: 'rag', label: 'RAG Systems', icon: <Database size={18} /> },
  ];

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
        logs.slice(0, 3).reverse().forEach((log: any, idx: number) => {
          formatted.push({ step: `Run ${idx + 1}`, actual: Number(log.outputs.forecast[0]) });
        });
        const latest = logs[0];
        if (latest && latest.outputs?.forecast) {
          formatted.push({ step: 'Current', actual: Number(latest.outputs.forecast[0]), forecast: Number(latest.outputs.forecast[0]) });
          latest.outputs.forecast.forEach((val: number, i: number) => {
            if (i > 0) {
              formatted.push({ step: `Forecast +${i}`, forecast: Number(val) });
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
    if (activeTab === 'analytics') {
      fetchHistory();
    }
  }, [analyticsType, activeTab]);

  // Generate cropped sub-image for modal preview
  useEffect(() => {
    if (!selectedDetection || !selectedImage || imageDimensions.width === 0) {
      setCroppedImageUrl(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const [xmin, ymin, xmax, ymax] = selectedDetection.box;
      
      const x = Math.max(0, xmin);
      const y = Math.max(0, ymin);
      const w = Math.min(img.naturalWidth - x, xmax - xmin);
      const h = Math.min(img.naturalHeight - y, ymax - ymin);

      if (w <= 0 || h <= 0) {
        setCroppedImageUrl(null);
        return;
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        setCroppedImageUrl(canvas.toDataURL());
      }
    };
  }, [selectedDetection, selectedImage, imageDimensions]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setDetections([]);
      setSelectedDetection(null);
      const url = URL.createObjectURL(file);
      setSelectedImage(url);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
    }
  };

  const handleRunCV = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    setErrorMessage('');
    setSelectedDetection(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const res = await fetch(`${backendUrl}/api/cv-detect`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.statusText}`);
      }

      const data = await res.json();
      setDetections(data.detections || []);
      setImageDimensions({ width: data.image_width, height: data.image_height });
    } catch (err: any) {
      setErrorMessage(err.message || "Error running YOLO inference.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const temp = parseFloat(forecastInputs.temp);
    const pressure = parseFloat(forecastInputs.pressure);
    const speed = parseFloat(forecastInputs.speed);

    if (temp < 400 || temp > 550) return setErrorMessage("⚠️ Billet temperature must be between 400°C and 550°C.");
    if (pressure < 5.0 || pressure > 45.0) return setErrorMessage("⚠️ Ram pressure must be between 5.0 and 45.0 MPa.");
    if (speed < 2.0 || speed > 30.0) return setErrorMessage("⚠️ Extrusion speed must be between 2.0 and 30.0 mm/s.");

    setIsProcessing(true);
    try {
      const res = await fetch(`${backendUrl}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp, pressure, speed }),
      });
      if (!res.ok) throw new Error(`Inference failed: ${res.statusText}`);
      const result = await res.json();
      const forecastPoints: number[] = result.forecast;

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

    const vibration = parseFloat(classInputs.vibration);
    const temperature = parseFloat(classInputs.temperature);
    const pressure = parseFloat(classInputs.pressure);
    const rms_vibration = parseFloat(classInputs.rms_vibration);
    const mean_temp = parseFloat(classInputs.mean_temp);

    if (vibration < 0.1 || vibration > 1.0) return setErrorMessage("⚠️ Vibration must be between 0.1 and 1.0 mm/s.");
    if (temperature < 50.0 || temperature > 130.0) return setErrorMessage("⚠️ Temperature must be between 50.0°C and 130.0°C.");
    if (pressure < 7.0 || pressure > 10.0) return setErrorMessage("⚠️ Pressure must be between 7.0 and 10.0 bar.");
    if (rms_vibration < 0.5 || rms_vibration > 0.7) return setErrorMessage("⚠️ RMS Vibration must be between 0.5 and 0.7.");
    if (mean_temp < 80.0 || mean_temp > 100.0) return setErrorMessage("⚠️ Mean Temp must be between 80.0°C and 100.0°C.");

    setIsProcessing(true);
    try {
      const res = await fetch(`${backendUrl}/api/industrial-fault-classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibration, temperature, pressure, rms_vibration, mean_temp }),
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

    const targeted_productivity = parseFloat(regInputs.targeted_productivity);
    const smv = parseFloat(regInputs.smv);
    const over_time = parseInt(regInputs.over_time);
    const incentive = parseInt(regInputs.incentive);
    const no_of_workers = parseFloat(regInputs.no_of_workers);

    if (targeted_productivity < 0.05 || targeted_productivity > 0.9) return setErrorMessage("⚠️ Targeted productivity must be between 0.05 and 0.90.");
    if (smv < 2.0 || smv > 60.0) return setErrorMessage("⚠️ SMV must be between 2.0 and 60.0 minutes.");
    if (over_time < 0 || over_time > 30000) return setErrorMessage("⚠️ Over time must be between 0 and 30,000 minutes.");
    if (incentive < 0 || incentive > 5000) return setErrorMessage("⚠️ Incentive must be between 0 and 5,000 BDT.");
    if (no_of_workers < 2.0 || no_of_workers > 100.0) return setErrorMessage("⚠️ Number of workers must be between 2 and 100.");

    setIsProcessing(true);
    try {
      const res = await fetch(`${backendUrl}/api/garments-regression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targeted_productivity, smv, over_time, incentive, no_of_workers }),
      });
      if (!res.ok) throw new Error(`Inference failed: ${res.statusText}`);
      const result = await res.json();
      
      const predictedVal = Number(result.predicted_productivity.toFixed(3));
      setChartData([
        { name: 'Target Productivity', value: targeted_productivity },
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
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Cpu size={20} className="text-blue-500" />
                      Select Machine Learning Task
                    </h3>
                    <p className='text-xs text-slate-500 mt-1 mb-2 md:mb-0 max-w-xl'>
                      Each is intended to demonstrate what the output of the respective task looks like, rather than to assess the accuracy of the outputs.
                    </p>
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
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium">Billet Temp (°C)</label>
                            <span className="text-xs text-slate-400">400 - 550</span>
                          </div>
                          <input type="number" step="0.5" required min="400" max="550" value={forecastInputs.temp} onChange={(e) => setForecastInputs({ ...forecastInputs, temp: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium">Ram Pressure (MPa)</label>
                            <span className="text-xs text-slate-400">5 - 45</span>
                          </div>
                          <input type="number" step="0.1" required min="5" max="45" value={forecastInputs.pressure} onChange={(e) => setForecastInputs({ ...forecastInputs, pressure: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium">Extrusion Speed (mm/s)</label>
                            <span className="text-xs text-slate-400">2 - 30</span>
                          </div>
                          <input type="number" step="0.1" required min="2" max="30" value={forecastInputs.speed} onChange={(e) => setForecastInputs({ ...forecastInputs, speed: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <button type="submit" disabled={isProcessing} className="mt-2 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                          {isProcessing ? 'Running Model...' : 'Generate Forecast'}
                        </button>
                      </form>
                    )}

                    {/* INDUSTRIAL FAULT CLASSIFICATION FORM */}
                    {analyticsType === 'classification' && (
                      <form onSubmit={handleFaultClassify} className="flex flex-col gap-3 text-sm">
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Vibration (mm/s)</label>
                            <span className="text-[10px] text-slate-400">0.1 - 1.0</span>
                          </div>
                          <input type="number" step="0.01" required min="0.1" max="1.0" value={classInputs.vibration} onChange={(e) => setClassInputs({ ...classInputs, vibration: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Temperature (°C)</label>
                            <span className="text-[10px] text-slate-400">50 - 130</span>
                          </div>
                          <input type="number" step="0.1" required min="50" max="130" value={classInputs.temperature} onChange={(e) => setClassInputs({ ...classInputs, temperature: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Pressure (bar)</label>
                            <span className="text-[10px] text-slate-400">7 - 10</span>
                          </div>
                          <input type="number" step="0.01" required min="7" max="10" value={classInputs.pressure} onChange={(e) => setClassInputs({ ...classInputs, pressure: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">RMS Vibration</label>
                            <span className="text-[10px] text-slate-400">0.5 - 0.7</span>
                          </div>
                          <input type="number" step="0.001" required min="0.5" max="0.7" value={classInputs.rms_vibration} onChange={(e) => setClassInputs({ ...classInputs, rms_vibration: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Mean Temp (°C)</label>
                            <span className="text-[10px] text-slate-400">80 - 100</span>
                          </div>
                          <input type="number" step="0.1" required min="80" max="100" value={classInputs.mean_temp} onChange={(e) => setClassInputs({ ...classInputs, mean_temp: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <button type="submit" disabled={isProcessing} className="mt-2 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                          {isProcessing ? 'Analyzing...' : 'Classify Fault State'}
                        </button>
                      </form>
                    )}

                    {/* GARMENT WORKER PRODUCTIVITY REGRESSION FORM */}
                    {analyticsType === 'regression' && (
                      <form onSubmit={handleGarmentRegress} className="flex flex-col gap-3 text-sm">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <label className="text-slate-600 font-medium text-xs">Targeted Productivity</label>
                              <div className="relative group cursor-pointer">
                                <Info size={13} className="text-slate-400 hover:text-blue-600" />
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                  Targeted productivity set by Authority (0.05 - 0.90).
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">0.05 - 0.90</span>
                          </div>
                          <input type="number" step="0.01" min="0.05" max="0.90" required value={regInputs.targeted_productivity} onChange={(e) => setRegInputs({ ...regInputs, targeted_productivity: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <label className="text-slate-600 font-medium text-xs">SMV</label>
                              <div className="relative group cursor-pointer">
                                <Info size={13} className="text-slate-400 hover:text-blue-600" />
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                  Standard Minute Value, allocated time for a task (2 - 60).
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">2 - 60 min</span>
                          </div>
                          <input type="number" step="0.01" min="2" max="60" required value={regInputs.smv} onChange={(e) => setRegInputs({ ...regInputs, smv: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <label className="text-slate-600 font-medium text-xs">Over Time</label>
                              <div className="relative group cursor-pointer">
                                <Info size={13} className="text-slate-400 hover:text-blue-600" />
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                  Amount of overtime by team in minutes (0 - 30000).
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">0 - 30k min</span>
                          </div>
                          <input type="number" step="1" min="0" max="30000" required value={regInputs.over_time} onChange={(e) => setRegInputs({ ...regInputs, over_time: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <label className="text-slate-600 font-medium text-xs">Incentive (BDT)</label>
                              <div className="relative group cursor-pointer">
                                <Info size={13} className="text-slate-400 hover:text-blue-600" />
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                  Financial incentive in BDT (0 - 5000).
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">0 - 5000 BDT</span>
                          </div>
                          <input type="number" step="1" min="0" max="5000" required value={regInputs.incentive} onChange={(e) => setRegInputs({ ...regInputs, incentive: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <label className="text-slate-600 font-medium text-xs">Number of Workers</label>
                              <div className="relative group cursor-pointer">
                                <Info size={13} className="text-slate-400 hover:text-blue-600" />
                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[11px] rounded shadow-lg z-20 text-center">
                                  Number of workers in each team (2 - 100).
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">2 - 100</span>
                          </div>
                          <input type="number" step="0.5" min="2" max="100" required value={regInputs.no_of_workers} onChange={(e) => setRegInputs({ ...regInputs, no_of_workers: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none" />
                        </div>

                        <button type="submit" disabled={isProcessing} className="mt-2 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
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
                      <p className="text-xs text-slate-500">Live feed showing exact parameter input columns and model outputs tested by visitors.</p>
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
                              <th className="py-3 px-4 font-semibold">Current Yield Output</th>
                            </>
                          )}
                          {analyticsType === 'classification' && (
                            <>
                              <th className="py-3 px-4 font-semibold">Vibration</th>
                              <th className="py-3 px-4 font-semibold">Temp (°C)</th>
                              <th className="py-3 px-4 font-semibold">Pressure</th>
                              <th className="py-3 px-4 font-semibold">RMS Vib.</th>
                              <th className="py-3 px-4 font-semibold">Mean Temp</th>
                              <th className="py-3 px-4 font-semibold">Predicted Fault Result</th>
                            </>
                          )}
                          {analyticsType === 'regression' && (
                            <>
                              <th className="py-3 px-4 font-semibold">Target Prod.</th>
                              <th className="py-3 px-4 font-semibold">SMV</th>
                              <th className="py-3 px-4 font-semibold">Over Time</th>
                              <th className="py-3 px-4 font-semibold">Incentive</th>
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
                                  <td className="py-3 px-4 font-semibold text-blue-600 font-mono">
                                    {log.outputs?.forecast ? Number(log.outputs.forecast[0]).toFixed(1) + '%' : '-'}
                                  </td>
                                </>
                              )}
                              {analyticsType === 'classification' && (
                                <>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.vibration}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.temperature}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.pressure}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.rms_vibration}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.mean_temp}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800 text-xs font-mono">
                                    {log.outputs?.probabilities ? log.outputs.probabilities.map((p: number, i: number) => `C${i}: ${(p * 100).toFixed(1)}%`).join(' | ') : '-'}
                                  </td>
                                </>
                              )}
                              {analyticsType === 'regression' && (
                                <>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.targeted_productivity}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.smv}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.over_time}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.incentive}</td>
                                  <td className="py-3 px-4 font-medium text-slate-800">{log.inputs?.no_of_workers}</td>
                                  <td className="py-3 px-4 font-semibold text-emerald-600">{log.outputs?.predicted_productivity?.toFixed(3)}</td>
                                </>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 text-sm">No visitor submissions found for this task yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
            
            {/* COMPUTER VISION TAB */}
            {activeTab === 'cv' && (
              <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row items-center justify-between bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Eye size={20} className="text-blue-500" />
                      Computer Vision Object Detection
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload an image to run bounding box object detection. Click any box overlay to inspect details.
                    </p>
                  </div>
                  <label className="mt-4 md:mt-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                    <Upload size={16} />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                  {/* Image Display & Bounding Box Overlays */}
                  <div className="flex-1 border border-slate-200 rounded-xl bg-slate-900 flex flex-col items-center justify-center p-6 relative min-h-[460px] overflow-hidden">
                    {selectedImage ? (
                      <div className="relative inline-block w-full h-full flex items-center justify-center">
                        <img 
                          id="cv-uploaded-img"
                          src={selectedImage} 
                          alt="Uploaded CV Preview" 
                          className="max-h-[440px] w-full object-contain rounded-lg"
                        />
                        {/* Bounding Box Overlays (Labels & Conf text removed per instructions) */}
                        {imageDimensions.width > 0 && detections.map((det, idx) => {
                          const [xmin, ymin, xmax, ymax] = det.box;
                          const leftPct = (xmin / imageDimensions.width) * 100;
                          const topPct = (ymin / imageDimensions.height) * 100;
                          const widthPct = ((xmax - xmin) / imageDimensions.width) * 100;
                          const heightPct = ((ymax - ymin) / imageDimensions.height) * 100;

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedDetection(det)}
                              style={{
                                left: `${leftPct}%`,
                                top: `${topPct}%`,
                                width: `${widthPct}%`,
                                height: `${heightPct}%`,
                              }}
                              className="absolute border-2 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/40 cursor-pointer transition-all rounded"
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 text-center p-8">
                        <Upload size={48} className="mb-3 text-slate-600" />
                        <p className="text-sm font-medium">No image uploaded yet.</p>
                        <p className="text-xs text-slate-500 mt-1">Click "Upload Image" above to test object detection.</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Results / Summary */}
                  <div className="w-full md:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Activity size={18} className="text-emerald-500" />
                        Detection Summary
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        {detections.length > 0 ? `Found ${detections.length} object(s) in image.` : 'Run detection to inspect bounding boxes.'}
                      </p>

                      {selectedImage && (
                        <button
                          onClick={handleRunCV}
                          disabled={isProcessing}
                          className="w-full mb-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? 'Running...' : 'Run Detection'}
                        </button>
                      )}

                      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto">
                        {detections.map((det, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedDetection(det)}
                            className="p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500 transition-all flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-800 uppercase">{det.label}</span>
                              <p className="text-slate-400 text-[10px]">Conf: {(det.confidence * 100).toFixed(1)}%</p>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                              View Box
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-600 mt-4">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* POPUP MODAL FOR DETAILED CROP INFO */}
                {selectedDetection && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Eye size={20} className="text-blue-600" />
                          Detection Details
                        </h3>
                        <button 
                          onClick={() => setSelectedDetection(null)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Cropped Image Preview */}
                      {croppedImageUrl && (
                        <div className="mb-4 bg-slate-900 rounded-xl p-3 flex items-center justify-center max-h-[160px] overflow-hidden">
                          <img 
                            src={croppedImageUrl} 
                            alt="Cropped object preview" 
                            className="max-h-[140px] w-auto object-contain rounded border border-slate-700" 
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-2.5 text-sm text-slate-600">
                        <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg">
                          <span className="font-medium text-slate-500">Object Label:</span>
                          <span className="font-bold text-slate-900 uppercase">{selectedDetection.label}</span>
                        </div>
                        <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg">
                          <span className="font-medium text-slate-500">Confidence Score:</span>
                          <span className="font-bold text-emerald-600 font-mono">{(selectedDetection.confidence * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg">
                          <span className="font-medium text-slate-500">Center Location (X, Y):</span>
                          <span className="font-mono text-slate-800">({selectedDetection.center_x}, {selectedDetection.center_y}) px</span>
                        </div>
                        <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg">
                          <span className="font-medium text-slate-500">Bounding Box [xmin, ymin, xmax, ymax]:</span>
                          <span className="font-mono text-xs text-slate-800">
                            [{selectedDetection.box.join(', ')}]
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedDetection(null)}
                        className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                )}
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