'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Calendar, Edit2, Trash2, Heart, Award, Sparkles, UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { DigitalHeroesDB, User, GolfScore, Charity } from '@/lib/db';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [scores, setScores] = useState<GolfScore[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  
  // Score Input panel state
  const [scoreVal, setScoreVal] = useState<number>(36);
  const [scoreDate, setScoreDate] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  
  // Edit state variables
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState<number>(36);

  // Winnings Proof submission mockup
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const prof = await DigitalHeroesDB.getUserProfile(session.user.id);
      if (!prof) {
        // Create user profile if none exists (fallback)
        const newProf: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: 'subscriber',
          subscriptionStatus: 'active',
          subscriptionType: 'monthly',
          renewalDate: '2026-07-18',
          selectedCharityId: 'charity-1',
          charityPercentage: 10,
          winnings: 0,
          winningsStatus: 'None'
        };
        await DigitalHeroesDB.saveProfile(session.user.id, newProf);
        setCurrentUser(newProf);
      } else {
        setCurrentUser(prof);
      }

      const userScores = await DigitalHeroesDB.getScores(session.user.id);
      setScores(userScores);

      const allCharities = await DigitalHeroesDB.getCharities();
      setCharities(allCharities);

      // Set today as default date
      const today = new Date().toISOString().split('T')[0];
      setScoreDate(today);
    };

    loadSession();
  }, []);

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg('');
    setSuccessMsg('');

    const res = await DigitalHeroesDB.addScore(currentUser.id, scoreVal, scoreDate);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to add score.');
      return;
    }

    setSuccessMsg('Score recorded! Roller updated.');
    const updatedScores = await DigitalHeroesDB.getScores(currentUser.id);
    setScores(updatedScores);
    
    // Trigger celebratory confetti if score is high
    if (scoreVal >= 38) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  const handleUpdateCharitySettings = async (charityId: string, percentage: number) => {
    if (!currentUser) return;
    
    const res = await DigitalHeroesDB.saveProfile(currentUser.id, {
      selectedCharityId: charityId,
      charityPercentage: percentage
    });

    if (res.success) {
      setCurrentUser({ ...currentUser, selectedCharityId: charityId, charityPercentage: percentage });
    } else {
      setErrorMsg(res.error || 'Failed to update charity settings');
    }
  };

  const handleDeleteScore = async (id: string) => {
    const res = await DigitalHeroesDB.deleteScore(id);
    if (res.success && currentUser) {
      const updatedScores = await DigitalHeroesDB.getScores(currentUser.id);
      setScores(updatedScores);
    }
  };

  const startEdit = (score: GolfScore) => {
    setEditingScoreId(score.id);
    setEditingVal(score.score);
  };

  const saveEdit = async (id: string) => {
    const res = await DigitalHeroesDB.editScore(id, editingVal);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid score values');
      return;
    }
    setEditingScoreId(null);
    if (currentUser) {
      const updatedScores = await DigitalHeroesDB.getScores(currentUser.id);
      setScores(updatedScores);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingProof(true);

    const demoProofUrl = 'https://storage.googleapis.com/dh-proofs/verified_golf_platform.png';
    if (!currentUser) return;

    const res = await DigitalHeroesDB.saveProfile(currentUser.id, {
      winningsStatus: 'Pending',
      proofUrl: demoProofUrl
    });

    if (res.success) {
      setCurrentUser({ ...currentUser, winningsStatus: 'Pending', proofUrl: demoProofUrl });
      setProofSubmitted(true);
    }
    setUploadingProof(false);
  };

  if (!currentUser) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#fff' }}>Loading profile session...</div>;
  }

  const selectedCharity = charities.find(c => c.id === currentUser.selectedCharityId);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      
      {/* Welcome and Status Header */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>Subscriber Dashboard</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: '#fff', marginTop: '0.25rem' }}>
            Hello, {currentUser.email.split('@')[0]}
          </h1>
        </div>

        {/* Subscription Status Card */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px' }}>
          <div style={{
            background: currentUser.subscriptionStatus === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: currentUser.subscriptionStatus === 'active' ? 'var(--primary)' : '#ef4444',
            padding: '0.5rem',
            borderRadius: '10px'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subscription Plan</div>
            <div style={{ fontWeight: 700, color: '#fff' }}>
              {currentUser.subscriptionType === 'monthly' ? 'Monthly Access ($19.99)' : 
               currentUser.subscriptionType === 'yearly' ? 'Yearly Access ($189.99)' : 'No Active Plan ($0.00)'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Renewal Date: {currentUser.renewalDate || 'N/A'}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Left Side: Score Entries Roller */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Score Roller List */}
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Golf Scores (Rolling 5)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Only your latest 5 scores are retained. Oldest is replaced automatically.
                </p>
              </div>
              <span style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--primary)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                {scores.length} / 5 stored
              </span>
            </div>

            {scores.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No scores recorded yet. Submit your first score below!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {scores.map((s) => (
                  <div key={s.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.date}</div>
                        {editingScoreId === s.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <input
                              type="number"
                              min="1"
                              max="45"
                              value={editingVal}
                              onChange={(e) => setEditingVal(Number(e.target.value))}
                              style={{ width: '60px', background: '#090e11', border: '1px solid var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}
                            />
                            <button onClick={() => saveEdit(s.id)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                          </div>
                        ) : (
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                            {s.score} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Stableford Pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => startEdit(s)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteScore(s.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Score Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Record New Score</h3>
            
            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{errorMsg}</div>}
            {successMsg && <div style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '1rem' }}>{successMsg}</div>}

            <form onSubmit={handleAddScore} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Score Value (1 - 45 Stableford)</label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  required
                  className="form-input"
                  value={scoreVal}
                  onChange={(e) => setScoreVal(Number(e.target.value))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Date of Play (Duplicate dates not allowed)</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={scoreDate}
                  onChange={(e) => setScoreDate(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                <Plus size={16} /> Log Score
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Charity settings & Draw payouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Charity Recipient Setting panel */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Heart size={20} style={{ color: '#ef4444', fill: '#ef4444' }} /> Charity Recipient Allocation
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Active Charity Partner</label>
                <select
                  value={currentUser.selectedCharityId || ''}
                  onChange={(e) => handleUpdateCharitySettings(e.target.value, currentUser.charityPercentage)}
                  className="form-input"
                >
                  <option value="" disabled>Select a charity</option>
                  {charities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  <span>Custom Donation Fraction</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{currentUser.charityPercentage}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={currentUser.charityPercentage}
                  onChange={(e) => handleUpdateCharitySettings(currentUser.selectedCharityId, Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              {selectedCharity && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{selectedCharity.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{selectedCharity.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Winnings Overview & Verification Submission */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Award size={20} style={{ color: 'var(--accent)' }} /> Winnings & Prize Payouts
            </h3>

            <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Winnings</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>
                  ${currentUser.winnings.toLocaleString()}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Payout Status</div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: currentUser.winningsStatus === 'Paid' ? 'var(--primary)' : 
                         currentUser.winningsStatus === 'Pending' ? '#3b82f6' : 'var(--text-muted)',
                  marginTop: '0.5rem'
                }}>
                  {currentUser.winningsStatus}
                </div>
              </div>
            </div>

            {currentUser.winnings > 0 && currentUser.winningsStatus !== 'Paid' && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Submit Score Verification</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Please upload a screenshot from your verified golf system showing the scores logged.
                </p>

                {proofSubmitted || currentUser.winningsStatus === 'Pending' ? (
                  <div style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} /> Verification document submitted. Waiting for admin approval.
                  </div>
                ) : (
                  <form onSubmit={handleUploadProof}>
                    <button type="submit" disabled={uploadingProof} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      <UploadCloud size={18} /> {uploadingProof ? 'Uploading Proof...' : 'Upload Score Screenshot'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
