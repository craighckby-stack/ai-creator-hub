'use client';

import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Terminal, Maximize2, Minimize2, X, RotateCcw, Copy } from 'lucide-react';

export default function CLIInterface() {
  const [output, setOutput] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMinimized, setIsMinimized] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Connect to CLI service
    const socket = io('/?XTransformPort=3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      addOutput('✓ Connected to Evolution Engine CLI v1.0', 'system');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      addOutput('✗ Disconnected from CLI', 'error');
    });

    socket.on('cli-output', (data: string) => {
      setOutput(prev => [...prev, { type: 'output', content: data, timestamp: new Date() }]);
    });

    socket.on('cli-clear', () => {
      setOutput([]);
    });

    socket.on('cli-exit', () => {
      addOutput('👋 CLI session ended', 'system');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    // Focus input when not minimized
    if (!isMinimized && inputRef.current) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const addOutput = (content: string, type: 'output' | 'input' | 'system' | 'error' = 'output') => {
    setOutput(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const handleSend = () => {
    if (!input.trim() || !isConnected) return;

    const command = input.trim();
    setInputHistory(prev => [command, ...prev]);
    setHistoryIndex(-1);

    // Echo input to output
    addOutput(command, 'input');

    // Send to server
    socketRef.current?.emit('cli-input', { input: command });

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < inputHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(inputHistory[inputHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(inputHistory[inputHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Escape') {
      setInput('');
      setHistoryIndex(-1);
    }
  };

  const handleCopy = () => {
    const text = output.map(o => o.content).join('\n');
    navigator.clipboard.writeText(text);
  };

  const clearOutput = () => {
    setOutput([]);
    socketRef.current?.emit('cli-clear');
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          <Terminal size={16} />
          <span className="text-sm">CLI</span>
          <Maximize2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 bg-black border-2 border-red-600 rounded-lg flex flex-col z-50 font-mono shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="text-red-500" size={18} />
          <span className="text-sm font-bold text-zinc-100">Evolution Engine CLI</span>
          <span className={`text-xs px-2 py-0.5 rounded ${isConnected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            {isConnected ? '● Connected' : '● Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Copy output"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={clearOutput}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Clear"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-black"
        style={{ minHeight: '400px' }}
      >
        {output.length === 0 && (
          <div className="text-zinc-600 text-sm">
            Waiting for connection...
          </div>
        )}
        {output.map((line, index) => (
          <div
            key={index}
            className={`text-sm ${
              line.type === 'input' ? 'text-green-500' :
              line.type === 'system' ? 'text-blue-500' :
              line.type === 'error' ? 'text-red-500' :
              'text-zinc-300'
            }`}
          >
            {line.type === 'input' && <span className="mr-2 text-zinc-500">{'>'}</span>}
            {line.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 bg-zinc-900 border-t border-zinc-800 px-4 py-3">
        <span className="text-green-500 text-sm">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConnected}
          className="flex-1 bg-transparent text-zinc-100 text-sm focus:outline-none font-mono"
          placeholder={isConnected ? 'Type command...' : 'Connecting...'}
          autoComplete="off"
          autoFocus
        />
        <div className="text-zinc-600 text-xs">
          {inputHistory.length > 0 && <span className="mr-3">↑↓ History</span>}
          <span>Enter to send</span>
        </div>
      </div>
    </div>
  );
}
