import { useState } from 'react';
import type { AppSettings, CategoryId, Screen, SessionSummary, UserProfile } from './types';
import {
  addProfile, applySessionToProfile, createDefaultProfile,
  loadActiveId, loadProfiles, loadSettings,
  saveActiveId, saveProfiles, saveSettings, updateProfile,
} from './engine/storage';
import { applyNeglectPenalties } from './engine/adaptive';
import type { GameMode } from './components/Game';
import ProfileSelect  from './components/ProfileSelect';
import ProfileSetup   from './components/ProfileSetup';
import Menu           from './components/Menu';
import Game           from './components/Game';
import Stats          from './components/Stats';
import Summary        from './components/Summary';
import SettingsPanel  from './components/SettingsPanel';

function loadAndPrepareProfiles(): UserProfile[] {
  const profiles = loadProfiles();
  // Apply neglect penalties on startup
  const updated = profiles.map(p => applyNeglectPenalties(p));
  // Save if any changed
  const changed = updated.some((p, i) => p !== profiles[i]);
  if (changed) saveProfiles(updated);
  return updated;
}

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>(() => loadAndPrepareProfiles());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const id = loadActiveId();
    const loaded = loadProfiles();
    return loaded.find(p => p.id === id) ? id : (loaded[0]?.id ?? null);
  });
  const [settings, setSettings]   = useState<AppSettings>(() => loadSettings());
  const [screen, setScreen]       = useState<Screen>(() => {
    const loaded = loadProfiles();
    if (loaded.length === 0) return 'setup';
    return 'profiles';
  });
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [gameCategories, setGameCategories] = useState<CategoryId[]>([]);
  const [gameMode, setGameMode]           = useState<GameMode>('practice');
  const [lastSummary, setLastSummary]     = useState<SessionSummary | null>(null);

  const profile = profiles.find(p => p.id === activeId) ?? null;

  // ── Profile management ───────────────────────────────────────────────────────

  const handleSelectProfile = (id: string) => {
    setActiveId(id);
    saveActiveId(id);
    setScreen('menu');
  };

  const handleCreateProfile = (name: string, avatar: string) => {
    const p = createDefaultProfile(name, avatar);
    const next = addProfile(profiles, p);
    setProfiles(next);
    setActiveId(p.id);
    saveActiveId(p.id);
    setScreen('menu');
  };

  const handleEditProfile = (name: string, avatar: string) => {
    if (!editingId) return;
    const orig = profiles.find(p => p.id === editingId);
    if (!orig) return;
    const updated = { ...orig, name, avatar };
    const next = updateProfile(profiles, updated);
    setProfiles(next);
    setEditingId(null);
    setScreen('profiles');
  };

  const handleDeleteProfile = (id: string) => {
    const next = profiles.filter(p => p.id !== id);
    saveProfiles(next);
    setProfiles(next);
    if (activeId === id) {
      const newActive = next[0]?.id ?? null;
      setActiveId(newActive);
      if (newActive) saveActiveId(newActive);
    }
    if (next.length === 0) setScreen('setup');
  };

  const handleImportProfile = (p: UserProfile) => {
    const exists = profiles.find(x => x.id === p.id);
    let next: UserProfile[];
    if (exists) next = updateProfile(profiles, p);
    else next = addProfile(profiles, p);
    setProfiles(next);
  };

  const handleProfileUpdate = (p: UserProfile) => {
    const next = updateProfile(profiles, p);
    setProfiles(next);
  };

  const handleProfilesUpdate = (updated: UserProfile[]) => {
    setProfiles(updated);
    saveProfiles(updated);
  };

  // ── Settings ─────────────────────────────────────────────────────────────────

  const handleSettings = (s: AppSettings) => {
    saveSettings(s);
    setSettings(s);
  };

  // ── Game ──────────────────────────────────────────────────────────────────────

  const startGame = (cats: CategoryId[], mode: GameMode) => {
    setGameCategories(cats);
    setGameMode(mode);
    setScreen('game');
  };

  const handleGameEnd = (summary: SessionSummary) => {
    setLastSummary(summary);
    if (profile) {
      // Record session history + update streak
      const withSession = applySessionToProfile(profile, summary);
      handleProfileUpdate(withSession);
    }
    setScreen('summary');
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (screen === 'profiles') return (
    <ProfileSelect
      profiles={profiles}
      activeId={activeId}
      lang={settings.language}
      onSelect={handleSelectProfile}
      onNew={() => setScreen('setup')}
      onEdit={id => { setEditingId(id); setScreen('setup'); }}
      onDelete={handleDeleteProfile}
      onImport={handleImportProfile}
    />
  );

  if (screen === 'setup') {
    const editing = editingId ? profiles.find(p => p.id === editingId) : null;
    return (
      <ProfileSetup
        lang={settings.language}
        initialName={editing?.name ?? ''}
        initialAvatar={editing?.avatar ?? '🧠'}
        editMode={!!editing}
        onSave={editing ? handleEditProfile : handleCreateProfile}
        onBack={() => setScreen('profiles')}
      />
    );
  }

  if (!profile) {
    setScreen('profiles');
    return null;
  }

  if (screen === 'menu') return (
    <Menu
      profile={profile}
      settings={settings}
      onPlaySingle={cat => startGame([cat], 'single')}
      onPlayMulti={cats => startGame(cats, 'practice')}
      onStats={() => setScreen('stats')}
      onSettings={() => setScreen('settings')}
      onProfiles={() => setScreen('profiles')}
      onProfileUpdate={handleProfileUpdate}
    />
  );

  if (screen === 'game') return (
    <Game
      profile={profile}
      activeCategories={gameCategories}
      mode={gameMode}
      settings={settings}
      onUpdate={handleProfileUpdate}
      onEnd={handleGameEnd}
    />
  );

  if (screen === 'stats') return (
    <Stats
      profile={profile}
      profiles={profiles}
      settings={settings}
      onBack={() => setScreen('menu')}
      onProfiles={handleProfilesUpdate}
    />
  );

  if (screen === 'settings') return (
    <SettingsPanel
      settings={settings}
      onUpdate={handleSettings}
      onBack={() => setScreen('menu')}
    />
  );

  if (screen === 'summary' && lastSummary) return (
    <Summary
      summary={lastSummary}
      settings={settings}
      onContinue={() => setScreen('game')}
      onMenu={() => setScreen('menu')}
    />
  );

  return null;
}
