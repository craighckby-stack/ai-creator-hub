'use client';

import React from 'react';
import {
  ShieldCheck,
  Zap,
  Code2,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface HealthMetric {
  name: string;
  score: number;
  icon: React.ElementType;
  color: string;
}

interface Improvement {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface SystemHealthProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemAnalysis: any;
  setSystemAnalysis: (analysis: any) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  isImproving: boolean;
  setIsImproving: (improving: boolean) => void;
  onAnalyze: () => Promise<void>;
  onImprove: () => Promise<void>;
  addLog: (message: string, type: string) => Promise<void>;
  codebasePath: string;
}

export function SystemHealth({
  activeTab,
  setActiveTab,
  systemAnalysis,
  setSystemAnalysis,
  isAnalyzing,
  setIsAnalyzing,
  isImproving,
  setIsImproving,
  onAnalyze,
  onImprove,
  addLog,
  codebasePath
}: SystemHealthProps) {
  const metrics: HealthMetric[] = [
    { name: 'Security', score: systemAnalysis?.scores?.security || 85, icon: ShieldCheck, color: 'bg-emerald-500' },
    { name: 'Performance', score: systemAnalysis?.scores?.performance || 92, icon: Zap, color: 'bg-blue-500' },
    { name: 'Clean Code', score: systemAnalysis?.scores?.cleanCode || 78, icon: Code2, color: 'bg-purple-500' },
  ];

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    addLog('🔍 Starting system analysis...', 'system');
    try {
      const response = await fetch('/api/system/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codebasePath }),
      });
      const data = await response.json();
      setSystemAnalysis(data.analysis);
      addLog('✓ System analysis completed', 'success');
    } catch (error) {
      console.error('Analysis failed', error);
      addLog('✗ Analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyImprovements = async () => {
    if (!systemAnalysis?.improvements) return;
    setIsImproving(true);
    addLog('🛠️ Applying AI-suggested improvements...', 'gemini');
    try {
      await onImprove();
      addLog('✓ Improvements applied successfully', 'success');
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div>
          <h3 className="text-lg font-semibold text-white">System Diagnostics</h3>
          <p className="text-sm text-zinc-400">Deep scan: {codebasePath}</p>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          {systemAnalysis ? 'Re-Analyze System' : 'Analyze AI Creator Hub'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.name} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <metric.icon size={20} className="text-zinc-400" />
                <span className="text-2xl font-bold text-white">{metric.score}%</span>
              </div>
              <CardTitle className="text-sm font-medium text-zinc-400">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={metric.score} className="h-1.5 bg-zinc-800">
                <div className={`h-full ${metric.color} transition-all`} style={{ width: `${metric.score}%` }} />
              </Progress>
            </CardContent>
          </Card>
        ))}
      </div>

      {systemAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <AlertTriangle className="text-yellow-500" size={18} />
                Critical Findings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemAnalysis.improvements?.map((item: Improvement) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-black/40 border border-zinc-800">
                  <div className="mt-1">
                    <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-500 uppercase">
                      {item.impact} Impact
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">{item.title}</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-black border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2 text-blue-400">
                <Sparkles size={18} />
                AI Self-Correction
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Automatically refactor code to resolve the issues found above.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="bg-blue-500/10 p-4 rounded-full">
                <RefreshCcw className={`text-blue-500 ${isImproving ? 'animate-spin' : ''}`} size={32} />
              </div>
              <Button
                onClick={applyImprovements}
                disabled={isImproving || !systemAnalysis.improvements?.length}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                {isImproving ? 'Applying Improvements...' : 'Apply All Improvements'}
              </Button>
              <p className="text-[10px] text-zinc-500 font-mono italic">
                Files modified: {systemAnalysis.improvements?.length || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
