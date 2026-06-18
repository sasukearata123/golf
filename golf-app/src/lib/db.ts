import { supabase } from './supabaseClient';

export interface User {
  id: string; // Auth UUID
  email: string;
  role: 'public' | 'subscriber' | 'admin';
  subscriptionStatus: 'active' | 'inactive' | 'lapsed';
  subscriptionType: 'monthly' | 'yearly' | 'none';
  renewalDate: string;
  selectedCharityId: string;
  charityPercentage: number; // minimum 10%
  winnings: number;
  winningsStatus: 'Pending' | 'Paid' | 'None';
  proofUrl?: string;
}

export interface GolfScore {
  id: string;
  userId: string;
  score: number; // 1-45
  date: string; // YYYY-MM-DD
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  image: string;
  upcomingEvent?: string;
  featured: boolean;
  totalDonated: number;
}

export interface Draw {
  id: string;
  drawDate: string;
  type: '5-Number Match' | '4-Number Match' | '3-Number Match';
  status: 'simulated' | 'published';
  winningNumbers: number[];
  logicType: 'random' | 'algorithmic';
  prizePool: number;
  winnersCount: number;
}

export class DigitalHeroesDB {
  static async getCharities(): Promise<Charity[]> {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching charities:', error.message);
      return [];
    }
    
    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      image: d.image,
      upcomingEvent: d.upcoming_event,
      featured: d.featured,
      totalDonated: Number(d.total_donated)
    }));
  }

  static async saveCharity(charity: Omit<Charity, 'totalDonated'>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('charities')
      .insert({
        id: charity.id,
        name: charity.name,
        description: charity.description,
        image: charity.image,
        upcoming_event: charity.upcomingEvent,
        featured: charity.featured,
        total_donated: 0
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error.message);
      return [];
    }

    return (data || []).map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      subscriptionStatus: u.subscription_status,
      subscriptionType: u.subscription_type,
      renewalDate: u.renewal_date,
      selectedCharityId: u.selected_charity_id,
      charityPercentage: Number(u.charity_percentage),
      winnings: Number(u.winnings),
      winningsStatus: u.winnings_status,
      proofUrl: u.proof_url || undefined
    }));
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error.message);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      subscriptionStatus: data.subscription_status,
      subscriptionType: data.subscription_type,
      renewalDate: data.renewal_date,
      selectedCharityId: data.selected_charity_id,
      charityPercentage: Number(data.charity_percentage),
      winnings: Number(data.winnings),
      winningsStatus: data.winnings_status,
      proofUrl: data.proof_url || undefined
    };
  }

  static async saveProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    // Map js camelCase to db snake_case
    const dbUpdates: Record<string, any> = {};
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.subscriptionStatus !== undefined) dbUpdates.subscription_status = updates.subscriptionStatus;
    if (updates.subscriptionType !== undefined) dbUpdates.subscription_type = updates.subscriptionType;
    if (updates.renewalDate !== undefined) dbUpdates.renewal_date = updates.renewalDate;
    if (updates.selectedCharityId !== undefined) dbUpdates.selected_charity_id = updates.selectedCharityId;
    if (updates.charityPercentage !== undefined) dbUpdates.charity_percentage = updates.charityPercentage;
    if (updates.winnings !== undefined) dbUpdates.winnings = updates.winnings;
    if (updates.winningsStatus !== undefined) dbUpdates.winnings_status = updates.winningsStatus;
    if (updates.proofUrl !== undefined) dbUpdates.proof_url = updates.proofUrl;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  static async getScores(userId?: string): Promise<GolfScore[]> {
    let query = supabase.from('golf_scores').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching scores:', error.message);
      return [];
    }

    const scoresList: GolfScore[] = (data || []).map(s => ({
      id: s.id,
      userId: s.user_id,
      score: Number(s.score),
      date: s.date
    }));

    // Sort descending by date (reverse chronological order)
    return scoresList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async addScore(userId: string, scoreVal: number, dateStr: string): Promise<{ success: boolean; error?: string }> {
    if (scoreVal < 1 || scoreVal > 45) {
      return { success: false, error: 'Score must be between 1 and 45 (Stableford)' };
    }

    // Duplicate date check
    const { data: existing, error: checkError } = await supabase
      .from('golf_scores')
      .select('id')
      .eq('user_id', userId)
      .eq('date', dateStr);

    if (checkError) {
      return { success: false, error: checkError.message };
    }

    if (existing && existing.length > 0) {
      return { success: false, error: 'A score entry already exists for this date. Please edit or delete it instead.' };
    }

    // Fetch existing user scores ordered by date ascending to remove the oldest if count >= 5
    const { data: userScores, error: fetchError } = await supabase
      .from('golf_scores')
      .select('id, date')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (userScores && userScores.length >= 5) {
      const oldestScore = userScores[0];
      const { error: deleteError } = await supabase
        .from('golf_scores')
        .delete()
        .eq('id', oldestScore.id);
      
      if (deleteError) {
        return { success: false, error: deleteError.message };
      }
    }

    const newScoreId = 'score_' + Math.random().toString(36).substr(2, 9);
    const { error: insertError } = await supabase
      .from('golf_scores')
      .insert({
        id: newScoreId,
        user_id: userId,
        score: scoreVal,
        date: dateStr
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  }

  static async editScore(scoreId: string, scoreVal: number): Promise<{ success: boolean; error?: string }> {
    if (scoreVal < 1 || scoreVal > 45) {
      return { success: false, error: 'Score must be between 1 and 45' };
    }

    const { error } = await supabase
      .from('golf_scores')
      .update({ score: scoreVal })
      .eq('id', scoreId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  static async deleteScore(scoreId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('golf_scores')
      .delete()
      .eq('id', scoreId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  static async getDraws(): Promise<Draw[]> {
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .order('draw_date', { ascending: false });

    if (error) {
      console.error('Error fetching draws:', error.message);
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      drawDate: d.draw_date,
      type: d.type,
      status: d.status,
      winningNumbers: d.winning_numbers,
      logicType: d.logic_type,
      prizePool: Number(d.prize_pool),
      winnersCount: Number(d.winners_count)
    }));
  }

  static async addDraw(draw: Draw): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('draws')
      .insert({
        id: draw.id,
        draw_date: draw.drawDate,
        type: draw.type,
        status: draw.status,
        winning_numbers: draw.winningNumbers,
        logic_type: draw.logicType,
        prize_pool: draw.prizePool,
        winners_count: draw.winnersCount
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }
}
