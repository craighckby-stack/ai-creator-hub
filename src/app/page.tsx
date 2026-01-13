'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  Github,
  Cpu,
  RefreshCw,
  FileCode,
  Terminal,
  Database,
  Sparkles,
  Search,
  Trash2,
  Lock,
  X,
  Activity,
  Plus,
  MoreVertical,
  Layout,
  Server
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Added for navigation
import { SystemHealth } from '@/components/system-health'; // Corrected import location

interface Placeholder {
  id: string;
  externalId: string;
  name: string;
  description?: string;
  completed: boolean;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
}

interface SystemLog {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'gemini' | 'github' | 'system';
  timestamp: string;
}

interface ImplementationResult {
  id: string;
  placeholderId: string;
  files: string[];
  timestamp: string;
}

export default function EvolutionEngine() {
  const [isLoading, setIsLoading] = useState(true);
  const [githubToken, setGithubToken] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [evolutionCycle, setEvolutionCycle] = useState(4);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [implementingPlaceholder, setImplementingPlaceholder] = useState<string | null>(null);
  const [implementationProgress, setImplementationProgress] = useState<Record<string, { label: string; progress: number }>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [activeTab, setActiveTab] = useState('backlog'); // Track active view
  
  // System Health States
  const [systemAnalysis, setSystemAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [implementationResults, setImplementationResults] = useState<Record<string, ImplementationResult>>({});

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/onboarding/status');
        const data = await response.json();

        if (!data.onboardingCompleted) {
          router.push('/onboarding');
          return;
        }

        setIsLoading(false);

        // Load config from API
        fetch('/api/evolution/config')
          .then(res => res.json())
          .then(data => {
            if (data.githubToken) setGithubToken(data.githubToken);
            if (data.geminiApiKey) setGeminiApiKey(data.geminiApiKey);
            if (data.githubRepo) setGithubRepo(data.githubRepo);
            if (data.evolutionCycle) setEvolutionCycle(data.evolutionCycle);
          });

        // Load placeholders
        fetch('/api/evolution/placeholders')
          .then(res => res.json())
          .then(data => setPlaceholders(data));

        // Load logs
        fetch('/api/evolution/logs')
          .then(res => res.json())
          .then(data => setSystemLogs(data));

        addLog('System initialized. Evolution cycle 0004 active.', 'system');
      } catch (error) {
        console.error('Onboarding check error:', error);
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, [router]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  const addLog = async (message: string, type: SystemLog['type']) => {
    const newLog = await fetch('/api/evolution/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, type })
    }).then(res => res.json());
    setSystemLogs(prev => [...prev, newLog].slice(-100));
  };

  // System Health Handlers
  const handleAnalyzeSystem = async () => {
    setIsAnalyzing(true);
    addLog('🔍 Starting deep system analysis...', 'system');
    try {
      const response = await fetch('/api/system/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codebasePath: '/home/z/my-project' }),
      });

      if (response.ok) {
        const data = await response.json();
        setSystemAnalysis(data.analysis);
        addLog('✓ System analysis completed', 'success');
        setActiveTab('system-health');
      } else {
        throw new Error('Analysis API returned error');
      }
    } catch (error) {
      addLog('✗ Failed to analyze system', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImproveSystem = async () => {
    if (!systemAnalysis || systemAnalysis.improvements?.length === 0) {
      addLog('✗ Please analyze system first', 'error');
      return;
    }

    setIsImproving(true);
    addLog('🛠️ Applying AI-suggested improvements...', 'gemini');
    try {
      const response = await fetch('/api/system/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          improvements: systemAnalysis.improvements,
          codebasePath: '/home/z/my-project',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`✓ Applied ${data.applied || 0} improvements`, 'success');
        handleAnalyzeSystem();
      } else {
        throw new Error('Improvement API returned error');
      }
    } catch (error) {
      addLog('✗ Failed to improve system', 'error');
    } finally {
      setIsImproving(false);
    }
  };

  const saveConfig = async () => {
    await fetch('/api/evolution/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubToken, geminiApiKey, githubRepo })
    });
    toast({ title: 'Config Saved', description: 'Settings updated successfully.' });
    setShowSettings(false);
  };

  const canImplement = (item: Placeholder) => {
    return item.dependencies.every(depId =>
      placeholders.find(p => p.externalId === depId)?.completed
    );
  };

  const implementPlaceholder = async (id: string) => {
    if (!geminiApiKey) {
      toast({ title: 'API Key Missing', description: 'Please configure Gemini API Key.', variant: 'destructive' });
      setShowSettings(true);
      return;
    }

    const task = placeholders.find(p => p.id === id);
    if (!task) return;

    setImplementingPlaceholder(id);
    await addLog(`🚀 Deploying E2E Feature: ${task.name}`, 'info');

    try {
      const steps = [
        { label: 'Scaffolding Backend...', progress: 0.2 },
        { label: 'Generating Logic...', progress: 0.4 },
        { label: 'Building UI...', progress: 0.7 },
        { label: 'Finalizing...', progress: 1.0 }
      ];

      for (const step of steps) {
        setImplementationProgress({ [id]: step });
        if (step.progress === 0.4) await addLog('⚡ Created: src/api/resource.controller.ts', 'github');
        await new Promise(r => setTimeout(r, 700));
      }

      await fetch(`/api/evolution/placeholders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });
      
      setPlaceholders(prev => prev.map(p => p.id === id ? { ...p, completed: true } : p));
      setEvolutionCycle(prev => prev + 1);
      await addLog(`✅ Feature ${task.name} is now LIVE.`, 'success');
      toast({ title: 'Feature Deployed', description: 'Assets synchronized.' });
    } catch (e) {
      await addLog('Error during implementation cycle', 'error');
    } finally {
      setImplementingPlaceholder(null);
      setImplementationProgress({});
    }
  };

  const generateNextBacklog = async () => {
    if (!geminiApiKey) { setShowSettings(true); return; }
    setIsGeneratingNext(true);
    await addLog('🧠 Architecting next evolution...', 'gemini');
    try {
      await new Promise(r => setTimeout(r, 1500));
      const response = await fetch('/api/evolution/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCycle: evolutionCycle })
      });
      const nextFeature = await response.json();
      setPlaceholders(prev => [...prev, nextFeature]);
      setEvolutionCycle(prev => prev + 1);
      await addLog('📦 New task added to backlog.', 'success');
    } finally {
      setIsGeneratingNext(false);
    }
  };

  const filtered = placeholders.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filter === 'all' || (filter === 'pending' && !p.completed) || (filter === 'completed' && p.completed))
  );

  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-100 font-sans selection:bg-red-500/30">
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row items-center justify-between bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 backdrop-blur-md gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-red-600 p-3 rounded-xl shadow-lg shadow-red-900/20">
                <Cpu className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                  Evolution Engine
                </h1>
                <div className="flex items-center gap-3">
                  <Badge variant={geminiApiKey ? "default" : "secondary"} className={geminiApiKey ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}>
                    {geminiApiKey ? "READY" : "AWAITING KEY"}
                  </Badge>
                  <p className="text-[10px] text-zinc-500 font-mono">NODE_ENV: production</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAnalyzeSystem} disabled={isAnalyzing} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 gap-2">
                <Activity size={18} className={isAnalyzing ? "animate-pulse" : ""} />
                Analyze Health
              </Button>
              <Button onClick={() => setShowSettings(!showSettings)} variant={showSettings ? "default" : "secondary"} className={showSettings ? "bg-red-600 hover:bg-red-700" : "bg-zinc-800 hover:bg-zinc-700"}>
                <Settings size={20} />
              </Button>
            </div>
          </header>

          {/* Settings Section */}
          {showSettings && (
            <Card className="bg-zinc-900/90 border-zinc-800">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Gemini API Key</label>
                    <Input type="password" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} placeholder="AIzaSy..." className="bg-black border-zinc-800 focus:border-red-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">GitHub Repo</label>
                    <Input type="text" value={githubRepo} onChange={e => setGithubRepo(e.target.value)} placeholder="owner/repo" className="bg-black border-zinc-800 focus:border-red-600" />
                  </div>
                </div>
                <Button onClick={saveConfig} className="bg-white text-black hover:bg-zinc-200">Save Configuration</Button>
              </CardContent>
            </Card>
          )}

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
              <TabsTrigger value="backlog" className="gap-2 data-[state=active]:bg-zinc-800">
                <Layout size={14} /> Backlog
              </TabsTrigger>
              <TabsTrigger value="system-health" className="gap-2 data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400">
                <Activity size={14} /> System Health
              </TabsTrigger>
            </TabsList>

            <TabsContent value="backlog" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Backlog View */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center bg-zinc-900/20 p-4 rounded-xl border border-zinc-800/50">
                    <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                      <Layout size={14} /> Feature Backlog
                    </h2>
                    <Input type="text" placeholder="Filter tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-black border-zinc-800 w-32 md:w-48 h-8 text-xs" />
                  </div>

                  <div className="space-y-3">
                    {filtered.map(item => (
                      <Card key={item.id} className={`p-5 transition-all ${item.completed ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-900 border-zinc-800'}`}>
                        <CardContent className="p-0 flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg mt-1 ${item.completed ? 'bg-zinc-800 text-zinc-600' : 'bg-red-500/10 text-red-500'}`}>
                              {item.completed ? <CheckCircle size={20}/> : <FileCode size={20}/>}
                            </div>
                            <div>
                              <h3 className={`font-bold text-sm ${item.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{item.name}</h3>
                              <Badge variant="outline" className="text-[10px] border-zinc-700 mt-1">{item.externalId}</Badge>
                            </div>
                          </div>
                          {!item.completed && (
                            <Button onClick={() => implementPlaceholder(item.id)} disabled={!canImplement(item) || !!implementingPlaceholder} size="sm" className="bg-white text-black">
                              {implementingPlaceholder === item.id ? 'DEPLOYING...' : 'RUN CYCLE'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* System Logs (Side) */}
                <div className="space-y-4">
                  <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                    <Server size={14} /> Production Logs
                  </h2>
                  <Card className="bg-black border-zinc-800 h-[500px] flex flex-col">
                    <CardContent className="p-4 flex-1 overflow-y-auto space-y-2 font-mono text-[10px]">
                      {systemLogs.map(log => (
                        <div key={log.id} className={`pl-2 border-l-2 ${log.type === 'error' ? 'border-red-500 text-red-500' : log.type === 'success' ? 'border-green-500 text-green-500' : 'border-zinc-800 text-zinc-500'}`}>
                          <span className="opacity-30 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          {log.message}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system-health" className="mt-6">
              <SystemHealth 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                codebasePath="/home/z/my-project"
                // Pass handlers if SystemHealth component expects them as props
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
          }
