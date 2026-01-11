'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Upload, Search, BookOpen, FileCode, RefreshCw, CheckCircle, AlertCircle, Trash2, ExternalLink, Github } from 'lucide-react';

interface RelevantRepo {
  id: string;
  repoName: string;
  repoUrl: string;
  owner: string;
  description: string;
  stars: number;
  language: string;
  relevanceScore: number;
}

export default function ProjectSpecification() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectType, setProjectType] = useState('custom');
  const [projectDescription, setProjectDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [relevantRepos, setRelevantRepos] = useState<RelevantRepo[]>([]);
  const [buildInstructions, setBuildInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const projectTemplates = [
    { id: 'quantum-os', name: 'Quantum Operating System', icon: <Sparkles size={20} /> },
    { id: 'book-writer', name: 'Book Writer Assistant', icon: <BookOpen size={20} /> },
    { id: 'ai-chatbot', name: 'AI Chatbot System', icon: <FileCode size={20} /> },
    { id: 'e-commerce', name: 'E-commerce Platform', icon: <Upload size={20} /> },
    { id: 'dashboard', name: 'Analytics Dashboard', icon: <Search size={20} /> },
    { id: 'custom', name: 'Custom Project', icon: <FileCode size={20} /> }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearchRepos = async () => {
    if (!projectDescription.trim()) {
      setError('Please enter a project description');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await fetch('/api/github/search-repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: projectDescription,
          projectType,
          techStack: techStack.split(',').map(s => s.trim()).filter(s => s)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search repositories');
      }

      setRelevantRepos(data.repos || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search repositories');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateInstructions = async () => {
    if (!projectDescription.trim()) {
      setError('Please enter a project description');
      return;
    }

    setIsGenerating(true);
    setError('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('projectType', projectType);
      formData.append('projectDescription', projectDescription);
      formData.append('techStack', techStack);
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/generate-build-instructions', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate build instructions');
      }

      setBuildInstructions(data.instructions || '');
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Failed to generate build instructions');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartBuild = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/project/start-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType,
          projectDescription,
          techStack,
          instructions: buildInstructions
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start build');
      }

      // Redirect to main evolution engine
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to start build');
      console.error('Build start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset the system? This will clear all project data.')) {
      return;
    }

    try {
      await fetch('/api/system/reset', { method: 'POST' });
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to reset system');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              Project Specification
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Define what you want to build and let AI help you create it
            </p>
          </div>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-red-900/50 text-red-500 hover:bg-red-900/20"
            disabled={isLoading || isGenerating}
          >
            <RefreshCw size={16} className="mr-2" />
            Reset System
          </Button>
        </div>

        {/* Project Type Selection */}
        <Card className="bg-zinc-900/90 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">What do you want to build?</CardTitle>
            <CardDescription>Select a template or choose custom</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {projectTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setProjectType(template.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    projectType === template.id
                      ? 'bg-red-600/20 border-red-600 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {template.icon}
                    <span className="font-medium">{template.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Description */}
        <Card className="bg-zinc-900/90 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Project Description</CardTitle>
            <CardDescription>Describe what you want to build in detail</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="I want to build a quantum operating system that can simulate quantum circuits and provide a visual interface for quantum algorithms..."
                className="bg-black border-zinc-800 focus:border-red-600 min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="techStack">Tech Stack (comma separated)</Label>
              <Input
                id="techStack"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="Next.js, TypeScript, Tailwind, Prisma, Python, TensorFlow"
                className="bg-black border-zinc-800 focus:border-red-600 font-mono text-sm"
              />
              <p className="text-[10px] text-zinc-600">
                Specify technologies you want to use. AI will find relevant repositories.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="bg-zinc-900/90 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Upload Relevant Files</CardTitle>
            <CardDescription>Upload files (.bin, .pdf, .json, .zip, etc.) that will help AI understand your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center hover:border-zinc-700 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".bin,.pdf,.json,.zip,.txt,.md,.ts,.js,.py,.yaml,.yml"
                multiple
                className="hidden"
              />
              <Upload className="mx-auto mb-4 text-zinc-600" size={40} />
              <p className="text-zinc-400 text-sm mb-2">
                Drop files here or click to upload
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-zinc-700"
              >
                Select Files
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <FileCode className="text-zinc-500" size={18} />
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{file.name}</p>
                          <p className="text-[10px] text-zinc-600">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveFile(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Relevant Repos */}
        <Card className="bg-zinc-900/90 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Find Relevant GitHub Repositories</CardTitle>
            <CardDescription>Search GitHub for repositories related to your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={handleSearchRepos}
                disabled={isSearching || !projectDescription.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" size={16} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2" size={16} />
                    Search Repositories
                  </>
                )}
              </Button>
            </div>

            {relevantRepos.length > 0 && (
              <div className="space-y-3">
                <Label>Found {relevantRepos.length} Relevant Repositories</Label>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {relevantRepos
                    .sort((a, b) => b.relevanceScore - a.relevanceScore)
                    .map(repo => (
                      <div
                        key={repo.id}
                        className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Github size={18} className="text-zinc-500" />
                              <a
                                href={repo.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-sm text-red-500 hover:underline"
                              >
                                {repo.owner}/{repo.repoName}
                              </a>
                              <Badge className="text-[10px] bg-zinc-800 text-zinc-400 border-zinc-700">
                                {repo.language}
                              </Badge>
                              <Badge className="text-[10px]">
                                {(repo.relevanceScore * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                            {repo.description && (
                              <p className="text-xs text-zinc-500 mb-2">{repo.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                              <span>★ {repo.stars} stars</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(repo.repoUrl, '_blank')}
                            className="text-zinc-400 border-zinc-800"
                          >
                            <ExternalLink size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Build Instructions */}
        <Card className="bg-zinc-900/90 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">AI-Generated Build Instructions</CardTitle>
            <CardDescription>Comprehensive guide to build your fullstack application with z.ai</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateInstructions}
              disabled={isGenerating || !projectDescription.trim()}
              className="bg-red-600 hover:bg-red-700 w-full"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2" size={16} />
                  Generating Instructions...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" size={16} />
                  Generate Build Instructions
                </>
              )}
            </Button>

            {isGenerating && progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Generating...</span>
                  <span className="text-zinc-500">{progress}%</span>
                </div>
                <Progress value={progress} className="bg-zinc-800">
                  <div className="h-full bg-red-600 transition-all" />
                </Progress>
              </div>
            )}

            {buildInstructions && (
              <div className="space-y-2">
                <Label>Build Instructions</Label>
                <div className="bg-black border border-zinc-800 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                    {buildInstructions}
                  </pre>
                </div>
              </div>
            )}

            {buildInstructions && (
              <Button
                onClick={handleStartBuild}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2" size={16} />
                Start Building with z.ai
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-xs text-red-400">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
