'use client';

import React, { useState, useEffect } from 'react';
import { Target, UserCheck, ShieldAlert, Sparkles, Heart, LogOut, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { DigitalHeroesDB, User } from '@/lib/db';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        DigitalHeroesDB.getUserProfile(session.user.id).then(prof => setProfile(prof));
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        DigitalHeroesDB.getUserProfile(session.user.id).then(prof => setProfile(prof));
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <html lang="en">
      <head>
        <title>Digital Heroes | Change Lives Through Golf</title>
        <meta name="description" content="A premium subscription-driven platform combining golf performance tracking, charity fundraising, and a monthly reward engine." />
      </head>
      <body>
        {/* Banner with Profile Summary */}
        <div style={{
          background: 'rgba(9, 14, 17, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.5rem 2rem',
          fontSize: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          zIndex: 100,
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Sparkles size={14} style={{ color: '#f59e0b' }} />
            <span>Digital Heroes Platform (Supabase Connection Secured)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Logged in as: <strong style={{ color: '#fff' }}>{user.email}</strong> 
                  {profile && ` (${profile.role.toUpperCase()})`}
                </span>
                <button
                  onClick={handleSignOut}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <LogOut size={12} /> Sign Out
                </button>
              </>
            ) : (
              <a
                href="/login"
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '2px 10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <LogIn size={12} /> Sign In / Sign Up
              </a>
            )}
          </div>
        </div>

        {/* Global Navigation Header */}
        <header style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(9, 14, 17, 0.5)',
          backdropFilter: 'blur(8px)'
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--gradient-main)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}>
              <Target size={22} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>DIGITAL</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 400, color: 'var(--primary)' }}>HEROES</span>
            </div>
          </a>

          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="/" className="nav-link">Home</a>
            {profile && profile.role === 'subscriber' && (
              <a href="/dashboard" className="nav-link">Dashboard</a>
            )}
            {profile && profile.role === 'admin' && (
              <>
                <a href="/dashboard" className="nav-link">Subscriber View</a>
                <a href="/admin" className="nav-link">Admin Control</a>
              </>
            )}
          </nav>
        </header>

        <main style={{ minHeight: 'calc(100vh - 180px)' }}>
          {children}
        </main>

        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'rgba(9, 14, 17, 0.8)',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          <p>© 2026 Digital Heroes. Secured Backend Database & Auth.</p>
          <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            Powered by change, sport, and <Heart size={14} style={{ color: '#ef4444', fill: '#ef4444' }} /> charitable impact.
          </p>
        </footer>
      </body>
    </html>
  );
}
