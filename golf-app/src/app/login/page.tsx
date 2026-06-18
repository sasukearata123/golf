'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DigitalHeroesDB } from '@/lib/db';
import { KeyRound, Mail, Sparkles, UserPlus, LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'subscriber' | 'admin'>('subscriber');
  
  // Subscriber specific fields (can be parsed from query params too)
  const [selectedCharity, setSelectedCharity] = useState('charity-1');
  const [charityPercentage, setCharityPercentage] = useState(10);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>('monthly');

  const [charities, setCharities] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pull URL search params if any
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') {
      setIsSignUp(true);
    }
    if (params.get('email')) setEmail(params.get('email') || '');
    if (params.get('charity')) setSelectedCharity(params.get('charity') || 'charity-1');
    if (params.get('percentage')) setCharityPercentage(Number(params.get('percentage')) || 10);
    if (params.get('plan')) setSubscriptionType((params.get('plan') as 'monthly' | 'yearly') || 'monthly');

    // Load charities
    DigitalHeroesDB.getCharities().then(res => setCharities(res));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Sign Up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user data returned.');

        // Insert user profile into public.profiles
        const profileData = {
          id: data.user.id,
          email: email,
          role: role,
          subscription_status: role === 'admin' ? 'active' : 'active',
          subscription_type: role === 'admin' ? 'yearly' : subscriptionType,
          renewal_date: subscriptionType === 'monthly' ? '2026-07-18' : '2027-06-18',
          selected_charity_id: role === 'subscriber' ? selectedCharity : null,
          charity_percentage: role === 'subscriber' ? charityPercentage : 10,
          winnings: 0,
          winnings_status: 'None',
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) throw profileError;

        setMessage({
          type: 'success',
          text: 'Registration successful! Signing in...',
        });

        // Redirect after delay
        setTimeout(() => {
          window.location.href = role === 'admin' ? '/admin' : '/dashboard';
        }, 1500);

      } else {
        // Sign In with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('Sign in failed.');

        // Fetch profile to see where to redirect
        const profile = await DigitalHeroesDB.getUserProfile(data.user.id);
        
        setMessage({
          type: 'success',
          text: 'Success! Redirecting...',
        });

        setTimeout(() => {
          if (profile && profile.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
        }, 1000);
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '2rem' }} className="glass-panel">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '0.4rem 0.8rem',
          borderRadius: '9999px',
          color: 'var(--primary)',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '1rem'
        }}>
          <Sparkles size={14} />
          <span>Secure Platform Gate</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: '#fff' }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          {isSignUp ? 'Set up your Digital Heroes access credentials' : 'Sign in to access your dashboard'}
        </p>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'var(--primary)' : '#ef4444'}`,
          color: message.type === 'success' ? 'var(--primary)' : '#ef4444',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              required
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              required
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {isSignUp && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Account Role Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('subscriber')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: role === 'subscriber' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: role === 'subscriber' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  Subscriber
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: role === 'admin' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: role === 'admin' ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  Admin
                </button>
              </div>
            </div>

            {role === 'subscriber' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Plan Selection</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setSubscriptionType('monthly')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: subscriptionType === 'monthly' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        background: subscriptionType === 'monthly' ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Monthly ($19.99/mo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubscriptionType('yearly')}
                      style={{
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: subscriptionType === 'yearly' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        background: subscriptionType === 'yearly' ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Yearly ($189.99/yr)
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Charity Target</label>
                  <select
                    className="form-input"
                    value={selectedCharity}
                    onChange={(e) => setSelectedCharity(e.target.value)}
                  >
                    {charities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    <span>Charity Contribution Allocation</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{charityPercentage}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={charityPercentage}
                    onChange={(e) => setCharityPercentage(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>
              </>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}
        >
          {loading ? 'Processing...' : isSignUp ? 'Create My Account' : 'Sign In'}
          <ArrowRight size={16} />
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            textDecoration: 'underline'
          }}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
