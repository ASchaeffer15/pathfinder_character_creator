import React from 'react';
import { Shield, Sparkles, Heart, Code2 } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pb-footer" style={{
      marginTop: '3rem',
      padding: '1.75rem 1.25rem 2rem',
      borderTop: '1px solid var(--border-subtle)',
      background: 'linear-gradient(180deg, rgba(20, 24, 34, 0.4) 0%, rgba(14, 17, 23, 0.95) 100%)',
      borderRadius: '12px 12px 0 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.65rem',
      textAlign: 'center',
      position: 'relative'
    }}>
      {/* Brand & Creator Statement */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        fontSize: '0.88rem'
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          background: 'linear-gradient(135deg, var(--gold-500) 0%, var(--gold-700) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#121620'
        }}>
          <Shield size={12} strokeWidth={2.5} />
        </div>

        <span style={{ color: 'var(--text-secondary)' }}>
          © {currentYear}
        </span>

        <span style={{
          fontFamily: 'var(--font-fantasy)',
          fontWeight: 700,
          color: 'var(--text-gold)',
          letterSpacing: '0.04em'
        }}>
          The One Lazy Developer Company
        </span>

        <span style={{ color: 'var(--text-muted)' }}>
          • All Rights Reserved.
        </span>
      </div>

      {/* Explicit Statement */}
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <Code2 size={14} color="var(--gold-500)" />
        <span>This was built by the <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>One Lazy Developer</strong> company.</span>
      </div>

      {/* Subtle Platform / SRD Community Sub-notice */}
      <div style={{
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        maxWidth: '680px',
        lineHeight: 1.45,
        marginTop: 2
      }}>
        Pathfinder 2e Remaster Character Forge, AI Studio &amp; Rules Specialist. Built with Remaster SRD &amp; Paizo Community Use compatibility.
      </div>
    </footer>
  );
}
