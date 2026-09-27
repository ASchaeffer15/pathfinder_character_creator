import React from 'react';
import { BookOpen, Scroll, Feather, Flame } from 'lucide-react';

export default function LoreTab({ character, onUpdateCharacter }) {
  return (
    <div className="pb-lore-container">
      <div className="pb-grid-2">
        {/* Backstory & Biography */}
        <div className="pb-card">
          <div className="pb-card-header">
            <span className="pb-card-title">
              <Scroll size={18} />
              <span>Biography &amp; Origin Story</span>
            </span>
          </div>
          <div className="pb-card-body">
            <textarea
              rows={8}
              style={{ width: '100%', resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Write or generate your character's backstory, homeland, family ties, and defining childhood events..."
              value={character.backstory || ''}
              onChange={(e) => onUpdateCharacter({ backstory: e.target.value })}
            />
          </div>
        </div>

        {/* Deity, Edicts & Anathema */}
        <div className="pb-card">
          <div className="pb-card-header">
            <span className="pb-card-title">
              <Flame size={18} />
              <span>Deity, Faith &amp; Edicts</span>
            </span>
          </div>
          <div className="pb-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Patron Deity</label>
              <input
                type="text"
                placeholder="e.g. Iomedae, Sarenrae, Cayden Cailean, Torag, Pharasma"
                value={character.deity || ''}
                onChange={(e) => onUpdateCharacter({ deity: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Sacred Edicts</label>
              <textarea
                rows={3}
                placeholder="Codes of conduct your character upholds..."
                value={character.edicts || ''}
                onChange={(e) => onUpdateCharacter({ edicts: e.target.value })}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Anathema (Forbidden Acts)</label>
              <textarea
                rows={2}
                placeholder="Acts that would violate your vows or faith..."
                value={character.anathema || ''}
                onChange={(e) => onUpdateCharacter({ anathema: e.target.value })}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* Campaign Journal */}
        <div className="pb-card" style={{ gridColumn: '1 / -1' }}>
          <div className="pb-card-header">
            <span className="pb-card-title">
              <Feather size={18} />
              <span>Campaign Notes &amp; Quest Journal</span>
            </span>
          </div>
          <div className="pb-card-body">
            <textarea
              rows={6}
              style={{ width: '100%', resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Record quest objectives, party members, notable NPCs, loot distribution, and session highlights..."
              value={character.campaignNotes || ''}
              onChange={(e) => onUpdateCharacter({ campaignNotes: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
