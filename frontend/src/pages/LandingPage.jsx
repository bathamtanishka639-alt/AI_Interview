import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Sun, Upload, FileText, CheckCircle2, AlertCircle, ArrowRight,
  LayoutDashboard, Code2, Users, Target, Layers, Sparkles, FileCheck
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { useTheme } from '../hooks/useTheme';
import { getApiBaseUrl } from '../config/env';

const UPLOAD_STATES = {
  IDLE: 'idle',
  DRAGGING: 'dragging',
  UPLOADING: 'uploading',
  PARSING: 'parsing',
  SUCCESS: 'success',
  ERROR: 'error',
};

const PARSING_STEPS = [
  'Reading experience & education',
  'Identifying technologies & skills',
  'Understanding project achievements',
  'Building your interview context',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { cvProfile, setCvProfile, clearAllData } = useInterview();
  const { resolved, toggle } = useTheme();
  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [parsingStep, setParsingStep] = useState(0);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [parsedProfile, setParsedProfile] = useState(cvProfile || null);
  const fileInputRef = useRef(null);
  const sectionContainerRef = useRef(null);

  useEffect(() => {
    if (cvProfile && uploadState === UPLOAD_STATES.IDLE && !parsedProfile) {
      setParsedProfile(cvProfile);
      setUploadState(UPLOAD_STATES.SUCCESS);
    }
  }, [cvProfile, uploadState, parsedProfile]);

  const processFile = useCallback(async (file) => {
    const allowedMIMEs = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/octet-stream',
      'application/x-pdf',
      'binary/octet-stream'
    ];
    const ext = file.name ? file.name.split('.').pop()?.toLowerCase() : '';
    const allowedExts = ['pdf', 'doc', 'docx'];

    if (!allowedExts.includes(ext) && !allowedMIMEs.includes(file.type)) {
      setError('Please upload a PDF or DOC/DOCX file.');
      setUploadState(UPLOAD_STATES.ERROR);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      setUploadState(UPLOAD_STATES.ERROR);
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setError('');
    setUploadState(UPLOAD_STATES.UPLOADING);
    setParsingStep(0);

    const formData = new FormData();
    formData.append('cv', file);

    try {
      setUploadState(UPLOAD_STATES.PARSING);
      
      const stepTimer = setInterval(() => {
        setParsingStep((prev) => (prev < PARSING_STEPS.length - 1 ? prev + 1 : prev));
      }, 600);

      const apiBase = getApiBaseUrl();
      const endpoint = apiBase.endsWith('/') ? `${apiBase}cv/parse` : `${apiBase}/cv/parse`;
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepTimer);
      const json = await res.json().catch(() => null);

      if (!res.ok || !json || !json.success) {
        let errText = json?.error;
        if (!errText) {
          if (res.status === 404) {
            errText = 'Backend API endpoint not found (404). Please ensure VITE_API_BASE_URL environment variable points to your deployed backend URL.';
          } else {
            errText = `Server returned status ${res.status}. Please check backend logs or VITE_API_BASE_URL configuration.`;
          }
        }
        throw new Error(errText);
      }

      setCvProfile(json.data);
      setParsedProfile(json.data);
      setUploadState(UPLOAD_STATES.SUCCESS);
    } catch (err) {
      let displayMsg = err.message || 'An error occurred while processing your CV.';
      if (displayMsg.includes('Failed to fetch') || displayMsg.includes('NetworkError')) {
        displayMsg = 'Could not connect to backend API server. If using a deployed website, please set VITE_API_BASE_URL environment variable to your deployed backend server URL.';
      }
      setError(displayMsg);
      setUploadState(UPLOAD_STATES.ERROR);
    }
  }, [setCvProfile]);

  useEffect(() => {
    let dragCounter = 0;

    const isFileDrag = (e) => {
      if (!e.dataTransfer) return false;
      const types = e.dataTransfer.types;
      if (!types) return false;
      return Array.from(types).includes('Files');
    };

    const handleDragEnter = (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      if (dragCounter === 1) {
        setIsGlobalDragging(true);
      }
    };

    const handleDragOver = (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    };

    const handleDragLeave = (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsGlobalDragging(false);
      }
    };

    const handleDrop = (e) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setIsGlobalDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [processFile]);

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setUploadState(UPLOAD_STATES.IDLE);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setUploadState(UPLOAD_STATES.DRAGGING);
  };

  const handleDragLeave = () => {
    if (uploadState === UPLOAD_STATES.DRAGGING) setUploadState(UPLOAD_STATES.IDLE);
  };

  const handleContinue = () => navigate('/interview/setup');

  const handleReset = () => {
    clearAllData();
    setParsedProfile(null);
    setUploadState(UPLOAD_STATES.IDLE);
    setFileName('');
    setFileSize('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const scrollToTab = (tabId) => {
    setActiveTab(tabId);
    sectionContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToUpload = () => {
    scrollToTab('upload');
    setUploadState(UPLOAD_STATES.IDLE);
  };

  const isLoading = uploadState === UPLOAD_STATES.UPLOADING || uploadState === UPLOAD_STATES.PARSING;

  return (
    <div className="min-h-screen bg-surface text-text-primary transition-colors duration-200 antialiased selection:bg-agent-500/20 selection:text-agent-600">
      
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-signal-500 to-agent-500 text-white flex items-center justify-center font-bold text-sm shadow-glow">
              AI
            </div>
            <span className="font-display font-bold text-base tracking-tight text-text-primary">InterviewAI</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-btn bg-[rgba(124,127,251,0.10)] border border-[rgba(124,127,251,0.25)] text-[#6063E8] dark:text-[#9EA1FC] hover:bg-[rgba(124,127,251,0.20)] hover:border-[rgba(124,127,251,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[36px]"
            >
              <LayoutDashboard size={14} className="text-[#7C7FFB]" />
              <span>Dashboard</span>
            </button>

            <button
              aria-label="Toggle theme"
              onClick={toggle}
              className="rounded-xl p-2 text-text-secondary hover:text-text-primary bg-surface-raised border border-border hover:scale-[1.05] active:scale-[0.95] transition-all shadow-subtle"
            >
              {resolved === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-mesh">
        <div className="absolute left-[5%] top-[15%] w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(20,224,180,0.18) 0%, transparent 70%)', filter: 'blur(32px)' }} aria-hidden="true" />
        <div className="absolute right-[6%] top-[25%] w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,127,251,0.16) 0%, transparent 70%)', filter: 'blur(28px)' }} aria-hidden="true" />

        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill glass border border-border/60 text-xs font-semibold text-text-secondary mb-8 shadow-subtle">
            {cvProfile ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#14E0B4] animate-pulse" />
                <span>CV Grounded Engine Active</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/40" />
                <span>Adaptive AI Interview Engine</span>
              </>
            )}
          </div>

          <h1 className="font-display text-[2rem] sm:text-[3.5rem] md:text-[4.5rem] font-bold tracking-tight text-text-primary max-w-3xl mx-auto leading-[1.05]">
            Practice the interview you're{' '}
            <span style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>actually going to have.</span>
          </h1>

          <p className="mt-7 text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Upload your CV. Choose your interview style. Our AI builds the conversation around your real experience and projects.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {cvProfile ? (
              <>
                <button
                  onClick={() => navigate('/interview/setup')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-btn text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-glow min-h-[48px]"
                  style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
                >
                  <span>Continue Interview ({cvProfile.name || 'Uploaded CV'})</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={handleScrollToUpload}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-btn border border-border/80 bg-surface-raised/80 hover:bg-surface-raised hover:border-border text-text-secondary hover:text-text-primary text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 min-h-[42px]"
                  title="Upload a new CV"
                >
                  <Upload size={13} className="text-agent-500" />
                  <span>Upload New CV</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => scrollToTab('upload')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-btn text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-glow min-h-[48px]"
                style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
              >
                <span>Upload your CV</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section ref={sectionContainerRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-border/60">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {[
            { id: 'how-it-works', label: 'How it works', icon: Sparkles },
            { id: 'interview-types', label: 'Interview Types', icon: Target },
            { id: 'context-driven', label: 'Context Driven', icon: FileCheck },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-btn text-xs font-bold transition-all duration-200 min-h-[48px]
                  ${isActive
                    ? 'bg-gradient-to-r from-[rgba(20,224,180,0.15)] to-[rgba(124,127,251,0.12)] border-2 border-[#14E0B4] text-text-primary shadow-glow'
                    : 'bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:border-[rgba(124,127,251,0.40)] hover:scale-[1.01]'
                  }
                `}
              >
                <IconComponent size={16} className={isActive ? 'text-[#14E0B4]' : 'text-text-secondary'} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-full min-h-[360px] h-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl mx-auto"
              >
                {uploadState !== UPLOAD_STATES.SUCCESS ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                      relative rounded-card-lg border-2 border-dashed transition-all duration-200 cursor-pointer p-10 text-center shadow-raised
                      ${uploadState === UPLOAD_STATES.DRAGGING
                        ? 'border-agent-500 bg-agent-500/8 shadow-glow-agent'
                        : 'border-border glass hover:border-agent-500/40'
                      }
                      ${isLoading ? 'pointer-events-none opacity-90' : ''}
                    `}
                    onClick={() => !isLoading && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleFileInput}
                    />

                    {isLoading ? (
                      <div className="py-4 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-signal-500/20 to-agent-500/20 border border-agent-500/20 text-agent-500 flex items-center justify-center mx-auto mb-6">
                          <Sparkles size={22} className="animate-spin" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-text-primary mb-1">Analyzing your CV</h3>
                        <p className="text-xs text-text-secondary mb-6">{fileName} ({fileSize})</p>

                        <div className="space-y-3 text-left border border-border/60 rounded-2xl p-4 glass">
                          {PARSING_STEPS.map((stepText, idx) => {
                            const isDone = idx < parsingStep;
                            const isCurrent = idx === parsingStep;
                            return (
                              <div key={idx} className="flex items-center gap-3 text-xs">
                                {isDone ? (
                                  <CheckCircle2 size={16} className="text-signal-600 dark:text-signal-500 flex-shrink-0" />
                                ) : isCurrent ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-agent-500 border-t-transparent animate-spin flex-shrink-0" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
                                )}
                                <span className={isDone ? 'text-text-primary font-medium' : isCurrent ? 'text-agent-600 font-semibold' : 'text-text-secondary/60'}>
                                  {stepText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : uploadState === UPLOAD_STATES.ERROR ? (
                      <div className="py-4">
                        <div className="w-12 h-12 rounded-2xl bg-coral-500/10 text-coral-500 flex items-center justify-center mx-auto mb-4 border border-coral-500/20">
                          <AlertCircle size={24} />
                        </div>
                        <p className="font-display text-base font-bold text-coral-500 mb-1">{error}</p>
                        <p className="text-xs text-text-secondary">Tap or drop a different file to try again</p>
                      </div>
                    ) : (
                      <div className="py-4">
                        {cvProfile && (
                          <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-pill bg-signal-500/10 border border-signal-500/25 text-xs text-text-primary">
                            <FileCheck size={13} className="text-signal-500" />
                            <span>Active Profile: <strong>{cvProfile.name}</strong></span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadState(UPLOAD_STATES.SUCCESS);
                                setParsedProfile(cvProfile);
                              }}
                              className="ml-1 text-[11px] underline text-agent-600 dark:text-agent-400 font-semibold hover:text-agent-500"
                            >
                              View Card
                            </button>
                          </div>
                        )}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-agent-500/15 to-signal-500/10 border border-agent-500/20 flex items-center justify-center mx-auto mb-4 text-agent-500">
                          <Upload size={24} />
                        </div>
                        <h3 className="font-display text-xl font-bold text-text-primary mb-1">
                          {uploadState === UPLOAD_STATES.DRAGGING ? 'Drop your CV here' : 'Upload your CV / Resume'}
                        </h3>
                        <p className="text-xs text-text-secondary mb-4">PDF or DOCX format · Tap to choose file from phone</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-5 py-2.5 rounded-btn text-white text-xs font-bold shadow-glow mb-3 inline-flex items-center gap-2 min-h-[40px]"
                          style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
                        >
                          <Upload size={14} />
                          Select CV File
                        </button>
                        <p className="text-[11px] text-text-secondary/70 font-mono block">
                          Your CV becomes the context for your interview.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-card-lg glass border border-border/60 p-6 shadow-raised">
                    <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-agent-500/20 to-signal-500/15 border border-agent-500/20 text-agent-600 dark:text-agent-400 flex items-center justify-center font-bold text-base">
                          {parsedProfile?.name ? parsedProfile.name[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold text-text-primary leading-tight">{parsedProfile?.name || 'Candidate Profile'}</h3>
                          {parsedProfile?.email && <p className="text-xs text-text-secondary">{parsedProfile.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-pill bg-signal-500/10 border border-signal-500/25 text-signal-600 dark:text-signal-400 text-xs font-semibold">
                        <FileCheck size={13} />
                        <span>CV analyzed</span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      {parsedProfile?.skills?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-mono text-text-secondary uppercase tracking-wider mb-2">Detected Technologies & Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedProfile.skills.slice(0, 8).map((skill) => (
                              <span key={skill} className="px-2.5 py-1 rounded-xl bg-surface-raised border border-border/60 text-xs font-medium text-text-primary">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedProfile?.projects?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-mono text-text-secondary uppercase tracking-wider mb-2">Key Projects</p>
                          <ul className="space-y-1">
                            {parsedProfile.projects.slice(0, 2).map((proj, idx) => (
                              <li key={idx} className="text-xs text-text-secondary flex gap-2">
                                <span className="text-agent-500 font-bold">•</span>
                                <span>{proj.substring(0, 120)}{proj.length > 120 ? '…' : ''}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setUploadState(UPLOAD_STATES.IDLE)}
                        className="px-4 py-2 rounded-btn border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:border-[rgba(124,127,251,0.40)] hover:scale-[1.01] transition-all min-h-[40px]"
                      >
                        Upload Different CV
                      </button>
                      <button
                        onClick={handleContinue}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-btn text-white font-semibold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow min-h-[40px]"
                        style={{ background: 'linear-gradient(135deg, #14E0B4 0%, #7C7FFB 100%)' }}
                      >
                        <span>Continue to Interview Setup</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'how-it-works' && (
              <motion.div
                key="how-it-works"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <div className="text-center mb-10">
                  <p className="text-xs font-mono font-bold text-agent-500 uppercase tracking-widest mb-3">Simple 3-Step Process</p>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">How InterviewAI Works</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      step: '01',
                      title: 'Upload your CV',
                      desc: 'Provide your PDF or DOCX resume. Our parser extracts your actual tech stack, role history, and project details.',
                    },
                    {
                      step: '02',
                      title: 'Choose your interview',
                      desc: 'Select Technical, HR, Behavioral, or Mixed mode depending on the role you are targeting.',
                    },
                    {
                      step: '03',
                      title: 'Get interviewed',
                      desc: 'Experience an adaptive, real-time interview where every follow-up probes deeper into your actual answers.',
                    },
                  ].map((item) => (
                    <div key={item.step} className="rounded-card-lg bg-surface-raised border border-border p-6 shadow-raised hover:-translate-y-[3px] hover:shadow-raised transition-all duration-200">
                      <div className="text-xs font-mono font-bold text-[#7C7FFB] mb-3">{item.step}</div>
                      <h3 className="font-display text-base font-bold text-text-primary mb-2 tracking-tight">{item.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'interview-types' && (
              <motion.div
                key="interview-types"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <div className="text-center mb-10">
                  <p className="text-xs font-mono font-bold text-agent-500 uppercase tracking-widest mb-3">Four Focus Options</p>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">Tailored Interview Styles</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      id: 'technical',
                      name: 'Technical',
                      icon: Code2,
                      desc: 'Architecture, code design, frameworks, and system scalability.',
                    },
                    {
                      id: 'hr',
                      name: 'HR',
                      icon: Users,
                      desc: 'Career background, motivation, team culture, and education.',
                    },
                    {
                      id: 'behavioral',
                      name: 'Behavioral',
                      icon: Target,
                      desc: 'STAR-format scenarios drawn directly from your CV experience.',
                    },
                    {
                      id: 'mixed',
                      name: 'Mixed',
                      icon: Layers,
                      desc: 'Realistic full-loop interview combining technical, HR, and behavioral probing.',
                    },
                  ].map((mode) => {
                    const IconComponent = mode.icon;
                    return (
                      <div key={mode.id} className="rounded-card-lg bg-surface-raised border border-border p-5 shadow-raised hover:-translate-y-[3px] hover:shadow-glow-agent transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, rgba(124,127,251,0.15) 0%, rgba(20,224,180,0.08) 100%)', border: '1px solid rgba(124,127,251,0.22)' }}>
                          <IconComponent size={17} className="text-[#7C7FFB]" />
                        </div>
                        <h4 className="font-display text-sm font-bold text-text-primary mb-1.5 tracking-tight">{mode.name}</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">{mode.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'context-driven' && (
              <motion.div
                key="context-driven"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <div className="max-w-3xl mx-auto text-center mb-10">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                    Not generic interview questions.
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
                    Every question starts from something you've actually done. The AI probes your true technical decisions and past project architecture.
                  </p>
                </div>

                <div className="rounded-card-lg glass border border-border/60 p-8 shadow-raised">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center items-center">
                    <div className="p-4 rounded-2xl bg-surface border border-border/60">
                      <span className="text-xs font-mono font-bold text-text-secondary block mb-1 uppercase tracking-wider">Input</span>
                      <span className="text-sm font-semibold text-text-primary">Parsed CV Context</span>
                    </div>
                    <div className="text-text-secondary/60 text-xs font-mono hidden md:block">↓ AI Analysis</div>
                    <div className="p-4 rounded-2xl bg-agent-500/8 border border-agent-500/20">
                      <span className="text-xs font-mono font-bold text-agent-500 block mb-1 uppercase tracking-wider">Adaptive Engine</span>
                      <span className="text-sm font-semibold text-text-primary">Grounded Probing</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-signal-500/8 border border-signal-500/20">
                      <span className="text-xs font-mono font-bold text-signal-600 dark:text-signal-400 block mb-1 uppercase tracking-wider">Evidence Report</span>
                      <span className="text-sm font-semibold text-text-primary">Targeted Feedback</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <footer className="border-t border-border/60 glass py-8 text-xs text-text-secondary">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-signal-500 to-agent-500 flex items-center justify-center font-bold text-white text-[10px] shadow-glow">
              AI
            </div>
            <span className="font-display font-bold text-text-primary">InterviewAI</span>
            <span className="text-text-secondary/60">— {cvProfile ? 'CV Grounded Active' : 'Adaptive Interview Agent'}</span>
          </div>
          <p>© {new Date().getFullYear()} InterviewAI. Powered by Google Gemini &amp; Breeth Memory Engine.</p>
        </div>
      </footer>

      <AnimatePresence>
        {isGlobalDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="rounded-[28px] border-2 border-dashed border-[#14E0B4] bg-surface/90 glass p-10 text-center max-w-sm w-full shadow-glow flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-bounce shadow-glow" style={{ background: 'linear-gradient(135deg, rgba(20,224,180,0.2) 0%, rgba(124,127,251,0.2) 100%)', border: '1px solid rgba(20,224,180,0.3)' }}>
                <Upload size={32} className="text-[#14E0B4]" />
              </div>
              <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight mb-1">
                Drop your CV anywhere
              </h2>
              <p className="text-sm font-semibold text-[#14E0B4] mb-4">
                Release to upload
              </p>
              <span className="px-3 py-1 rounded-pill bg-surface-raised border border-border text-xs font-mono text-text-secondary">
                PDF • DOC • DOCX
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
