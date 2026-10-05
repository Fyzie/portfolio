"use client";

import { useState, useEffect, useRef } from 'react';
import { Eye, MessageSquare, Database, BarChart3, Settings, Wrench, Activity, RefreshCw, AlertCircle, Cpu, Info, Upload, X, Loader2, Send, Bot, User, Scale, Sparkles, Workflow } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for frontend storage fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    { id: 'agentic', label: 'Agentic AI', icon: <Workflow size={18} /> },
    { id: 'reinforcement', label: 'Reinforcement Learning', icon: <Workflow size={18} /> },
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

    if (vibration < 0.1 || vibration > 1.0) return setErrorMessage("⚠️ Vibration must be between 0.1 and 1.0 mm/s.");
    if (temperature < 50.0 || temperature > 130.0) return setErrorMessage("⚠️ Temperature must be between 50.0°C and 130.0°C.");
    if (pressure < 7.0 || pressure > 10.0) return setErrorMessage("⚠️ Pressure must be between 7.0 and 10.0 bar.");

    setIsProcessing(true);
    try {
      const res = await fetch(`${backendUrl}/api/industrial-fault-classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vibration, temperature, pressure }),
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

  // RAG Playground States
  const [ragMessages, setRagMessages] = useState<any[]>([
    { role: 'assistant', content: "Hello! I am your Factory Manual assistant. Ask me anything about what are in the manuals." }
  ]);
  const [ragInput, setRagInput] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragDiagnostics, setRagDiagnostics] = useState({ 
    numSourceNodes: 0, 
    sourceNodesDetails: [] as Array<{ score?: number; text: string; metadata?: any }> 
  });
  const [selectedFileModal, setSelectedFileModal] = useState<{ title: string; content: string } | null>(null);
  const [loadingFileFromStorage, setLoadingFileFromStorage] = useState(false);
  const ragMessagesEndRef = useRef<HTMLDivElement>(null);

  // Agentic AI States
  const [agentMessages, setAgentMessages] = useState<any[]>([
    { role: 'assistant', content: "Hello! Describe a machinery fault or issue related to the manuals." }
  ]);
  const [agentInput, setAgentInput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);

  // Inventory Management States in Agentic Tab
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedItemForUpdate, setSelectedItemForUpdate] = useState<any | null>(null);
  const [newStockValue, setNewStockValue] = useState(0);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const fetchInventoryData = async (searchQuery = '') => {
    setInventoryLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/inventory?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setInventoryItems(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load inventory", err);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'agentic') {
      fetchInventoryData(inventorySearch);
    }
  }, [activeTab, inventorySearch]);

  const handleUpdateStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForUpdate) return;
    try {
      const res = await fetch(`${backendUrl}/api/inventory/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: selectedItemForUpdate.id, new_stock: Number(newStockValue) })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSelectedItemForUpdate(null);
        fetchInventoryData(inventorySearch);
      }
    } catch (err) {
      alert("Failed to update stock.");
    }
  };

  const handleAgentSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = agentInput.trim();
    if (!trimmed || agentLoading) return;

    setAgentMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setAgentInput('');
    setAgentLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/agentic-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue: trimmed }),
      });
      if (!res.ok) throw new Error("Agentic dispatch failed");
      const data = await res.json();
      setAgentMessages(prev => [...prev, { role: 'assistant', content: data.ticket_summary }]);
    } catch (err) {
      setAgentMessages(prev => [...prev, { role: 'assistant', content: "Error executing agentic workflow." }]);
    } finally {
      setAgentLoading(false);
    }
  };

  {/* Add Item States */}
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemStock, setNewItemStock] = useState(10);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Pagination States for Inventory Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate sliced items for current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInventoryItems = inventoryItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(inventoryItems.length / itemsPerPage) || 1;

  // Reset to page 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [inventorySearch]);

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setIsAddingItem(true);
    try {
      const res = await fetch(`${backendUrl}/api/inventory/add-smart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: newItemName.trim(), stock_number: Number(newItemStock) })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsAddModalOpen(false);
        setNewItemName('');
        setNewItemStock(10);
        fetchInventoryData(inventorySearch);
      } else {
        alert(data.detail || "Failed to add item.");
      }
    } catch (err: any) {
      alert("Storage limit reached (Max 100 items).");
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleResetERP = async () => {
    if (!confirm("Are you sure you want to reset the ERP inventory back to its original state? All custom added items will be cleared.")) return;
    setIsResetting(true);
    try {
      const res = await fetch(`${backendUrl}/api/inventory/reset`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setInventorySearch('');
        fetchInventoryData('');
        alert("ERP Inventory reset successfully!");
      } else {
        alert("Failed to reset ERP.");
      }
    } catch (err) {
      alert("Error resetting ERP inventory.");
    } finally {
      setIsResetting(false);
    }
  };

  // Multi-Persona Debater States
  const [debateTopic, setDebateTopic] = useState("Engineers VS Technicians?");
  const [debateLoading, setDebateLoading] = useState(false);
  const [debateResult, setDebateResult] = useState<{ architect: string; evangelist: string; moderator: string; model_used: string } | null>(null);
  const [debateError, setDebateError] = useState('');

  const debatePresets = [
    "Engineers VS Technicians?",
    "Will AI code assistants make junior software engineers obsolete?",
    "Should assembly lines rely on human craftsmanship or full robotics?"
  ];

  const handleFetchManualFromSupabase = async (fileName: string, title: string) => {
    setLoadingFileFromStorage(true);
    try {
      const { data } = supabase.storage
        .from('factory manuals')
        .getPublicUrl(fileName);

      const res = await fetch(data.publicUrl);
      if (!res.ok) throw new Error("Failed to fetch file from Supabase Storage.");

      const jsonData = await res.json();
      setSelectedFileModal({
        title: title,
        content: JSON.stringify(jsonData, null, 2)
      });
    } catch (err: any) {
      console.error(err);
      alert(`Could not load ${fileName} from Supabase Storage. Ensure bucket 'factory manuals' is public and file exists.`);
    } finally {
      setLoadingFileFromStorage(false);
    }
  };

  const handleRagSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ragInput.trim();
    if (!trimmed || ragLoading) return;

    setRagMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setRagInput('');
    setRagLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/playground-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error("Failed to query factory manual knowledge base");

      const data = await res.json();
      setRagMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      setRagDiagnostics({
        numSourceNodes: data.num_source_nodes || 0,
        sourceNodesDetails: data.source_nodes_details || []
      });
    } catch (err: any) {
      setRagMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error querying the factory manual database." }]);
    } finally {
      setRagLoading(false);
    }
  };

  const handleStartDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debateTopic.trim() || debateLoading) return;

    setDebateLoading(true);
    setDebateError('');
    setDebateResult(null);

    try {
      const res = await fetch(`${backendUrl}/api/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: debateTopic }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate debate simulation.");
      }

      const data = await res.json();
      setDebateResult({
        architect: data.architect,
        evangelist: data.evangelist,
        moderator: data.moderator,
        model_used: data.model_used
      });
    } catch (err: any) {
      setDebateError(err.message || "Error running AI debate simulation.");
    } finally {
      setDebateLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-4 py-8 sm:px-8 md:p-15 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-4 tracking-tight">AI Playground</h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl">
            Interactive demos. Select a domain below to test live models and data pipelines.
          </p>
        </div>

        {/* Responsive Tab Selector */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 bg-slate-200/50 p-1.5 sm:p-2 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
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

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[500px] sm:min-h-[600px]">
          <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="font-bold text-slate-700 flex items-center gap-2 text-xs sm:text-sm truncate pr-2">
              <Wrench size={18} className="text-slate-500 shrink-0" />
              <span className="truncate">Demo Environment: {tabs.find(t => t.id === activeTab)?.label}</span>
            </div>
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></span>
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></span>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 flex-1 flex flex-col">
            
            {activeTab === 'analytics' && (
              <div className="flex-1 flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-500">
                
                {/* Task Selector Dropdown */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Cpu size={20} className="text-blue-500 shrink-0" />
                      Select Machine Learning Task
                    </h3>
                    <p className='text-xs text-slate-500 mt-1 max-w-xl'>
                      Each is intended to demonstrate what the output of the respective task looks like, rather than to assess the accuracy of the outputs.
                    </p>
                  </div>
                  <select 
                    value={analyticsType} 
                    onChange={(e) => setAnalyticsType(e.target.value)}
                    className="w-full md:w-auto px-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium text-xs sm:text-sm cursor-pointer"
                  >
                    <option value="classification">Classification (Industrial Fault Detection)</option>
                    <option value="regression">Regression (Garment Worker Productivity)</option>
                    <option value="forecast">Multi-Step Forecasting (Aluminum Yield)</option>
                  </select>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                  {/* Controls Sidebar */}
                  <div className="w-full lg:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 h-fit">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Activity size={20} className="text-orange-500 shrink-0" />
                        <h3 className="font-bold text-base sm:text-lg">
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
                            <label className="text-slate-600 font-medium text-xs sm:text-sm">Billet Temp (°C)</label>
                            <span className="text-xs text-slate-400">400 - 550</span>
                          </div>
                          <input type="number" step="0.5" required min="400" max="550" value={forecastInputs.temp} onChange={(e) => setForecastInputs({ ...forecastInputs, temp: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs sm:text-sm">Ram Pressure (MPa)</label>
                            <span className="text-xs text-slate-400">5 - 45</span>
                          </div>
                          <input type="number" step="0.1" required min="5" max="45" value={forecastInputs.pressure} onChange={(e) => setForecastInputs({ ...forecastInputs, pressure: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs sm:text-sm">Extrusion Speed (mm/s)</label>
                            <span className="text-xs text-slate-400">2 - 30</span>
                          </div>
                          <input type="number" step="0.1" required min="2" max="30" value={forecastInputs.speed} onChange={(e) => setForecastInputs({ ...forecastInputs, speed: e.target.value })} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>
                        <button type="submit" disabled={isProcessing} className="mt-2 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
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
                          <input type="number" step="0.01" required min="0.1" max="1.0" value={classInputs.vibration} onChange={(e) => setClassInputs({ ...classInputs, vibration: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Temperature (°C)</label>
                            <span className="text-[10px] text-slate-400">50 - 130</span>
                          </div>
                          <input type="number" step="0.1" required min="50" max="130" value={classInputs.temperature} onChange={(e) => setClassInputs({ ...classInputs, temperature: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Pressure (bar)</label>
                            <span className="text-[10px] text-slate-400">7 - 10</span>
                          </div>
                          <input type="number" step="0.01" required min="7" max="10" value={classInputs.pressure} onChange={(e) => setClassInputs({ ...classInputs, pressure: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>
                        <button type="submit" disabled={isProcessing} className="mt-2 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
                          {isProcessing ? 'Analyzing...' : 'Classify Fault State'}
                        </button>
                      </form>
                    )}

                    {/* GARMENT WORKER PRODUCTIVITY REGRESSION FORM */}
                    {analyticsType === 'regression' && (
                      <form onSubmit={handleGarmentRegress} className="flex flex-col gap-3 text-sm">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Targeted Productivity</label>
                            <span className="text-[10px] text-slate-400">0.05 - 0.90</span>
                          </div>
                          <input type="number" step="0.01" min="0.05" max="0.90" required value={regInputs.targeted_productivity} onChange={(e) => setRegInputs({ ...regInputs, targeted_productivity: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">SMV (min)</label>
                            <span className="text-[10px] text-slate-400">2 - 60</span>
                          </div>
                          <input type="number" step="0.01" min="2" max="60" required value={regInputs.smv} onChange={(e) => setRegInputs({ ...regInputs, smv: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Over Time (min)</label>
                            <span className="text-[10px] text-slate-400">0 - 30k</span>
                          </div>
                          <input type="number" step="1" min="0" max="30000" required value={regInputs.over_time} onChange={(e) => setRegInputs({ ...regInputs, over_time: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Incentive (BDT)</label>
                            <span className="text-[10px] text-slate-400">0 - 5000</span>
                          </div>
                          <input type="number" step="1" min="0" max="5000" required value={regInputs.incentive} onChange={(e) => setRegInputs({ ...regInputs, incentive: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-600 font-medium text-xs">Number of Workers</label>
                            <span className="text-[10px] text-slate-400">2 - 100</span>
                          </div>
                          <input type="number" step="0.5" min="2" max="100" required value={regInputs.no_of_workers} onChange={(e) => setRegInputs({ ...regInputs, no_of_workers: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 outline-none text-sm" />
                        </div>

                        <button type="submit" disabled={isProcessing} className="mt-2 w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
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
                  <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 flex flex-col p-4 sm:p-6">
                    <div className="mb-4 text-left">
                      <h4 className="font-semibold text-slate-800 text-sm sm:text-base">
                        {analyticsType === 'forecast' && "Yield Forecast Trajectory"}
                        {analyticsType === 'classification' && "Fault Class Probability Distribution (%)"}
                        {analyticsType === 'regression' && "Worker Productivity Score (0 to 1)"}
                      </h4>
                      <p className="text-xs text-slate-500">Live model output visualization.</p>
                    </div>

                    <div className="w-full h-[280px] sm:h-[320px]">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {analyticsType === 'forecast' ? (
                            <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="step" stroke="#64748b" fontSize={11} />
                              <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} />
                              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Current Baseline" dot={{ r: 3 }} />
                              <Line type="monotone" dataKey="forecast" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" name="Future Forecast (T+1 to T+4)" dot={{ r: 3 }} />
                            </LineChart>
                          ) : (
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                              <YAxis stroke="#64748b" fontSize={11} domain={analyticsType === 'classification' ? [0, 100] : [0, 1]} tickFormatter={(val) => analyticsType === 'classification' ? `${val}%` : val.toFixed(2)} />
                              <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }} />
                              <Bar dataKey={analyticsType === 'classification' ? "probability" : "value"} radius={[4, 4, 0, 0]} maxBarSize={50}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs sm:text-sm">
                          Loading database entries...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Recent Visitor Logs Table */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 sm:p-6 overflow-hidden">
                  <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm sm:text-base">Recent Submissions ({analyticsType.toUpperCase()})</h4>
                      <p className="text-xs text-slate-500">Live feed showing exact parameter input columns and model outputs tested by visitors.</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full shrink-0">
                      Top 5 Live Logs
                    </span>
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <table className="w-full text-left text-xs sm:text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider">
                          <th className="py-3 px-3 font-semibold">Time</th>
                          {analyticsType === 'forecast' && (
                            <>
                              <th className="py-3 px-3 font-semibold">Billet Temp (°C)</th>
                              <th className="py-3 px-3 font-semibold">Ram Pressure (MPa)</th>
                              <th className="py-3 px-3 font-semibold">Speed (mm/s)</th>
                              <th className="py-3 px-3 font-semibold">Current Yield Output</th>
                            </>
                          )}
                          {analyticsType === 'classification' && (
                            <>
                              <th className="py-3 px-3 font-semibold">Vibration</th>
                              <th className="py-3 px-3 font-semibold">Temp (°C)</th>
                              <th className="py-3 px-3 font-semibold">Pressure</th>
                              <th className="py-3 px-3 font-semibold">Predicted Fault Result</th>
                            </>
                          )}
                          {analyticsType === 'regression' && (
                            <>
                              <th className="py-3 px-3 font-semibold">Target Prod.</th>
                              <th className="py-3 px-3 font-semibold">SMV</th>
                              <th className="py-3 px-3 font-semibold">Over Time</th>
                              <th className="py-3 px-3 font-semibold">Incentive</th>
                              <th className="py-3 px-3 font-semibold">Workers</th>
                              <th className="py-3 px-3 font-semibold">Predicted Actual</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {recentLogs.length > 0 ? (
                          recentLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/60 transition-colors">
                              <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                                {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                              </td>
                              {analyticsType === 'forecast' && (
                                <>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.temp}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.pressure}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.speed}</td>
                                  <td className="py-3 px-3 font-semibold text-blue-600 font-mono">
                                    {log.outputs?.forecast ? Number(log.outputs.forecast[0]).toFixed(1) + '%' : '-'}
                                  </td>
                                </>
                              )}
                              {analyticsType === 'classification' && (
                                <>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.vibration}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.temperature}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.pressure}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800 text-[11px] font-mono">
                                    {log.outputs?.probabilities ? log.outputs.probabilities.map((p: number, i: number) => `C${i}: ${(p * 100).toFixed(1)}%`).join(' | ') : '-'}
                                  </td>
                                </>
                              )}
                              {analyticsType === 'regression' && (
                                <>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.targeted_productivity}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.smv}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.over_time}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.incentive}</td>
                                  <td className="py-3 px-3 font-medium text-slate-800">{log.inputs?.no_of_workers}</td>
                                  <td className="py-3 px-3 font-semibold text-emerald-600">{log.outputs?.predicted_productivity?.toFixed(3)}</td>
                                </>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400 text-xs sm:text-sm">No visitor submissions found for this task yet.</td>
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
              <div className="flex-1 flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Eye size={20} className="text-blue-500 shrink-0" />
                      Computer Vision Object Detection
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Upload an image to run bounding box object detection. Click any box overlay to inspect details.
                    </p>
                  </div>
                  <label className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shrink-0">
                    <Upload size={16} />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                  {/* Image Display & Bounding Box Overlays */}
                  <div className="flex-1 border border-slate-200 rounded-xl bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 relative min-h-[350px] sm:min-h-[460px] overflow-hidden">
                    {selectedImage ? (
                      <div className="relative inline-block w-full h-full flex items-center justify-center">
                        <img 
                          id="cv-uploaded-img"
                          src={selectedImage} 
                          alt="Uploaded CV Preview" 
                          className="max-h-[350px] sm:max-h-[440px] w-full object-contain rounded-lg"
                        />
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
                      <div className="flex flex-col items-center justify-center text-slate-400 text-center p-6 sm:p-8">
                        <Upload size={40} className="mb-3 text-slate-600" />
                        <p className="text-xs sm:text-sm font-medium">No image uploaded yet.</p>
                        <p className="text-xs text-slate-500 mt-1">Click "Upload Image" above to test object detection.</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Results / Summary */}
                  <div className="w-full lg:w-1/3 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <Activity size={18} className="text-emerald-500 shrink-0" />
                        Detection Summary
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        {detections.length > 0 ? `Found ${detections.length} object(s) in image.` : 'Run detection to inspect bounding boxes.'}
                      </p>

                      {selectedImage && (
                        <button
                          onClick={handleRunCV}
                          disabled={isProcessing}
                          className="w-full mb-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm"
                        >
                          {isProcessing ? 'Running...' : 'Run Detection'}
                        </button>
                      )}

                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
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
                    <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                          <Eye size={20} className="text-blue-600 shrink-0" />
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
                        <div className="mb-4 bg-slate-900 rounded-xl p-3 flex items-center justify-center max-h-[150px] overflow-hidden">
                          <img 
                            src={croppedImageUrl} 
                            alt="Cropped object preview" 
                            className="max-h-[130px] w-auto object-contain rounded border border-slate-700" 
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                        <div className="flex justify-between bg-slate-50 p-2 sm:p-2.5 rounded-lg">
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
                          <span className="font-mono text-[11px] text-slate-800">
                            [{selectedDetection.box.join(', ')}]
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedDetection(null)}
                        className="mt-5 sm:mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        Close Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NLP / GEN AI TAB - MULTI-PERSONA AI DEBATER SIMULATOR */}
            {activeTab === 'nlp' && (
              <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
                <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-500 shrink-0" />
                    Multi-Persona AI Debater Simulator
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a suggested topic below or write your own custom motion. Two AI agents with opposing engineering philosophies will debate live.
                  </p>
                </div>

                {/* Clickable Preset Topic Cards */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles size={14} className="text-amber-500" />
                    Click a preset topic to instantly load it:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {debatePresets.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setDebateTopic(preset)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-xs sm:text-sm ${
                          debateTopic === preset 
                            ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm font-semibold' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <p className="line-clamp-2">{preset}</p>
                        <span className="text-[10px] text-blue-600 mt-2 font-medium flex items-center gap-1">
                          Click to select →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Debate Input Form */}
                <form onSubmit={handleStartDebate} className="bg-white p-4 sm:p-6 border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Or write your own custom motion:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={debateTopic}
                        onChange={(e) => setDebateTopic(e.target.value)}
                        placeholder="e.g. Should monolithic architectures be abandoned for microservices?"
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                        required
                      />
                      <button 
                        type="submit" 
                        disabled={debateLoading || !debateTopic.trim()}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-xs sm:text-sm disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                      >
                        {debateLoading ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                        <span>{debateLoading ? 'Simulating Debate...' : 'Start Debate'}</span>
                      </button>
                    </div>
                  </div>

                  {debateError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-600">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{debateError}</span>
                    </div>
                  )}
                </form>

                {/* Debate Output Area */}
                <div className="flex flex-col gap-4">
                  {debateLoading && (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 gap-3 shadow-sm">
                      <Loader2 size={32} className="animate-spin text-blue-600" />
                      <p className="text-xs sm:text-sm font-medium">Orchestrating multi-persona debate agents...</p>
                    </div>
                  )}

                  {debateResult && !debateLoading && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
                      {/* Persona A: Pragmatic Architect */}
                      <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            PA
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">The Pragmatic Architect</h4>
                            <p className="text-[10px] text-slate-400">Position: Pro-Simplicity & Low Operational Overhead</p>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans pl-10">
                          {debateResult.architect}
                        </p>
                      </div>

                      {/* Persona B: Scalability Evangelist */}
                      <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            SE
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">The Scalability Evangelist</h4>
                            <p className="text-[10px] text-slate-400">Position: Pro-Decoupling & Future-Proofing</p>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans pl-10">
                          {debateResult.evangelist}
                        </p>
                      </div>

                      {/* Moderator Summary & Verdict */}
                      <div className="bg-slate-900 text-slate-100 rounded-xl p-5 shadow-md relative overflow-hidden border border-slate-800">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                            <Scale size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs sm:text-sm">Technical Moderator Verdict</h4>
                            <p className="text-[10px] text-slate-400 font-mono">Model executed: {debateResult.model_used}</p>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans pl-10">
                          {debateResult.moderator}
                        </p>
                      </div>
                    </div>
                  )}

                  {!debateResult && !debateLoading && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs sm:text-sm">
                      Click any topic card above or click "Start Debate" to test the simulation.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* RAG SYSTEMS TAB - FACTORY MANUAL GUIDANCE (SUPABASE STORAGE INTEGRATION) */}
            {activeTab === 'rag' && (
              <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-500">
                <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Database size={20} className="text-blue-500 shrink-0" />
                    Factory SOP & Manual Assistant
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    An AI assistant that helps factory personnel quickly find, understand, and follow guidance from factory manuals and technical documents.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* LEFT: Factory Manual Files fetched from Supabase Storage */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      <Wrench size={16} className="text-orange-500" />
                      Supabase Storage Manuals
                    </h4>
                    
                    <div 
                      onClick={() => handleFetchManualFromSupabase('manual1.json', 'Index 1: manual1.json')}
                      className="p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 transition-all shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Database size={24} className="text-blue-600 shrink-0" />
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs sm:text-sm">Index 1</h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">Click to preview</p>
                        </div>
                      </div>
                      {loadingFileFromStorage && <Loader2 size={16} className="animate-spin text-blue-600" />}
                    </div>

                    <div 
                      onClick={() => handleFetchManualFromSupabase('manual2.json', 'Index 2: manual2.json')}
                      className="p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 transition-all shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Database size={24} className="text-emerald-600 shrink-0" />
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs sm:text-sm">Index 2</h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">Click to preview</p>
                        </div>
                      </div>
                      {loadingFileFromStorage && <Loader2 size={16} className="animate-spin text-emerald-600" />}
                    </div>
                  </div>

                  {/* RIGHT: Chat Section */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col h-[420px] shadow-sm">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 flex items-center gap-2">
                      <MessageSquare size={16} className="text-blue-600" />
                      <span>Chat Assistant</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs sm:text-sm bg-slate-50/50">
                      {ragMessages.map((msg, idx) => (
                        <div key={idx} className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white self-end rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 shadow-sm self-start rounded-bl-none'}`}>
                          {msg.content}
                        </div>
                      ))}
                      {ragLoading && (
                        <div className="bg-white text-slate-500 border border-slate-200 shadow-sm self-start rounded-xl p-3 flex items-center gap-2 text-xs">
                          <Loader2 size={14} className="animate-spin text-blue-600 shrink-0" />
                          <span>Searching factory manual vector database...</span>
                        </div>
                      )}
                      <div ref={ragMessagesEndRef} />
                    </div>

                    <form onSubmit={handleRagSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                      <input 
                        type="text" 
                        value={ragInput} 
                        onChange={(e) => setRagInput(e.target.value)} 
                        placeholder="Ask about any common factory operation procedure..."
                        className="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="submit" disabled={ragLoading || !ragInput.trim()} className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                </div>

                {/* BELOW: Answer Drift & Vector Retrieval Diagnostics Panel (RESTORED FULL GUI) */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                      <Activity size={16} className="text-indigo-500" />
                      Answer Drift & Vector Retrieval Diagnostics
                    </h4>
                    <span className="text-[11px] bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full font-mono">
                      Collection: playground_knowledge
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Real-time telemetry showing exact source answers and chunk context retrieved for your query.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                      <span className="text-xs text-slate-400 font-medium">Source Nodes Retrieved</span>
                      <span className="text-2xl font-extrabold text-slate-800 mt-1 font-mono">{ragDiagnostics.numSourceNodes}</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2 flex flex-col justify-center">
                      <span className="text-xs text-slate-400 font-medium">Retrieval Status</span>
                      <span className="text-sm font-bold text-gray-600 mt-1">
                        {ragDiagnostics.numSourceNodes > 0 ? "Active Context Linked Successfully" : "Awaiting Query"}
                      </span>
                    </div>
                  </div>

                  {/* Exact Answer / Chunk Breakdown Cards */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 font-bold block mb-3 uppercase tracking-wider">
                      Exact Answers / Chunks Used from Knowledge Base:
                    </span>
                    {ragDiagnostics.sourceNodesDetails.length > 0 ? (
                      <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
                        {ragDiagnostics.sourceNodesDetails.map((node, i) => (
                          <div key={i} className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-b border-slate-200 pb-1">
                              <span>Source Node #{i + 1} {node.metadata?.source ? `(${node.metadata.source})` : ''}</span>
                              {node.score !== undefined && node.score !== null && (
                                <span className="text-blue-600 font-bold">Similarity Score: {node.score.toFixed(3)}</span>
                              )}
                            </div>
                            <p className="font-mono text-slate-700 whitespace-pre-wrap leading-relaxed mt-1">
                              {node.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No query executed yet. Ask a question above to inspect the exact retrieved answers.</span>
                    )}
                  </div>
                </div>

                {/* SUPABASE STORAGE FILE PREVIEW MODAL POPUP */}
                {selectedFileModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                          <Database size={18} className="text-blue-600" />
                          {selectedFileModal.title}
                        </h3>
                        <button onClick={() => setSelectedFileModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-200 bg-slate-900 rounded-b-xl whitespace-pre-wrap leading-relaxed">
                        {selectedFileModal.content}
                      </div>

                      <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-white rounded-b-2xl">
                        <button onClick={() => setSelectedFileModal(null)} className="px-5 py-2 bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-900 transition-colors">
                          Close Window
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AGENTIC AI TAB */}
            {activeTab === 'agentic' && (
              <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500">
                <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Workflow size={20} className="text-blue-500 shrink-0" />
                    Autonomous Maintenance Dispatch Agent
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Autonomous dispatch agent executing RAG manual queries combined with live Supabase ERP inventory tool calls (MCP).
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Section 1: Chat Assistant */}
                  <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-[450px] shadow-sm">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-semibold text-xs sm:text-sm text-slate-700 flex items-center gap-2">
                      <Bot size={16} className="text-blue-600" />
                      <span>Chat Assistant</span>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs bg-slate-50/50">
                      {agentMessages.map((msg, idx) => (
                        <div key={idx} className={`p-3 rounded-xl max-w-[90%] leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white self-end rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 shadow-sm self-start rounded-bl-none'}`}>
                          {msg.content}
                        </div>
                      ))}
                      {agentLoading && (
                        <div className="bg-white text-slate-500 border border-slate-200 shadow-sm self-start rounded-xl p-3 flex items-center gap-2 text-xs">
                          <Loader2 size={14} className="animate-spin text-blue-600 shrink-0" />
                          <span>Agent executing RAG search & querying ERP inventory MCP...</span>
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleAgentSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                      <input 
                        type="text" 
                        value={agentInput} 
                        onChange={(e) => setAgentInput(e.target.value)} 
                        placeholder="Describe machinery fault (e.g. Press clicking & pressure dropping)..."
                        className="flex-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="submit" disabled={agentLoading || !agentInput.trim()} className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        <Send size={15} />
                      </button>
                    </form>
                  </div>

                  {/* Section 2: Index Manual Preview */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2 border-b pb-3">
                      <Database size={16} className="text-emerald-600" />
                      <span>Index Manual</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div 
                        onClick={() => handleFetchManualFromSupabase('manual3.json', 'Index 1: manual3.json')} 
                        className="p-3 bg-slate-50 border rounded-lg cursor-pointer hover:border-emerald-500 text-xs font-semibold text-slate-700 text-center flex items-center justify-center gap-2"
                      >
                        <Database size={16} className="text-emerald-600" />
                        <span>Index 1</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Click the manual above to inspect the knowledge base used by the agentic retrieval pipeline.
                    </p>
                  </div>
                </div>

                {/* Section 3 & 4: Inventory & Live Letter-by-Letter Search Input with Add Item & Reset Buttons */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-3">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                      <Wrench size={16} className="text-orange-500" />
                      <span>Inventory & ERP Live Stock Management</span>
                    </h4>
                    
                    {/* Buttons & Search Bar grouped on the right */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <span>+ Add Item</span>
                      </button>

                      {/* RESET BUTTON */}
                      <button 
                        onClick={handleResetERP}
                        disabled={isResetting}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                      >
                        {isResetting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        <span>{isResetting ? 'Resetting...' : 'Reset ERP'}</span>
                      </button>

                      <div className="w-full sm:w-56">
                        <input 
                          type="text"
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                          placeholder="Search item name..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inventory List Table (Slicing to 5 items per page) */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b text-slate-400 uppercase">
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3">Spare Part Type</th>
                          <th className="py-2.5 px-3">Current Stock</th>
                          <th className="py-2.5 px-3">Location / Dept</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inventoryLoading ? (
                          <tr><td colSpan={5} className="py-6 text-center text-slate-400">Loading inventory ERP database...</td></tr>
                        ) : currentInventoryItems.length > 0 ? (
                          currentInventoryItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-3 font-semibold text-slate-800">{item.item_name}</td>
                              <td className="py-3 px-3 text-slate-600">{item.spare_part_type}</td>
                              <td className="py-3 px-3 font-mono font-bold text-blue-600">{item.stock_number}</td>
                              <td className="py-3 px-3 text-slate-500">{item.item_place} ({item.department})</td>
                              <td className="py-3 px-3 text-right">
                                <button 
                                  onClick={() => { setSelectedItemForUpdate(item); setNewStockValue(item.stock_number); }}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-[11px]"
                                >
                                  Update Stock
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="py-6 text-center text-slate-400">No inventory items found matching "{inventorySearch}"</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer Counter & Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <span>
                      Showing {inventoryItems.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, inventoryItems.length)} of {inventoryItems.length} items
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-medium transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 font-mono font-bold text-slate-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-medium transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* ADD ITEM SMART POPUP MODAL */}
                {isAddModalOpen && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4 border-b pb-3">
                        <h3 className="font-bold text-slate-800 text-sm">Add New Inventory Item</h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                      </div>
                      <form onSubmit={handleAddItemSubmit} className="flex flex-col gap-4 text-xs">
                        <div>
                          <label className="font-medium text-slate-600 block mb-1">Item Name:</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Hydraulic Seal Kit A-20"
                            value={newItemName} 
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800" 
                          />
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 block mb-1">Number of Stock:</label>
                          <input 
                            type="number" 
                            min="0" 
                            required 
                            value={newItemStock} 
                            onChange={(e) => setNewItemStock(Number(e.target.value))}
                            className="w-full p-2.5 border rounded-lg font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-[11px] leading-relaxed">
                          ✨ <b>Agentic AI Feature:</b> Spare part type and location/department will be automatically classified by the LLM using factory manual knowledge upon submission.
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button type="submit" disabled={isAddingItem} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2">
                            {isAddingItem && <Loader2 size={14} className="animate-spin" />}
                            <span>{isAddingItem ? 'Classifying with RAG...' : 'OK (Submit)'}</span>
                          </button>
                          <button type="button" onClick={() => setIsAddModalOpen(false)} className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* UPDATE STOCK MODAL POPUP */}
                {selectedItemForUpdate && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4 border-b pb-3">
                        <h3 className="font-bold text-slate-800 text-sm">Update Inventory Stock</h3>
                        <button onClick={() => setSelectedItemForUpdate(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                      </div>
                      <form onSubmit={handleUpdateStockSubmit} className="flex flex-col gap-4 text-xs">
                        <div>
                          <span className="font-medium text-slate-500 block mb-1">Item Name:</span>
                          <span className="font-bold text-slate-800 text-sm">{selectedItemForUpdate.item_name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500 block mb-1">Current Stock:</span>
                          <span className="font-mono font-bold text-blue-600 text-sm">{selectedItemForUpdate.stock_number}</span>
                        </div>
                        <div>
                          <label className="font-medium text-slate-600 block mb-1">New Stock Number:</label>
                          <input 
                            type="number" 
                            min="0" 
                            required 
                            value={newStockValue} 
                            onChange={(e) => setNewStockValue(Number(e.target.value))}
                            className="w-full p-2.5 border rounded-lg font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Save Update</button>
                          <button type="button" onClick={() => setSelectedItemForUpdate(null)} className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium">Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* SUPABASE FILE PREVIEW MODAL */}
                {selectedFileModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border">
                      <div className="px-6 py-4 border-b flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-sm">{selectedFileModal.title}</h3>
                        <button onClick={() => setSelectedFileModal(null)} className="text-slate-400"><X size={20} /></button>
                      </div>
                      <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-200 bg-slate-900 rounded-b-xl whitespace-pre-wrap">
                        {selectedFileModal.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reinforcement' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-slate-50 rounded-xl border-2 border-slate-200 border-dashed w-full max-w-2xl mx-auto">
                  <Workflow size={40} className="text-slate-400 mb-3" />
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-700 mb-1">Work In Progress</h3>
                </div>
              </div>
            )}

          </div>
        </div> 
      </div>
    </main>
  );
}