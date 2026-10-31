import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  Cpu,
  User,
  Zap,
  BrainCircuit,
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  CYBER_AI_MODELS,
  CYBER_AI_ROLES,
  CyberAiMessage,
  CyberAiModelId,
  CyberAiRoleId,
} from '../lib/cyberAiCore';

const INITIAL_WELCOME_BY_ROLE: Record<CyberAiRoleId, string> = {
  scam_analyst:
    'Akwaaba! I am **Cyber AI**, operating in **Scam & MoMo Fraud Analyst** mode. Paste any suspicious SMS, WhatsApp message, USSD prompt, or investment offer below—or ask a follow-up question—and I will break down the red flags and risk level.',
  incident_responder:
    'I am **Cyber AI**, operating in **Emergency Incident Coach** mode. Tell me what happened (for example: shared an OTP, clicked a link, or sent Mobile Money to a suspected scammer) and I will walk you through immediate containment and official Ghana reporting steps.',
  student_advisor:
    'I am **Cyber AI**, operating in **Student & Job Opportunity Verifier** mode. Share details about a scholarship, remote job, internship, or visa agent, and we will verify whether it is safe before you pay any fee or submit sensitive documents.',
};

function createWelcomeMessage(roleId: CyberAiRoleId): CyberAiMessage {
  return {
    id: `welcome-${roleId}-${Date.now()}`,
    role: 'model',
    text: INITIAL_WELCOME_BY_ROLE[roleId],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    modelUsed: 'Cyber AI System',
  };
}

export const CyberAiChat: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<CyberAiRoleId>('scam_analyst');
  const [selectedModel, setSelectedModel] = useState<CyberAiModelId>('gemini-3.8-flash');
  const [messages, setMessages] = useState<CyberAiMessage[]>(() => [
    createWelcomeMessage('scam_analyst'),
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState<boolean>(false);
  const [isFloatingExpanded, setIsFloatingExpanded] = useState<boolean>(false);

  const threadContainerRef = useRef<HTMLDivElement | null>(null);
  const floatingThreadRef = useRef<HTMLDivElement | null>(null);

  const activeRoleObj =
    CYBER_AI_ROLES.find((r) => r.id === selectedRole) ?? CYBER_AI_ROLES[0];
  const activeModelObj =
    CYBER_AI_MODELS.find((m) => m.id === selectedModel) ?? CYBER_AI_MODELS[1];

  useEffect(() => {
    if (threadContainerRef.current) {
      threadContainerRef.current.scrollTop = threadContainerRef.current.scrollHeight;
    }
    if (floatingThreadRef.current) {
      floatingThreadRef.current.scrollTop = floatingThreadRef.current.scrollHeight;
    }
  }, [messages, isLoading, isFloatingOpen]);

  const handleRoleSwitch = (nextRole: CyberAiRoleId) => {
    if (nextRole === selectedRole) return;
    setSelectedRole(nextRole);
    setErrorBanner(null);
    const roleMeta = CYBER_AI_ROLES.find((r) => r.id === nextRole) ?? CYBER_AI_ROLES[0];
    setMessages((prev) => [
      ...prev,
      {
        id: `role-switch-${Date.now()}`,
        role: 'model',
        text: `Switched role to **${roleMeta.title}**. ${INITIAL_WELCOME_BY_ROLE[nextRole]}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'Role Updated',
      },
    ]);
  };

  const handleClearConversation = () => {
    setMessages([createWelcomeMessage(selectedRole)]);
    setErrorBanner(null);
    setFallbackNotice(null);
  };

  const sendMessageToCyberAi = async (rawPrompt?: string) => {
    const textToSend = (rawPrompt ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: CyberAiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historyPayload = messages
      .filter((m) => !m.id.startsWith('welcome-') && !m.id.startsWith('role-switch-'))
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    setMessages((prev) => [...prev, userMessage]);
    if (rawPrompt === undefined) {
      setInput('');
    }
    setErrorBanner(null);
    setFallbackNotice(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/cyber-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          model: selectedModel,
          role: selectedRole,
          history: historyPayload,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        reply?: string;
        modelUsed?: string;
        fallbackNotice?: string;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        setErrorBanner(
          data.error ||
            'Cyber AI could not complete your request right now. Please try again.'
        );
        return;
      }

      if (data.fallbackNotice) {
        setFallbackNotice(data.fallbackNotice);
      }

      const modelReply: CyberAiMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text:
          data.reply ||
          'I analyzed your message. Let me know if you would like to inspect another detail.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, modelReply]);
    } catch {
      setErrorBanner(
        'Network error reaching Cyber AI (/api/cyber-ai). Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessageToCyberAi();
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={lineIdx} className="h-2" />;
      }
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={lineIdx} className="leading-relaxed">
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-semibold text-cyan-200">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <React.Fragment key={partIdx}>{part}</React.Fragment>;
          })}
        </p>
      );
    });
  };

  return (
    <>
      <div
        data-testid="cyber-ai-section"
        className="overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#070c1d]/95 shadow-[0_0_45px_rgba(0,240,255,0.08)]"
      >
        {/* Top Header Bar */}
        <div className="border-b border-slate-800/90 bg-[#050917] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                <Bot className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                    Cyber AI
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-950/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-cyan-300">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Multi-Turn Gemini Defense Assistant
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Maintains full conversation context to analyze scams, guide incident recovery, and verify student opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearConversation}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset Chat
              </button>
            </div>
          </div>

          {/* Role & Model Selectors */}
          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            {/* Specialist Role Selector (7 cols) */}
            <div className="lg:col-span-7">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  1. Select Cyber AI Specialist Role
                </span>
                <span className="font-mono text-[11px] text-cyan-300">
                  {activeRoleObj.badge}
                </span>
              </div>
              <div
                role="group"
                aria-label="Cyber AI Specialist Role"
                className="grid gap-2 sm:grid-cols-3"
              >
                {CYBER_AI_ROLES.map((role) => {
                  const isSelected = role.id === selectedRole;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleRoleSwitch(role.id)}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-[0_0_18px_rgba(0,240,255,0.18)]'
                          : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <span className="text-xs font-semibold leading-snug">
                        {role.title}
                      </span>
                      <span className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                        {role.summary}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gemini Model Speed / Complexity Selector (5 cols) */}
            <div className="lg:col-span-5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  2. Select Gemini Model Tier
                </span>
                <span className="font-mono text-[11px] text-amber-300">
                  {activeModelObj.tierLabel}
                </span>
              </div>
              <div
                role="group"
                aria-label="Cyber AI Gemini Model Selector"
                className="grid grid-cols-3 gap-2"
              >
                {CYBER_AI_MODELS.map((model) => {
                  const isSelected = model.id === selectedModel;
                  const Icon =
                    model.id === 'gemini-3.1-flash-lite'
                      ? Zap
                      : model.id === 'gemini-4-argon'
                      ? BrainCircuit
                      : Cpu;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setSelectedModel(model.id)}
                      aria-pressed={isSelected}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-amber-400/80 bg-amber-500/15 text-white shadow-[0_0_16px_rgba(245,183,0,0.18)]'
                          : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isSelected ? 'text-amber-300' : 'text-slate-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-semibold">{model.label}</span>
                      </div>
                      <span className="mt-1 font-mono text-[10px] text-slate-400">
                        {model.tierLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Starter Prompts Bar */}
        <div className="border-b border-slate-800/80 bg-[#060b19] px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              Try a scenario:
            </span>
            {activeRoleObj.starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => void sendMessageToCyberAi(prompt)}
                className="rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-left text-xs text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200 disabled:opacity-50 transition-colors"
              >
                {prompt.length > 72 ? `${prompt.slice(0, 72)}…` : prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Multi-Turn Conversation Thread */}
        <div
          ref={threadContainerRef}
          role="log"
          aria-live="polite"
          aria-label="Cyber AI Conversation Thread"
          className="max-h-[440px] min-h-[300px] space-y-4 overflow-y-auto px-5 py-5 sm:px-6"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    isUser
                      ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                      : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm sm:max-w-[78%] ${
                    isUser
                      ? 'border-amber-400/30 bg-amber-950/30 text-slate-100'
                      : 'border-slate-800 bg-[#0b132b]/90 text-slate-200'
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'You' : 'Cyber AI'}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      {msg.modelUsed && (
                        <span className="rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] text-cyan-300">
                          {msg.modelUsed}
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    {renderFormattedText(msg.text)}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
                <Bot className="h-4 w-4 animate-pulse" aria-hidden="true" />
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0b132b]/90 px-4 py-3 text-xs text-cyan-200">
                <span className="font-mono">
                  Cyber AI ({selectedModel}) is analyzing your message…
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notices & Errors */}
        {fallbackNotice && (
          <div className="border-t border-amber-500/30 bg-amber-950/30 px-5 py-2 text-xs text-amber-200 sm:px-6">
            {fallbackNotice}
          </div>
        )}

        {errorBanner && (
          <div
            role="alert"
            className="flex items-center gap-2 border-t border-rose-500/40 bg-rose-950/40 px-5 py-2.5 text-xs text-rose-200 sm:px-6"
          >
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* Composer Form */}
        <form
          onSubmit={handleFormSubmit}
          className="border-t border-slate-800/90 bg-[#050917] p-4 sm:px-6"
        >
          <label htmlFor="cyber-ai-input" className="sr-only">
            Ask Cyber AI a cybersecurity question or paste a suspicious message
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              id="cyber-ai-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessageToCyberAi();
                }
              }}
              placeholder="Paste a suspicious MoMo SMS, WhatsApp message, or ask Cyber AI a follow-up question…"
              className="w-full resize-none rounded-xl border border-slate-700/90 bg-slate-950/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 transition-all sm:text-sm"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Send to Cyber AI
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Privacy reminder: Never paste your real Mobile Money PIN, OTP, or password.
            </span>
            <span className="font-mono text-slate-500">
              Role: {activeRoleObj.title} · Model: {selectedModel}
            </span>
          </div>
        </form>
      </div>

      {/* Floating Quick-Access Cyber AI Launcher (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-50">
        {!isFloatingOpen ? (
          <button
            type="button"
            onClick={() => setIsFloatingOpen(true)}
            aria-label="Open Cyber AI Chat Assistant"
            className="flex items-center gap-2.5 rounded-2xl border border-cyan-400/50 bg-[#050917]/95 px-4 py-3 text-xs font-bold text-cyan-200 shadow-[0_0_30px_rgba(0,240,255,0.3)] backdrop-blur-md hover:border-cyan-300 hover:bg-[#09122c] transition-all sm:text-sm"
          >
            <MessageSquare className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            <span>Cyber AI</span>
            <span className="rounded-md bg-cyan-400/20 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
              Live
            </span>
          </button>
        ) : (
          <div
            role="dialog"
            aria-label="Cyber AI Floating Chat Window"
            className={`flex flex-col overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#050917]/98 shadow-[0_0_50px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all ${
              isFloatingExpanded
                ? 'h-[560px] w-[92vw] sm:w-[460px]'
                : 'h-[440px] w-[88vw] sm:w-[370px]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#080f26] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                <span className="font-display text-sm font-bold text-white">
                  Cyber AI
                </span>
                <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">
                  {selectedModel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFloatingExpanded((prev) => !prev)}
                  aria-label={isFloatingExpanded ? 'Restore Cyber AI window size' : 'Expand Cyber AI window'}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  {isFloatingExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFloatingOpen(false)}
                  aria-label="Close Cyber AI floating window"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div
              ref={floatingThreadRef}
              className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs"
            >
              {messages.map((msg) => (
                <div
                  key={`float-${msg.id}`}
                  className={`rounded-xl border p-2.5 ${
                    msg.role === 'user'
                      ? 'ml-6 border-amber-400/30 bg-amber-950/30 text-slate-100'
                      : 'mr-4 border-slate-800 bg-[#0b132b] text-slate-200'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {msg.role === 'user' ? 'You' : 'Cyber AI'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                </div>
              ))}
              {isLoading && (
                <div className="rounded-xl border border-slate-800 bg-[#0b132b] p-2.5 font-mono text-[11px] text-cyan-300">
                  Cyber AI is thinking…
                </div>
              )}
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="border-t border-slate-800 bg-[#050917] p-2.5"
            >
              <label htmlFor="cyber-ai-floating-input" className="sr-only">
                Message Cyber AI
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="cyber-ai-floating-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Cyber AI…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  aria-label="Send message to Cyber AI"
                  className="rounded-lg bg-cyan-400 p-2 text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};
