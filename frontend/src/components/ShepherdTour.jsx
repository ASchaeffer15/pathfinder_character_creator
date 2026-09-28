import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Check, ChevronRight, ChevronLeft, X, EyeOff, 
  HelpCircle, Compass, Shield, Sword, Cpu, FileSpreadsheet, Layers
} from 'lucide-react';

const TOUR_STORAGE_KEY = 'pf2e_shepherd_tour_dismissed';

export default function ShepherdTour({ activeTab, onSelectTab, isOpen, onClose, onOpen }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check browser cache / localStorage to see if user has already dismissed the tour
    const isDismissed = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    if (!isDismissed) {
      // First time user: show tour automatically
      setVisible(true);
    }
  }, []);

  // Sync external isOpen prop if provided
  useEffect(() => {
    if (typeof isOpen === 'boolean') {
      setVisible(isOpen);
      if (isOpen) setCurrentStep(0);
    }
  }, [isOpen]);

  const steps = [
    {
      title: "Welcome to Pathfinder 2e Character Forge & AI Studio",
      subtitle: "Tactical Character Builder, Rules Co-Pilot, and Hardware-Accelerated Local AI",
      icon: <Compass size={32} style={{ color: '#d97706' }} />,
      tab: 'sheet',
      description: (
        <div>
          <p style={{ color: '#f8fafc', marginBottom: 10 }}>
            Welcome to the definitive Pathfinder 2nd Edition (Remaster) toolkit. Everything runs locally with 
            <strong> zero cloud lock-in</strong>, pairing an instantaneous offline rules engine with optional 
            RTX 3080 Ti hardware acceleration.
          </p>
          <ul style={{ paddingLeft: 18, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Header HUD:</strong> Live HP, Armor Class, Saving Throws, and 1-Click Interactive Dice Roller.</li>
            <li><strong>JSON Import & Export:</strong> Save character builds locally or import existing character files anytime.</li>
            <li><strong>URL Tab Navigation:</strong> Every tab updates your browser URL so you never lose your place on page reloads.</li>
          </ul>
        </div>
      )
    },
    {
      title: "The Character Forge (ABCs & Mechanics)",
      subtitle: "Ancestry, Background, Class, and Automatic Legal Progression",
      icon: <Shield size={32} style={{ color: '#38bdf8' }} />,
      tab: 'build',
      description: (
        <div>
          <p style={{ color: '#f8fafc', marginBottom: 10 }}>
            Design characters from Level 1 all the way to Level 20. The forge enforces authentic Pathfinder 2e rules:
          </p>
          <ul style={{ paddingLeft: 18, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Ancestry & Heritages:</strong> Automatic trait assignment, Hit Points, and Speed calculation.</li>
            <li><strong>Background & Class Boosts:</strong> Intuitive 4-stage ability score progression with Dexterity AC caps.</li>
            <li><strong>Instant Math Engine:</strong> Proficiency modifiers (Trained, Expert, Master, Legendary) auto-calculate across Perception, Saves, and Skills.</li>
          </ul>
        </div>
      )
    },
    {
      title: "Feat Matrix & Custom Excel Uploader",
      subtitle: "Filter Core Rules Feats & Ingest Custom Homebrew",
      icon: <FileSpreadsheet size={32} style={{ color: '#4ade80' }} />,
      tab: 'feats',
      description: (
        <div>
          <p style={{ color: '#f8fafc', marginBottom: 10 }}>
            Equip Ancestry, Class, General, and Skill feats directly to your character:
          </p>
          <ul style={{ paddingLeft: 18, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Search & Filter:</strong> Instantly filter feats by action cost, level requirement, and trait tags.</li>
            <li><strong>Excel Template Download:</strong> Download the pre-formatted <code>Pathfinder_2e_Feats_Template.xlsx</code> spreadsheet.</li>
            <li><strong>Custom Feat Ingestion:</strong> Fill in your homebrew feats in Excel and upload them with 1 click to make them available across all tabs!</li>
          </ul>
        </div>
      )
    },
    {
      title: "AI Tactical Co-Pilot (3-Action Economy)",
      subtitle: "Real-Time Encounter Optimization & Multiple Attack Penalty Logic",
      icon: <Sword size={32} style={{ color: '#f87171' }} />,
      tab: 'tactics',
      description: (
        <div>
          <p style={{ color: '#f8fafc', marginBottom: 10 }}>
            Maximize your turns during combat encounters with tactical intelligence:
          </p>
          <ul style={{ paddingLeft: 18, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>3-Action Combinations:</strong> Generates optimal action sequences (Strike, Raise Shield, Stride, Demoralize).</li>
            <li><strong>MAP Calculations:</strong> Evaluates Agile weapons (-4/-8) vs standard (-5/-10) before you commit to extra attacks.</li>
            <li><strong>Reaction Recommendations:</strong> Tracks Shield Block, Attack of Opportunity, and defensive positioning.</li>
          </ul>
        </div>
      )
    },
    {
      title: "AI Studio, VRAM Manager & Offloading",
      subtitle: "Pre-Verified Downloads, RTX 3080 Ti Acceleration, and 1-Click Offload",
      icon: <Cpu size={32} style={{ color: '#fbbf24' }} />,
      tab: 'ai-studio',
      description: (
        <div>
          <p style={{ color: '#f8fafc', marginBottom: 10 }}>
            Full control over your GPU hardware and machine learning models:
          </p>
          <ul style={{ paddingLeft: 18, color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Pre-Download Verification:</strong> Repository, size, disk headroom, and cache integrity are verified before any network transfer.</li>
            <li><strong>100% GPU Offload:</strong> Accelerate Llama 3.2 3B & Pathfinder models on your 12GB RTX 3080 Ti.</li>
            <li><strong>1-Click VRAM Offloading:</strong> Instantly reclaim GPU memory with the <em>"Offload from VRAM"</em> button and seamlessly transition back to Zero-Latency Rules Engine mode.</li>
            <li><strong>RAG Rule Ingestion:</strong> Chunk and embed custom rulebook text files directly into vector memory.</li>
          </ul>
        </div>
      )
    }
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (onSelectTab && steps[nextStep]?.tab) {
        onSelectTab(steps[nextStep].tab);
      }
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      if (onSelectTab && steps[prevStep]?.tab) {
        onSelectTab(steps[prevStep].tab);
      }
    }
  };

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }
    setVisible(false);
    if (onClose) onClose();
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(5, 7, 13, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #131b2e 0%, #0d121f 100%)',
        border: '1px solid rgba(217, 119, 6, 0.35)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '640px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(217, 119, 6, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Tour Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(217, 119, 6, 0.12)',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {current.icon}
            </div>
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                color: '#d97706' 
              }}>
                Feature Tour • Step {currentStep + 1} of {steps.length}
              </div>
              <h2 style={{ 
                fontSize: '1.15rem', 
                fontWeight: 700, 
                color: '#ffffff', 
                margin: 0,
                marginTop: 2
              }}>
                {current.title}
              </h2>
            </div>
          </div>
          <button 
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Skip Tour"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tour Content */}
        <div style={{ padding: '1.5rem', flex: 1 }}>
          <div style={{ 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            color: '#38bdf8', 
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Sparkles size={16} />
            <span>{current.subtitle}</span>
          </div>

          <div style={{ 
            fontSize: '0.9rem', 
            lineHeight: 1.6, 
            color: '#f8fafc',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.15rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {current.description}
          </div>
        </div>

        {/* Step Progress Dots */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 8, 
          padding: '0 1.5rem' 
        }}>
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStep(idx);
                if (onSelectTab && s.tab) onSelectTab(s.tab);
              }}
              style={{
                width: idx === currentStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                background: idx === currentStep ? '#d97706' : 'rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                padding: 0
              }}
              title={`Go to step ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Tour Footer / Controls */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Disable via Browser Cache Checkbox */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            fontSize: '0.8rem', 
            color: '#94a3b8', 
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input 
              type="checkbox" 
              checked={dontShowAgain} 
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{ accentColor: '#d97706', width: 15, height: 15, cursor: 'pointer' }}
            />
            <span>Don't show this tour again</span>
          </label>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentStep > 0 && (
              <button
                className="pb-btn pb-btn-secondary"
                onClick={handlePrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.85rem',
                  color: '#ffffff'
                }}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}

            <button
              className="pb-btn"
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                padding: '0.5rem 0.85rem',
                fontSize: '0.85rem'
              }}
            >
              Skip
            </button>

            <button
              className="pb-btn pb-btn-primary"
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.5rem 1.15rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: '0 2px 10px rgba(217, 119, 6, 0.3)'
              }}
            >
              <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next'}</span>
              {currentStep === steps.length - 1 ? <Check size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
