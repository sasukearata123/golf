-- Schema SQL for Digital Heroes Platform (Supabase)

-- 1. Charities Table
CREATE TABLE IF NOT EXISTS public.charities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    upcoming_event TEXT,
    featured BOOLEAN DEFAULT false,
    total_donated NUMERIC DEFAULT 0
);

-- 2. Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role TEXT CHECK (role IN ('public', 'subscriber', 'admin')) DEFAULT 'subscriber',
    subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive', 'lapsed')) DEFAULT 'inactive',
    subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly', 'none')) DEFAULT 'none',
    renewal_date TEXT,
    selected_charity_id TEXT REFERENCES public.charities(id) ON DELETE SET NULL,
    charity_percentage NUMERIC DEFAULT 10 CONSTRAINT min_charity CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
    winnings NUMERIC DEFAULT 0,
    winnings_status TEXT CHECK (winnings_status IN ('Pending', 'Paid', 'None')) DEFAULT 'None',
    proof_url TEXT
);

-- 3. Golf Scores Table
CREATE TABLE IF NOT EXISTS public.golf_scores (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Draws Table
CREATE TABLE IF NOT EXISTS public.draws (
    id TEXT PRIMARY KEY,
    draw_date TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    winning_numbers INTEGER[] NOT NULL,
    logic_type TEXT NOT NULL,
    prize_pool NUMERIC DEFAULT 0,
    winners_count INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- Policies for Charities (Public can read, Admin can manage)
CREATE POLICY "Allow public read access to charities" ON public.charities
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage charities" ON public.charities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- Policies for Profiles
CREATE POLICY "Allow public read/update own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile details" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admin to manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- Policies for Golf Scores
CREATE POLICY "Allow users to manage own scores" ON public.golf_scores
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow admin to manage all scores" ON public.golf_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- Policies for Draws
CREATE POLICY "Allow public read access to draws" ON public.draws
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage draws" ON public.draws
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
        )
    );

-- Seed Initial Charity Data
INSERT INTO public.charities (id, name, description, image, upcoming_event, featured, total_donated)
VALUES 
('charity-1', 'GreenFairways Trust', 'Providing accessible green spaces and sporting grants to disadvantaged youth in urban areas.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop', 'Youth Charity Golf Classic - July 12th', true, 12450),
('charity-2', 'Mental Health Fairway', 'Supporting psychological wellness programmes through outdoor active recreation and therapy groups.', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop', 'Mindfulness Walks & Golf Outing - July 28th', false, 8900),
('charity-3', 'EcoSustain Golf Initiative', 'Promoting clean energy, water recycling systems, and carbon-neutral biodiversity offsets across municipal courses.', 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?q=80&w=600&auto=format&fit=crop', 'Eco-Golf Open Cup - August 5th', false, 15120)
ON CONFLICT (id) DO NOTHING;
