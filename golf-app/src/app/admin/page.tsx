'use client';

import React, { useState, useEffect } from 'react';
import { Target, Settings, Eye, CheckCircle2, ShieldAlert, Award, TrendingUp, Sparkles, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { DigitalHeroesDB, User, Charity, Draw, GolfScore } from '@/lib/db';
import confetti from 'canvas-confetti';

export default function AdminControl() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [users, setUsers] = useState<User[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [scores, setScores] = useState<GolfScore[]>([]);

  // Simulation & Draw Logic config states
  const [drawLogic, setDrawLogic] = useState<'random' | 'algorithmic'>('random');
  const [drawType, setDrawType] = useState<'5-Number Match' | '4-Number Match' | '3-Number Match'>('5-Number Match');
  const [simulationResult, setSimulationResult] = useState<number[] | null>(null);
  const [simulatedWinners, setSimulatedWinners] = useState<string[]>([]);
  const [rolloverJackpot, setRolloverJackpot] = useState<number>(5000);

  // Charity management states
  const [charityName, setCharityName] = useState('');
  const [charityDesc, setCharityDesc] = useState('');
  const [charityImage, setCharityImage] = useState('');
  const [charityEvent, setCharityEvent] = useState('');

  // Active Admin selection states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userScoreInput, setUserScoreInput] = useState<number>(36);
  const [userScoreDate, setUserScoreDate] = useState<string>('');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const prof = await DigitalHeroesDB.getUserProfile(session.user.id);
      if (!prof || prof.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      
      // Load all data
      const allUsers = await DigitalHeroesDB.getUsers();
      const allCharities = await DigitalHeroesDB.getCharities();
      const allDraws = await DigitalHeroesDB.getDraws();
      const allScores = await DigitalHeroesDB.getScores();

      setUsers(allUsers);
      setCharities(allCharities);
      setDraws(allDraws);
      setScores(allScores);
      setLoading(false);
    };

    checkAdmin();
  }, []);

  // Admin simulation algorithm
  const handleRunSimulation = () => {
    let winningNums: number[] = [];
    if (drawLogic === 'random') {
      const unique = new Set<number>();
      while (unique.size < 5) {
        unique.add(Math.floor(Math.random() * 45) + 1);
      }
      winningNums = Array.from(unique).sort((a, b) => a - b);
    } else {
      const freq: Record<number, number> = {};
      scores.forEach(s => {
        freq[s.score] = (freq[s.score] || 0) + 1;
      });

      const sortedByFreq = Object.keys(freq)
        .map(Number)
        .sort((a, b) => freq[b] - freq[a]);

      const unique = new Set<number>(sortedByFreq.slice(0, 5));
      while (unique.size < 5) {
        unique.add(Math.floor(Math.random() * 45) + 1);
      }
      winningNums = Array.from(unique).sort((a, b) => a - b);
    }

    setSimulationResult(winningNums);

    const winnersList: string[] = [];
    const activeSubscribers = users.filter(u => u.subscriptionStatus === 'active');
    
    activeSubscribers.forEach(u => {
      const uScores = scores.filter(s => s.userId === u.id).map(s => s.score);
      const matchCount = uScores.filter(scoreVal => winningNums.includes(scoreVal)).length;
      
      if (drawType === '5-Number Match' && matchCount >= 5) winnersList.push(u.email);
      else if (drawType === '4-Number Match' && matchCount >= 4) winnersList.push(u.email);
      else if (drawType === '3-Number Match' && matchCount >= 3) winnersList.push(u.email);
    });

    setSimulatedWinners(winnersList);
  };

  const handlePublishDraw = async () => {
    if (!simulationResult) return;

    const activeSubscribersCount = users.filter(u => u.subscriptionStatus === 'active').length;
    const currentPool = activeSubscribersCount * 19.99 * 0.40;

    const newDraw: Draw = {
      id: 'draw_' + Math.random().toString(36).substr(2, 9),
      drawDate: new Date().toISOString().split('T')[0],
      type: drawType,
      status: 'published',
      winningNumbers: simulationResult,
      logicType: drawLogic,
      prizePool: currentPool,
      winnersCount: simulatedWinners.length
    };

    const res = await DigitalHeroesDB.addDraw(newDraw);
    if (!res.success) {
      alert('Failed to publish draw: ' + res.error);
      return;
    }

    // Update state
    const updatedDraws = [newDraw, ...draws];
    setDraws(updatedDraws);

    // Update user winnings in Supabase
    if (simulatedWinners.length > 0) {
      const splitPrize = currentPool / simulatedWinners.length;
      const updatedUsersPromises = users.map(async u => {
        if (simulatedWinners.includes(u.email)) {
          const newWinnings = u.winnings + splitPrize;
          await DigitalHeroesDB.saveProfile(u.id, {
            winnings: newWinnings,
            winningsStatus: 'Pending'
          });
          return { ...u, winnings: newWinnings, winningsStatus: 'Pending' as const };
        }
        return u;
      });

      const updatedUsersList = await Promise.all(updatedUsersPromises);
      setUsers(updatedUsersList);
    } else {
      setRolloverJackpot(prev => prev + currentPool);
    }

    setSimulationResult(null);
    setSimulatedWinners([]);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    const userScores = scores.filter(s => s.userId === u.id);
    if (userScores.length > 0) {
      setUserScoreInput(userScores[0].score);
      setUserScoreDate(userScores[0].date);
    } else {
      setUserScoreInput(36);
      setUserScoreDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleUpdateUserScore = async () => {
    if (!selectedUser) return;
    const res = await DigitalHeroesDB.addScore(selectedUser.id, userScoreInput, userScoreDate);
    if (res.success) {
      const allScores = await DigitalHeroesDB.getScores();
      setScores(allScores);
      alert('Score updated successfully!');
    } else {
      alert(res.error || 'Failed to update user score.');
    }
  };

  const handleVerifyWinner = async (userId: string, approve: boolean) => {
    const targetStatus = approve ? 'Paid' : 'None';
    const res = await DigitalHeroesDB.saveProfile(userId, { winningsStatus: targetStatus });
    
    if (res.success) {
      const updated = users.map(u => {
        if (u.id === userId) {
          return { ...u, winningsStatus: targetStatus as any };
        }
        return u;
      });
      setUsers(updated);
    } else {
      alert('Failed to verify winner: ' + res.error);
    }
  };

  const handleAddCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charityName || !charityDesc) return;

    const newCharityId = 'charity_' + Math.random().toString(36).substr(2, 9);
    const newCharity = {
      id: newCharityId,
      name: charityName,
      description: charityDesc,
      image: charityImage || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=600&auto=format&fit=crop',
      upcomingEvent: charityEvent || undefined,
      featured: false,
    };

    const res = await DigitalHeroesDB.saveCharity(newCharity);
    if (res.success) {
      const allCharities = await DigitalHeroesDB.getCharities();
      setCharities(allCharities);
      setCharityName('');
      setCharityDesc('');
      setCharityImage('');
      setCharityEvent('');
    } else {
      alert('Failed to add charity: ' + res.error);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#fff' }}>Verifying admin authorization...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }} className="glass-panel">
        <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          You do not have the required administrative permissions to access this control panel.
        </p>
        <a href="/dashboard" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1.5rem' }}>
          Return to Dashboard
        </a>
      </div>
    );
  }

  const totalPrizePoolAlloc = users.reduce((acc, curr) => acc + curr.winnings, 0);
  const activeSubs = users.filter(u => u.subscriptionStatus === 'active').length;
  const charityImpactEstimate = users.reduce((acc, curr) => {
    const cost = curr.subscriptionType === 'monthly' ? 19.99 : 189.99;
    return acc + (cost * (curr.charityPercentage / 100));
  }, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      
      {/* Title */}
      <section style={{ marginBottom: '2.5rem' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>Admin Control Console</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: '#fff', marginTop: '0.25rem' }}>
          Platform Management
        </h1>
      </section>

      {/* Analytics Dashboard Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Active Subscribers</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{activeSubs}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Charity Funding Est.</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>${charityImpactEstimate.toFixed(2)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Winnings Pool Claims</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>${totalPrizePoolAlloc.toFixed(2)}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Rollover Jackpot</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>${rolloverJackpot.toFixed(2)}</div>
        </div>
      </section>

      {/* Draw Execution & Simulation Segment */}
      <section className="glass-panel" style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={20} style={{ color: 'var(--primary)' }} /> Configure & Execute Monthly Draw
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Draw Logic Engine</label>
                <select value={drawLogic} onChange={(e: any) => setDrawLogic(e.target.value)} className="form-input">
                  <option value="random">Random Number Selection (Standard Lottery)</option>
                  <option value="algorithmic">Algorithmic Selection (Frequent User Scores)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Draw Type Tier</label>
                <select value={drawType} onChange={(e: any) => setDrawType(e.target.value)} className="form-input">
                  <option value="5-Number Match">5-Number Match (40% Pool Share)</option>
                  <option value="4-Number Match">4-Number Match (35% Pool Share)</option>
                  <option value="3-Number Match">3-Number Match (25% Pool Share)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={handleRunSimulation} className="btn-secondary" style={{ flexGrow: 1, justifyContent: 'center' }}>
                  Run Simulation
                </button>
                {simulationResult && (
                  <button type="button" onClick={handlePublishDraw} className="btn-primary" style={{ flexGrow: 1, justifyContent: 'center' }}>
                    Publish Results
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Simulation Analysis Mode</h4>
            {simulationResult ? (
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', margin: '0.75rem 0' }}>
                  {simulationResult.map((num, idx) => (
                    <div key={idx} style={{
                      background: 'var(--gradient-main)',
                      color: '#fff',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      boxShadow: '0 4px 10px var(--primary-glow)'
                    }}>
                      {num}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Matching Subscriber Winners Found:</strong> {simulatedWinners.length}
                  {simulatedWinners.length > 0 && (
                    <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                      {simulatedWinners.map((email, idx) => (
                        <li key={idx} style={{ color: 'var(--primary)' }}>{email}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
                Run simulation to pre-analyze draws before monthly publication.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Admin Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        
        {/* User Management & Score Editing panel */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>User Profiles & Scores</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: selectedUser?.id === u.id ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.01)',
                  border: selectedUser?.id === u.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{u.email}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.role}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Subscription: {u.subscriptionStatus} ({u.subscriptionType})
                </div>
              </div>
            ))}
          </div>

          {selectedUser && (
            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>
                Quick Score Override for {selectedUser.email.split('@')[0]}
              </h4>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flexGrow: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Score (1-45)</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    className="form-input"
                    value={userScoreInput}
                    onChange={(e) => setUserScoreInput(Number(e.target.value))}
                  />
                </div>
                <div style={{ flexGrow: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={userScoreDate}
                    onChange={(e) => setUserScoreDate(e.target.value)}
                  />
                </div>
              </div>
              <button onClick={handleUpdateUserScore} className="btn-primary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
                Log Override Score
              </button>
            </div>
          )}
        </div>

        {/* Winner Verification & Payout Approval panel */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Winner Verification Desk</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {users.filter(u => u.winnings > 0).length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active winnings recorded yet.
              </div>
            ) : (
              users.filter(u => u.winnings > 0).map(u => (
                <div key={u.id} style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{u.email}</strong>
                      <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        Won: ${u.winnings.toLocaleString()}
                      </div>
                    </div>
                    <span style={{
                      background: u.winningsStatus === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: u.winningsStatus === 'Paid' ? 'var(--primary)' : 'var(--accent)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem'
                    }}>
                      {u.winningsStatus}
                    </span>
                  </div>

                  {u.proofUrl && u.winningsStatus === 'Pending' && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={14} /> Winner uploaded proof: <a href={u.proofUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>View Screenshot</a>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleVerifyWinner(u.id, true)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                          Approve Payout
                        </button>
                        <button onClick={() => handleVerifyWinner(u.id, false)} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: '#ef4444' }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Charity CRUD segment */}
      <section className="glass-panel" style={{ marginTop: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={20} style={{ color: '#ef4444', fill: '#ef4444' }} /> Add & Manage Charities
        </h3>

        <form onSubmit={handleAddCharity} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Charity Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={charityName}
              onChange={(e) => setCharityName(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Description Summary</label>
            <input
              type="text"
              required
              className="form-input"
              value={charityDesc}
              onChange={(e) => setCharityDesc(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Cover Image URL</label>
            <input
              type="text"
              placeholder="https://..."
              className="form-input"
              value={charityImage}
              onChange={(e) => setCharityImage(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Upcoming Event (Optional)</label>
            <input
              type="text"
              placeholder="Event Details..."
              className="form-input"
              value={charityEvent}
              onChange={(e) => setCharityEvent(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: 'span 1' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              Add Charity listing
            </button>
          </div>
        </form>
      </section>

    </div>
  );
}
