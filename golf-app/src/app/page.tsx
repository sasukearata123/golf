'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, Sparkles, Trophy, ArrowRight, Activity, Search, Filter } from 'lucide-react';
import { DigitalHeroesDB, Charity } from '@/lib/db';

export default function Home() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Subscription setup demo hooks
  const [subType, setSubType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedSignupCharity, setSelectedSignupCharity] = useState('charity-1');
  const [signupPercentage, setSignupPercentage] = useState(10);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    DigitalHeroesDB.getCharities().then(res => setCharities(res));
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail) return;

    window.location.href = `/login?mode=signup&email=${encodeURIComponent(signupEmail)}&charity=${encodeURIComponent(selectedSignupCharity)}&percentage=${signupPercentage}&plan=${subType}`;
  };

  const filteredCharities = charities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'featured') return matchesSearch && c.featured;
    return matchesSearch;
  });

  const featuredCharity = charities.find(c => c.featured);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '5rem 1rem 4rem 1rem',
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          color: 'var(--primary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={16} />
          <span>Rethinking Sport & Charitable Impact</span>
        </div>
        
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
          fontWeight: 700,
          lineHeight: 1.1,
          color: '#fff',
          maxWidth: '900px',
          margin: '0 auto 1.5rem auto'
        }}>
          Improve Your Game. <br />
          <span style={{
            background: 'var(--gradient-main)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>Empower True Heroes.</span>
        </h1>
        
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.2rem',
          maxWidth: '600px',
          margin: '0 auto 2.5rem auto'
        }}>
          A premium subscription platform. Track your golf performance, enter monthly prize draws, and direct custom funding to charities changing lives.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="#join" className="btn-primary">
            Start Your Impact <ArrowRight size={18} />
          </a>
          <a href="#charities" className="btn-secondary">
            Explore Charities
          </a>
        </div>
      </section>

      {/* Featured Statistics row */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        margin: '3rem 0'
      }}>
        <div className="glass-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '14px', color: 'var(--accent)' }}>
            <Trophy size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>$125,000+</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monthly Pool Winnings Distributed</p>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '14px', color: 'var(--primary)' }}>
            <Heart size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>10% - 100%</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Flexible Charity Contribution Tiers</p>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '14px', color: '#3b82f6' }}>
            <Activity size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>5 Score Rolling</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Dynamic performance indices</p>
          </div>
        </div>
      </section>

      {/* Spotlight Charity Segment */}
      {featuredCharity && (
        <section className="glass-panel" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          margin: '5rem 0',
          background: 'linear-gradient(135deg, rgba(20, 28, 33, 0.9) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Spotlight Cause of the Month</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', marginTop: '0.5rem', marginBottom: '1.2rem' }}>
              {featuredCharity.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {featuredCharity.description}
            </p>
            {featuredCharity.upcomingEvent && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1rem',
                borderRadius: '12px',
                borderLeft: '4px solid var(--accent)',
                marginBottom: '1.5rem'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Upcoming Event</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{featuredCharity.upcomingEvent}</span>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Funds Generated: </span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>${featuredCharity.totalDonated.toLocaleString()}</strong>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: '15px', overflow: 'hidden', minHeight: '260px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={featuredCharity.image} 
              alt={featuredCharity.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }}
            />
          </div>
        </section>
      )}

      {/* Subscription signup widget */}
      <section id="join" className="glass-panel" style={{ margin: '5rem 0', padding: '3rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '1rem' }}>Support & Compete</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Choose a plan, select your target charity, and define your customizable donation percentage.
          </p>

          {signupSuccess ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--primary)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Subscription Active!</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Redirecting to your personalized impact dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Subscription Plan</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setSubType('monthly')}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: subType === 'monthly' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: subType === 'monthly' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <strong>Monthly Plan</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>$19.99 / mo</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubType('yearly')}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: subType === 'yearly' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: subType === 'yearly' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <strong>Yearly Plan (Save 20%)</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>$189.99 / yr</div>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Target Charity</label>
                <select
                  value={selectedSignupCharity}
                  onChange={(e) => setSelectedSignupCharity(e.target.value)}
                  className="form-input"
                >
                  {charities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <span>Charity Contribution Fraction</span>
                  <span style={{ color: 'var(--primary)' }}>{signupPercentage}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={signupPercentage}
                  onChange={(e) => setSignupPercentage(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  A minimum of 10% is allocated directly to your charity.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  className="form-input"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Complete Subscription & Support
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Charity Directory Search Segment */}
      <section id="charities" style={{ margin: '5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>All Causes</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Explore our community-curated partner organizations.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search causes..."
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '240px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setSelectedFilter('all')}
                style={{
                  background: selectedFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                All
              </button>
              <button 
                onClick={() => setSelectedFilter('featured')}
                style={{
                  background: selectedFilter === 'featured' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Featured
              </button>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2rem'
        }}>
          {filteredCharities.map(c => (
            <article key={c.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>{c.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flexGrow: 1, marginBottom: '1rem' }}>
                {c.description}
              </p>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Donated to date</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>${c.totalDonated.toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}
