'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Github, ArrowRight, CheckCircle, AlertCircle, Cpu, BookOpen } from 'lucide-react';

interface OnboardingData {
  name: string;
  email: string;
  company: string;
  role: string;
  experienceLevel: string;
  githubUsername: string;
  githubToken: string;
  repoName: string;
  consentAccepted: boolean;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    company: '',
    role: '',
    experienceLevel: 'beginner',
    githubUsername: '',
    githubToken: '',
    repoName: '',
    consentAccepted: false
  });

  const steps = [
    {
      title: 'Welcome to Evolution Engine',
      icon: <Sparkles className="text-red-500" size={32} />,
      description: 'An AI-powered system that learns and evolves with you'
    },
    {
      title: 'Tell Us About Yourself',
      icon: <BookOpen className="text-red-500" size={32} />,
      description: 'Help us understand your experience level'
    },
    {
      title: 'GitHub Integration',
      icon: <Github className="text-red-500" size={32} />,
      description: 'Connect GitHub to create your learning repository'
    },
    {
      title: 'Create Your Repository',
      icon: <Cpu className="text-red-500" size={32} />,
      description: 'Set up the repository where you and the AI will learn together'
    }
  ];

  const validateStep = (step: number) => {
    setError('');
    switch (step) {
      case 1:
        if (!data.name.trim()) return 'Please enter your name';
        if (!data.email.trim()) return 'Please enter your email';
        if (!data.experienceLevel) return 'Please select your experience level';
        break;
      case 2:
        if (!data.githubUsername.trim()) return 'Please enter your GitHub username';
        if (!data.githubToken.trim()) return 'Please enter your GitHub personal access token';
        break;
      case 3:
        if (!data.repoName.trim()) return 'Please enter a repository name';
        if (!data.consentAccepted) return 'Please accept the terms and conditions';
        break;
    }
    return null;
  };

  const handleNext = async () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete onboarding');
      }

      // Save to localStorage for future reference
      localStorage.setItem('evolution-engine-user', JSON.stringify({
        name: data.name,
        email: data.email,
        githubUsername: data.githubUsername
      }));

      // Redirect to main app
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-2xl mb-4">
                <Cpu className="text-white" size={40} />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                Evolution Engine
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                An AI-powered system that builds, evolves, and learns with you.
                Together, you'll create amazing software through intelligent automation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="text-green-500 mx-auto mb-2" size={24} />
                  <h3 className="text-sm font-bold text-zinc-100 mb-1">Automated Code Generation</h3>
                  <p className="text-xs text-zinc-500">AI writes code for you</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="text-green-500 mx-auto mb-2" size={24} />
                  <h3 className="text-sm font-bold text-zinc-100 mb-1">Learning Repository</h3>
                  <p className="text-xs text-zinc-500">Track progress together</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="text-green-500 mx-auto mb-2" size={24} />
                  <h3 className="text-sm font-bold text-zinc-100 mb-1">Smart Evolution</h3>
                  <p className="text-xs text-zinc-500">System improves over time</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="John Doe"
                className="bg-black border-zinc-800 focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                placeholder="john@example.com"
                className="bg-black border-zinc-800 focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                value={data.company}
                onChange={(e) => setData({ ...data, company: e.target.value })}
                placeholder="Acme Inc."
                className="bg-black border-zinc-800 focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role (Optional)</Label>
              <Input
                id="role"
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value })}
                placeholder="Developer, Designer, etc."
                className="bg-black border-zinc-800 focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Experience Level *</Label>
              <div className="grid grid-cols-3 gap-3">
                {['beginner', 'intermediate', 'expert'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setData({ ...data, experienceLevel: level })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      data.experienceLevel === level
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-200">GitHub Token Required</p>
                  <p className="text-xs text-zinc-500">
                    Create a Personal Access Token at{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:underline"
                    >
                      GitHub Settings → Developer Settings → Personal Access Tokens
                    </a>
                  </p>
                  <p className="text-xs text-zinc-600 mt-2">
                    Required scopes: <code className="bg-black px-1 rounded">repo</code>, <code className="bg-black px-1 rounded">workflow</code>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubUsername">GitHub Username *</Label>
              <Input
                id="githubUsername"
                value={data.githubUsername}
                onChange={(e) => setData({ ...data, githubUsername: e.target.value })}
                placeholder="craighckby-stack"
                className="bg-black border-zinc-800 focus:border-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubToken">GitHub Personal Access Token *</Label>
              <Input
                id="githubToken"
                type="password"
                value={data.githubToken}
                onChange={(e) => setData({ ...data, githubToken: e.target.value })}
                placeholder="ghp_..."
                className="bg-black border-zinc-800 focus:border-red-600 font-mono text-xs"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-red-900/20 to-zinc-900/50 border border-red-900/50 rounded-lg p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-200">Create Your Learning Repository</p>
                  <p className="text-xs text-zinc-400">
                    Evolution Engine will create a GitHub repository where all your learning,
                    code, and progress will be tracked. This repository becomes a shared
                    learning space where you and the AI grow together.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repoName">Repository Name *</Label>
              <Input
                id="repoName"
                value={data.repoName}
                onChange={(e) => setData({ ...data, repoName: e.target.value })}
                placeholder="evolution-learning-2024"
                className="bg-black border-zinc-800 focus:border-red-600 font-mono text-xs"
              />
              <p className="text-[10px] text-zinc-600">
                The repository will be created under your GitHub account
              </p>
            </div>

            <div className="space-y-3 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={data.consentAccepted}
                  onCheckedChange={(checked) => setData({ ...data, consentAccepted: checked as boolean })}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label htmlFor="consent" className="text-sm text-zinc-200 cursor-pointer">
                    I agree to the terms and conditions
                  </Label>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    By checking this box, you agree that Evolution Engine will:
                  </p>
                  <ul className="text-[10px] text-zinc-600 space-y-1 list-disc list-inside ml-2">
                    <li>Create a GitHub repository in your account</li>
                    <li>Commit code generated by the AI to this repository</li>
                    <li>Track your learning progress and evolution history</li>
                    <li>Use the repository to improve future AI recommendations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">What Happens Next</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                  <div>
                    <p className="text-sm text-zinc-200">Create GitHub Repository</p>
                    <p className="text-[10px] text-zinc-600">A new repository is created in your account</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                  <div>
                    <p className="text-sm text-zinc-200">Initialize Evolution System</p>
                    <p className="text-[10px] text-zinc-600">AI sets up the learning environment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                  <div>
                    <p className="text-sm text-zinc-200">Start Learning Together</p>
                    <p className="text-[10px] text-zinc-600">You and AI build and evolve software</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        <Card className="bg-zinc-900/90 border-zinc-800 shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {steps[currentStep].icon}
                <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-6">{renderStep()}</div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center gap-2 bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-xs text-red-400">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-zinc-800">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0 || isLoading}
                className="text-zinc-400 hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="bg-white text-black hover:bg-zinc-200 font-medium gap-2"
              >
                {isLoading ? (
                  'Creating...'
                ) : currentStep === steps.length - 1 ? (
                  <>
                    Start Evolution <Sparkles size={16} />
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
