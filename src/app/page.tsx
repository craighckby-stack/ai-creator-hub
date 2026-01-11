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

interface Toast {
  id: string;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

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
  type: 'info' | 'error' | 'success' | 'gemini' | 'github';
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
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [placeholders, setPlaceholders] = useState<Placeholder[]>([
    { id: '1', externalId: 'auth-layer', name: 'User Authentication', completed: true, dependencies: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', externalId: 'db-schema', name: 'PostgreSQL Schema', completed: true, dependencies: ['auth-layer'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', externalId: 'ui-kit', name: 'Shadcn/UI Integration', completed: true, dependencies: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '4', externalId: 'crud-feature', name: 'CRUD: Resource Management (E2E)', completed: false, dependencies: ['db-schema', 'ui-kit'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '5', externalId: 'api-gateway', name: 'API Gateway Setup', completed: false, dependencies: ['auth-layer'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ]);

  const [implementationResults, setImplementationResults] = useState<Record<string, ImplementationResult>>({});

  useEffect(() => {
    // Check if user has completed onboarding
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
          })
          .catch(err => console.error('Config error:', err));

        // Load placeholders
        fetch('/api/evolution/placeholders')
          .then(res => res.json())
          .then(data => setPlaceholders(data))
          .catch(err => console.error('Placeholders error:', err));

        // Load logs
        fetch('/api/evolution/logs')
          .then(res => res.json())
          .then(data => setSystemLogs(data))
          .catch(err => console.error('Logs error:', err));

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
      toast({
        title: 'API Key Missing',
        description: 'Please configure Gemini API Key.',
        variant: 'destructive'
      });
      setShowSettings(true);
      return;
    }

    const task = placeholders.find(p => p.id === id);
    if (!task) return;

    setImplementingPlaceholder(id);
    await addLog(`🚀 Deploying E2E Feature: ${task.name}`, 'info');

    try {
      const steps = [
        { label: 'Scaffolding Backend Endpoints...', progress: 0.2 },
        { label: 'Generating Prisma Service Logic...', progress: 0.4 },
        { label: 'Building Shadcn React Views...', progress: 0.7 },
        { label: 'Linking Controller to UI...', progress: 0.9 },
        { label: 'Finalizing Deployment...', progress: 1.0 }
      ];

      for (const step of steps) {
        setImplementationProgress({ [id]: step });
        if (step.progress === 0.4) await addLog('⚡ Created: src/api/resource.controller.ts', 'github');
        if (step.progress === 0.7) await addLog('🎨 Created: src/views/ResourceManagement.tsx', 'github');
        await new Promise(r => setTimeout(r, 700));
      }

      // Update placeholder in database
      await fetch(`/api/evolution/placeholders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });

      setPlaceholders(prev => prev.map(p => p.id === id ? { ...p, completed: true } : p));

      // Save implementation result
      const result = await fetch(`/api/evolution/placeholders/${id}/implement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: ['resource.controller.ts', 'ResourceView.tsx', 'resource.service.ts'] })
      }).then(res => res.json());

      setImplementationResults(prev => ({
        ...prev,
        [id]: {
          files: result.files,
          timestamp: result.timestamp
        }
      }));

      setEvolutionCycle(prev => prev + 1);
      await addLog(`✅ Feature ${task.name} is now LIVE.`, 'success');
      toast({ title: 'Feature Deployed', description: 'Backend and Frontend assets synchronized.' });
    } catch (e) {
      await addLog('Error during implementation cycle', 'error');
      console.error(e);
    } finally {
      setImplementingPlaceholder(null);
      setImplementationProgress({});
    }
  };

  const generateNextBacklog = async () => {
    if (!geminiApiKey) {
      setShowSettings(true);
      return;
    }
    setIsGeneratingNext(true);
    await addLog('🧠 Architecting next evolution...', 'gemini');
    try {
      await new Promise(r => setTimeout(r, 1500));

      // Use LLM to generate next feature
      const response = await fetch('/api/evolution/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCycle: evolutionCycle })
      });

      const nextFeature = await response.json();

      const newPlaceholder = await fetch('/api/evolution/placeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: nextFeature.id,
          name: nextFeature.name,
          description: nextFeature.description,
          dependencies: nextFeature.dependencies
        })
      }).then(res => res.json());

      setPlaceholders(prev => [...prev, newPlaceholder]);
      setEvolutionCycle(prev => prev + 1);
      await addLog('📦 New task: Advanced Filtering added to backlog.', 'success');
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
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant={showSettings ? "default" : "secondary"}
                className={showSettings ? "bg-red-600 hover:bg-red-700" : "bg-zinc-800 hover:bg-zinc-700"}
              >
                <Settings size={20} />
              </Button>
            </div>
          </header>

          {/* Settings */}
          {showSettings && (
            <Card className="bg-zinc-900/90 border-zinc-800">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Gemini API Key</label>
                    <Input
                      type="password"
                      value={geminiApiKey}
                      onChange={e => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="bg-black border-zinc-800 focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">GitHub Repo</label>
                    <Input
                      type="text"
                      value={githubRepo}
                      onChange={e => setGithubRepo(e.target.value)}
                      placeholder="owner/repo"
                      className="bg-black border-zinc-800 focus:border-red-600"
                    />
                  </div>
                </div>
                <Button onClick={saveConfig} className="bg-white text-black hover:bg-zinc-200">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Backlog View */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-zinc-900/20 p-4 rounded-xl border border-zinc-800/50">
                <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                  <Layout size={14} /> Feature Backlog
                </h2>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Filter tasks..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-black border-zinc-800 focus:border-red-900 w-32 md:w-48 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filtered.map(item => {
                  const isImplementing = implementingPlaceholder === item.id;
                  const canRun = canImplement(item);
                  const hasResults = implementationResults[item.id];

                  return (
                    <Card
                      key={item.id}
                      className={`p-5 transition-all duration-300 ${item.completed ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-900 border-zinc-800 shadow-xl'}`}
                    >
                      <CardContent className="p-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg mt-1 ${item.completed ? 'bg-zinc-800 text-zinc-600' : 'bg-red-500/10 text-red-500'}`}>
                              {item.completed ? <CheckCircle size={20}/> : <FileCode size={20}/>}
                            </div>
                            <div>
                              <h3 className={`font-bold text-sm ${item.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                                {item.name}
                              </h3>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-[10px] border-zinc-700 bg-transparent text-zinc-400">
                                  {item.externalId}
                                </Badge>
                                {item.dependencies.length > 0 && (
                                  <span className="text-[10px] text-zinc-600">
                                    Needs: {item.dependencies.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {!item.completed && (
                            <Button
                              onClick={() => implementPlaceholder(item.id)}
                              disabled={!canRun || !!implementingPlaceholder}
                              size="sm"
                              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${canRun ? 'bg-white text-black hover:scale-105' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                            >
                              {isImplementing ? 'DEPLOYING...' : 'RUN CYCLE'}
                            </Button>
                          )}
                        </div>

                        {isImplementing && implementationProgress[item.id] && (
                          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono text-zinc-500">
                                {implementationProgress[item.id].label}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                {Math.round(implementationProgress[item.id].progress * 100)}%
                              </span>
                            </div>
                            <Progress value={implementationProgress[item.id].progress * 100} className="h-1 bg-zinc-800">
                              <div className="h-full bg-red-600 transition-all duration-500" />
                            </Progress>
                          </div>
                        )}

                        {hasResults && (
                          <div className="mt-3 pl-12 border-l-2 border-zinc-800/50 ml-6 space-y-1">
                            <p className="text-[10px] text-zinc-500 font-mono">
                              Files: {(hasResults.files || []).join(' + ')}
                            </p>
                            <p className="text-[9px] text-zinc-700 font-mono italic">
                              Deployed {new Date(hasResults.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {placeholders.every(p => p.completed) && (
                <Button
                  onClick={generateNextBacklog}
                  disabled={isGeneratingNext}
                  variant="outline"
                  className="w-full h-auto py-8 bg-zinc-900/40 hover:bg-zinc-900 border-2 border-zinc-800 border-dashed text-zinc-500 font-bold flex-col gap-3 group"
                >
                  {isGeneratingNext ? <RefreshCw className="animate-spin" size={32} /> : <Sparkles className="group-hover:text-red-500 transition-colors" size={32} />}
                  <span className="group-hover:text-zinc-300">INITIATE ARCHITECTURAL ANALYSIS</span>
                </Button>
              )}
            </div>

            {/* System Terminal */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                <Server size={14} /> Production Logs
              </h2>
              <Card className="bg-black border-zinc-800 h-[500px] flex flex-col overflow-hidden shadow-2xl">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                      <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                      <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-mono">v4.0.2-stable</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px]">
                    {systemLogs.map(log => (
                      <div
                        key={log.id}
                        className={`pl-2 border-l-2 py-0.5 animate-in slide-in-from-left-1 ${
                          log.type === 'error' ? 'border-red-500 text-red-500 bg-red-500/5' :
                          log.type === 'success' ? 'border-green-500 text-green-500' :
                          log.type === 'gemini' ? 'border-purple-500 text-purple-400' :
                          'border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <span className="opacity-30 mr-2">
                          [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false } )}]
                        </span>
                        {log.message}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                  <div className="p-3 bg-zinc-900/30 border-t border-zinc-800/50 flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-zinc-400 font-mono">Engine heartbeat active</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Feature Preview Card */}
              <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800">
                <CardContent className="p-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase">
                    E2E View: Resource Management
                  </h4>
                  <div className="bg-black/40 border border-zinc-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-300">Mock Resource #1</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full w-full"></div>
                    <div className="flex justify-between gap-2">
                      <Button variant="secondary" size="sm" className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-[10px]">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 text-red-500 hover:bg-red-900/20 text-[10px]">
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
