import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://gchpumgpqtfeqlzfixqq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaHB1bWdwcXRmZXFsemZpeHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5OTM5MzQsImV4cCI6MjA2ODU2OTkzNH0.mx7beAG84X4eRxyFPICv4L_csI6an2oS2Nm4YHZO6ps';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserProfile {
  wallet: string;
  sbt_handle: string;
  display_name: string;
  bio: string;
  pfp_cid: string | null;
  banner_cid: string | null;
  created_at?: string;
  updated_at?: string;
}

export class ProfileService {
  
  /**
   * Create or update a user profile in Supabase
   */
  static async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        wallet: profile.wallet,
        sbt_handle: profile.sbt_handle,
        display_name: profile.display_name,
        bio: profile.bio,
        pfp_cid: profile.pfp_cid,
        banner_cid: profile.banner_cid,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wallet'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      throw new Error(`Failed to save profile: ${error.message}`);
    }

    return data as UserProfile;
  }

  /**
   * Get a user profile by wallet address
   */
  static async getProfile(walletAddress: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null;
      }
      console.error('Error fetching profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return data as UserProfile;
  }

  /**
   * Search profiles by display name
   */
  static async searchProfiles(query: string, limit: number = 10): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('display_name', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching profiles:', error);
      throw new Error(`Failed to search profiles: ${error.message}`);
    }

    return data as UserProfile[];
  }

  /**
   * Get all profiles (for debugging/admin purposes)
   */
  static async getAllProfiles(limit: number = 50): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all profiles:', error);
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    return data as UserProfile[];
  }

  /**
   * Delete a user profile
   */
  static async deleteProfile(walletAddress: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('wallet', walletAddress);

    if (error) {
      console.error('Error deleting profile:', error);
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
  }

  /**
   * Check if a profile exists
   */
  static async profileExists(walletAddress: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('wallet')
      .eq('wallet', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking profile existence:', error);
      throw new Error(`Failed to check profile existence: ${error.message}`);
    }

    return data !== null;
  }

  /**
   * 🚨 DEBUG ONLY - Clear all data from database (for production reset)
   * WARNING: This will delete ALL data from ALL tables!
   */
  static async clearAllDataForProduction(): Promise<void> {
    console.log('🚨 WARNING: Clearing ALL database data for production reset...');
    
    try {
      // Clear all tables in reverse order (to avoid foreign key constraints)
      await supabase.from('social_activities').delete().neq('id', 0);
      await supabase.from('equipped_cosmetics').delete().neq('wallet', '');
      await supabase.from('badges').delete().neq('id', 0);
      await supabase.from('handle_history').delete().neq('id', 0);
      await supabase.from('users').delete().neq('wallet', '');
      
      console.log('✅ All database data cleared successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw new Error(`Failed to clear database: ${error}`);
    }
  }
}

export interface Post {
  id: string;
  wallet: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
}

export interface PostLike {
  id: string;
  post_id: string;
  wallet: string;
  created_at: string;
}


export class PostService {
  
  /**
   * Create a new post
   */
  static async createPost(wallet: string, content: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        wallet,
        content,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return data as Post;
  }

  /**
   * Get all posts with like counts only
   */
  static async getPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_likes(id)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching posts:', error);
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    // Process the counts correctly
    const processedData = data?.map(post => ({
      ...post,
      like_count: post.post_likes?.length || 0,
      comment_count: 0, // Comments will be handled separately in Thread view
    }));

    return processedData as Post[];
  }

  /**
   * Like a post
   */
  static async likePost(postId: string, wallet: string): Promise<void> {
    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        wallet,
      });

    if (error) {
      console.error('Error liking post:', error);
      throw new Error(`Failed to like post: ${error.message}`);
    }
  }

  /**
   * Unlike a post
   */
  static async unlikePost(postId: string, wallet: string): Promise<void> {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('wallet', wallet);

    if (error) {
      console.error('Error unliking post:', error);
      throw new Error(`Failed to unlike post: ${error.message}`);
    }
  }

  /**
   * Check if user has liked a post
   */
  static async hasUserLikedPost(postId: string, wallet: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('wallet', wallet)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking like status:', error);
      return false;
    }

    return data !== null;
  }

  /**
   * Get user's liked posts
   */
  static async getUserLikedPosts(wallet: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('wallet', wallet);

    if (error) {
      console.error('Error fetching user likes:', error);
      return [];
    }

    return data.map(like => like.post_id);
  }

  /**
   * Delete a post (only by the owner)
   */
  static async deletePost(postId: string, wallet: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('wallet', wallet); // Only allow deletion by post owner

    if (error) {
      console.error('Error deleting post:', error);
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }


  /**
   * Subscribe to real-time post updates
   */
  static subscribeToPostUpdates(onUpdate: (post: Post) => void) {
    return supabase
      .channel('posts')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'posts' 
        }, 
        (payload) => {
          onUpdate(payload.new as Post);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time like updates
   */
  static subscribeToLikeUpdates(
    onLike: (like: PostLike) => void,
    onUnlike: (like: PostLike) => void
  ) {
    return supabase
      .channel('post_likes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'post_likes' 
        }, 
        (payload) => {
          onLike(payload.new as PostLike);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'post_likes' 
        }, 
        (payload) => {
          onUnlike(payload.old as PostLike);
        }
      )
      .subscribe();
  }
}

// SQL to create the tables in Supabase:
/*
-- Users table (already exists)
CREATE TABLE users (
  wallet TEXT PRIMARY KEY,
  sbt_handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  pfp_cid TEXT,
  banner_cid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes table
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, wallet)
);

-- Post comments table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL REFERENCES users(wallet) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create views for like and comment counts
CREATE VIEW posts_with_counts AS
SELECT 
  p.*,
  COALESCE(l.like_count, 0) as like_count,
  COALESCE(c.comment_count, 0) as comment_count
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as like_count
  FROM post_likes 
  GROUP BY post_id
) l ON p.id = l.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as comment_count
  FROM post_comments 
  GROUP BY post_id
) c ON p.id = c.post_id;

-- Add row level security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid()::text = wallet);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid()::text = wallet);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid()::text = wallet);

-- Post likes policies
CREATE POLICY "Post likes are viewable by everyone" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid()::text = wallet);
CREATE POLICY "Users can unlike their own likes" ON post_likes FOR DELETE USING (auth.uid()::text = wallet);

-- Post comments policies
CREATE POLICY "Post comments are viewable by everyone" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid()::text = wallet);
CREATE POLICY "Users can update their own comments" ON post_comments FOR UPDATE USING (auth.uid()::text = wallet);
CREATE POLICY "Users can delete their own comments" ON post_comments FOR DELETE USING (auth.uid()::text = wallet);

-- Users policies
CREATE POLICY "Profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = wallet);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = wallet);

-- Create indexes for better performance
CREATE INDEX idx_posts_wallet ON posts(wallet);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_wallet ON post_likes(wallet);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_wallet ON post_comments(wallet);
CREATE INDEX idx_users_display_name ON users(display_name);
CREATE INDEX idx_users_sbt_handle ON users(sbt_handle);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
*/