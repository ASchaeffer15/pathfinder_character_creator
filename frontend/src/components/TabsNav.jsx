import React from 'react';
import { 
  FileText, Hammer, Award, Wand2, Backpack, BookOpen, Cpu, Crosshair
} from 'lucide-react';

export default function TabsNav({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'build', label: 'Character Builder', icon: Hammer },
    { id: 'sheet', label: 'Character Sheet', icon: FileText },
    { id: 'tactics', label: 'OMG What Should I Do', icon: Crosshair },
    { id: 'feats', label: 'Feats & Features', icon: Award },
    { id: 'spells', label: 'Spells & Slots', icon: Wand2 },
    { id: 'equipment', label: 'Gear & Inventory', icon: Backpack },
    { id: 'lore', label: 'Lore & Bio', icon: BookOpen },
    { id: 'ai-studio', label: 'AI Studio & Knowledge', icon: Cpu }
  ];

  return (
    <nav className="pb-nav-bar">
      <div className="pb-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`pb-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
