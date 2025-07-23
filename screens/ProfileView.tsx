import React, {useState, useRef, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Animated, SafeAreaView, RefreshControl, Alert} from 'react-native';
import { PostService, Post } from '../utils/supabase';

interface ProfileViewProps {
  onTabChange?: (tab: string) => void;
  onHeaderNavigation?: (tab: string) => void;
  selectedWallet?: string;
  currentUserWallet?: string;
}

export default function ProfileView({
  onTabChange, 
  onHeaderNavigation,
  selectedWallet,
  currentUserWallet
}: ProfileViewProps) {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const handleTabChange = (tab: string) => {
    onTabChange?.(tab);
  };

  const handleBack = () => {
    onHeaderNavigation?.('home');
  };

  const formatLikeCount = (count: number): string => {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      const k = count / 1000;
      return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
    } else {
      const m = count / 1000000;
      return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 10) return 'now';
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    
    // For older posts, show actual date
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    };
    return postDate.toLocaleDateString('en-US', options);
  };

  const loadUserPosts = async () => {
    if (!selectedWallet) return;
    
    try {
      // Get all posts and filter by user's wallet
      const allPosts = await PostService.getPosts(100, 0);
      const filteredPosts = allPosts.filter(post => post.wallet === selectedWallet);
      setUserPosts(filteredPosts);
      
      // Load current user's liked posts
      if (currentUserWallet) {
        const likedPosts = await PostService.getUserLikedPosts(currentUserWallet);
        setUserLikedPosts(likedPosts);
      }
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUserWallet) return;
    
    const wasLiked = userLikedPosts.includes(postId);
    
    // Optimistic update
    if (wasLiked) {
      setUserLikedPosts(prev => prev.filter(id => id !== postId));
      setUserPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: Math.max(0, post.like_count - 1) }
          : post
      ));
    } else {
      setUserLikedPosts(prev => [...prev, postId]);
      setUserPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: post.like_count + 1 }
          : post
      ));
    }
    
    // API call
    try {
      if (wasLiked) {
        await PostService.unlikePost(postId, currentUserWallet);
      } else {
        await PostService.likePost(postId, currentUserWallet);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      if (wasLiked) {
        setUserLikedPosts(prev => [...prev, postId]);
        setUserPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + 1 }
            : post
        ));
      } else {
        setUserLikedPosts(prev => prev.filter(id => id !== postId));
        setUserPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: Math.max(0, post.like_count - 1) }
            : post
        ));
      }
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await PostService.deletePost(postId, currentUserWallet!);
              setUserPosts(prev => prev.filter(post => post.id !== postId));
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserPosts();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const diff = offsetY - lastScrollY.current;
        
        if (diff > 3) {
          Animated.timing(headerTranslateY, {
            toValue: -50,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (diff < -3) {
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        lastScrollY.current = offsetY;
      },
    }
  );

  useEffect(() => {
    loadUserPosts();
  }, [selectedWallet]);

  if (!selectedWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user selected</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[
        styles.header, 
        { 
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButtonHeader}>
          <Image
            source={require('../assets/icons/x.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>@{selectedWallet.slice(0, 8)}...</Text>
        <View style={styles.spacer} />
      </Animated.View>

      <ScrollView 
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            titleColor="#FFFFFF"
          />
        }
      >
        <View style={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileUsername}>@{selectedWallet.slice(0, 8)}...</Text>
                <Text style={styles.profileWallet}>{selectedWallet}</Text>
                <Text style={styles.postCount}>{userPosts.length} posts</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Posts */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : userPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            userPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <View style={styles.post}>
                  <View style={styles.postHeader}>
                    <View style={styles.userAvatar} />
                    <View style={styles.userInfo}>
                      <Text style={styles.username}>
                        @{post.wallet.slice(0, 8)}...
                      </Text>
                    </View>
                    <View style={styles.commentTimestampContainer}>
                      <Text style={styles.commentTimestamp}>{formatTimeAgo(post.created_at)}</Text>
                      {post.wallet === currentUserWallet && (
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeletePost(post.id)}
                        >
                          <Text style={styles.deleteButtonText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={styles.postText}>{post.content}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity style={styles.commentButton}>
                      <Image
                        source={require('../assets/icons/comment.png')}
                        style={styles.commentIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleLike(post.id)}
                      style={styles.likeButton}
                    >
                      <Image
                        source={userLikedPosts.includes(post.id) 
                          ? require('../assets/icons/liked.png') 
                          : require('../assets/icons/like.png')
                        }
                        style={[
                          styles.heartIcon, 
                          userLikedPosts.includes(post.id) ? styles.heartFilled : styles.heartEmpty
                        ]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <Text style={styles.statText}>{formatLikeCount(post.like_count || 0)}</Text>
                  </View>
                </View>
                {index < userPosts.length - 1 && <View style={styles.postDivider} />}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 16,
    paddingRight: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 50,
  },
  backButtonHeader: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'microgramma-d-extended-bold',
    flex: 1,
    marginLeft: 8,
    textAlignVertical: 'center',
  },
  spacer: {
    width: 28,
    height: 28,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'microgramma-d-extended-bold',
    marginBottom: 4,
  },
  profileWallet: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Geist-Regular',
    marginBottom: 8,
  },
  postCount: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'Geist-Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 0,
    marginHorizontal: 16,
  },
  post: {
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    paddingRight: 60,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'Geist-Regular',
    marginTop: 1,
  },
  commentTimestampContainer: {
    position: 'absolute',
    top: -2,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentTimestamp: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Geist-Regular',
    marginRight: 8,
  },
  deleteButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '300',
    lineHeight: 18,
  },
  postText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
    fontFamily: 'Geist-Regular',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  likeButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: 4,
  },
  heartIcon: {
    width: 13,
    height: 13,
  },
  heartEmpty: {
    tintColor: '#666666',
  },
  heartFilled: {
    tintColor: '#ff4444',
  },
  commentButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: 4,
  },
  commentIcon: {
    width: 12,
    height: 12,
    tintColor: '#666666',
  },
  statText: {
    fontSize: 13,
    color: '#888888',
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    width: 40,
  },
  postDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 24,
    marginHorizontal: 16,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#666666',
    fontSize: 18,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'microgramma-d-extended-bold',
  },
});