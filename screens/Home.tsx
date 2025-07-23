import React, {useState, useRef, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Animated, TextInput, Dimensions, RefreshControl, ActivityIndicator, Alert, Modal} from 'react-native';
import Search from './Search';
import Connect from './Connect';
import Swap from './Swap';
import Social from './Social';
import Profile from './Profile';
import Wallet from './Wallet';
import Settings from './Settings';
import CreatePost from './CreatePost';
import Thread from './Thread';
import ProfileView from './ProfileView';
import ProfileIcon from '../components/ProfileIcon';
import { PostService, Post, UserProfile } from '../utils/supabase';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedProfileWallet, setSelectedProfileWallet] = useState<string | null>(null);
  const [currentUserWallet] = useState('demo_wallet_123'); // TODO: Get from actual wallet connection
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const navbarOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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

  const loadPosts = async () => {
    try {
      const fetchedPosts = await PostService.getPosts(20, 0);
      setPosts(fetchedPosts);
      
      // Load user's liked posts
      const likedPosts = await PostService.getUserLikedPosts(currentUserWallet);
      setUserLikedPosts(likedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    const wasLiked = userLikedPosts.includes(postId);
    
    // Optimistic update first
    if (wasLiked) {
      setUserLikedPosts(prev => prev.filter(id => id !== postId));
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: Math.max(0, post.like_count - 1) }
          : post
      ));
    } else {
      setUserLikedPosts(prev => [...prev, postId]);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, like_count: post.like_count + 1 }
          : post
      ));
    }
    
    // Then make the API call (real-time updates are disabled to prevent double counting)
    try {
      if (wasLiked) {
        await PostService.unlikePost(postId, currentUserWallet);
      } else {
        await PostService.likePost(postId, currentUserWallet);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      if (wasLiked) {
        setUserLikedPosts(prev => [...prev, postId]);
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: post.like_count + 1 }
            : post
        ));
      } else {
        setUserLikedPosts(prev => prev.filter(id => id !== postId));
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, like_count: Math.max(0, post.like_count - 1) }
            : post
        ));
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
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
              await PostService.deletePost(postId, currentUserWallet);
              setPosts(prev => prev.filter(post => post.id !== postId));
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadPosts();
    
    // Only subscribe to new posts, not likes (to avoid double counting)
    const postSubscription = PostService.subscribeToPostUpdates((newPost) => {
      setPosts(prev => {
        // Check if post already exists to avoid duplicates
        const exists = prev.some(p => p.id === newPost.id);
        return exists ? prev : [{ ...newPost, like_count: 0, comment_count: 0 }, ...prev];
      });
    });
    
    return () => {
      postSubscription.unsubscribe();
    };
  }, []);



  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const diff = offsetY - lastScrollY.current;
        
        if (diff > 3) {
          // Scrolling down - hide header and fade navbar
          Animated.timing(headerTranslateY, {
            toValue: -50,
            duration: 200,
            useNativeDriver: true,
          }).start();
          Animated.timing(navbarOpacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (diff < -3) {
          // Scrolling up - show header and navbar
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
          Animated.timing(navbarOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        lastScrollY.current = offsetY;
      },
    }
  );

  if (activeTab === 'search') {
    return <Search onTabChange={handleTabChange} onHeaderNavigation={setActiveTab} />;
  }
  
  if (activeTab === 'connect') {
    return <Connect onTabChange={handleTabChange} onHeaderNavigation={setActiveTab} />;
  }
  
  if (activeTab === 'swap') {
    return <Swap onTabChange={handleTabChange} onHeaderNavigation={setActiveTab} />;
  }
  
  if (activeTab === 'social') {
    return <Social onTabChange={handleTabChange} onHeaderNavigation={setActiveTab} />;
  }

  if (activeTab === 'profile') {
    return <Profile onTabChange={handleTabChange} onHeaderNavigation={setActiveTab} />;
  }

  if (activeTab === 'wallet') {
    return <Wallet onTabChange={handleTabChange} onHeaderNavigation={setActiveTab} />;
  }

  if (activeTab === 'settings') {
    return <Settings onTabChange={handleTabChange} onHeaderNavigation={setActiveTab} />;
  }

  if (activeTab === 'createpost') {
    return <CreatePost onHeaderNavigation={setActiveTab} />;
  }

  if (activeTab === 'thread') {
    return <Thread 
      onTabChange={handleTabChange} 
      onHeaderNavigation={setActiveTab}
      selectedPost={selectedPost}
      currentUserWallet={currentUserWallet}
    />;
  }

  if (activeTab === 'profileview') {
    return <ProfileView 
      onTabChange={handleTabChange} 
      onHeaderNavigation={setActiveTab}
      selectedWallet={selectedProfileWallet}
      currentUserWallet={currentUserWallet}
    />;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.header, 
        { 
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <ProfileIcon 
          onPress={() => setActiveTab('profile')}
        />
        <Text style={styles.title}>HOME</Text>
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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet. Be the first to share something!</Text>
            </View>
          ) : (
            posts.map((post, index) => (
              <React.Fragment key={post.id}>
                <TouchableOpacity 
                  style={styles.post}
                  onPress={() => {
                    setSelectedPost(post);
                    setActiveTab('thread');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.postHeader}>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedProfileWallet(post.wallet);
                        setActiveTab('profileview');
                      }}
                    >
                      <View style={styles.userAvatar} />
                    </TouchableOpacity>
                    <View style={styles.userInfo}>
                      <Text style={styles.displayName}>
                        {/* TODO: Fetch from blockchain profile */}
                        User {post.wallet.slice(0, 6)}
                      </Text>
                      <Text style={styles.username}>
                        @{post.wallet.slice(0, 8)}...
                      </Text>
                    </View>
                    <View style={styles.commentTimestampContainer}>
                      <Text style={styles.commentTimestamp}>{formatTimeAgo(post.created_at)}</Text>
                      {post.wallet === currentUserWallet && (
                        <TouchableOpacity 
                          style={styles.postDeleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                        >
                          <Text style={styles.postDeleteButtonText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={styles.postText}>{post.content}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity 
                      style={styles.commentButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedPost(post);
                        setActiveTab('thread');
                      }}
                    >
                      <Image
                        source={require('../assets/icons/comment.png')}
                        style={styles.commentIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
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
                </TouchableOpacity>
                {index < posts.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>
      
      {/* Post Button */}
      <Animated.View style={[
        styles.postContainer,
        { 
          opacity: navbarOpacity
        }
      ]}>
        <TouchableOpacity 
          style={styles.postButton}
          activeOpacity={0.8}
          onPress={() => setActiveTab('createpost')}
        >
          <Image
            source={require('../assets/icons/plus.png')}
            style={styles.plusIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View style={[
        styles.navbar, 
        { 
          opacity: navbarOpacity
        }
      ]}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Image
            source={require('../assets/icons/home.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('search')}
        >
          <Image
            source={require('../assets/icons/search.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.connectNavItem}
          onPress={() => setActiveTab('connect')}
        >
          <Image
            source={require('../assets/icons/connect.png')}
            style={styles.connectIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('swap')}
        >
          <Image
            source={require('../assets/icons/swap.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('social')}
        >
          <Image
            source={require('../assets/icons/social.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Animated.View>

    </View>
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
  logoContainer: {
    width: 28,
    height: 28,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  logo: {
    width: 16,
    height: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'microgramma-d-extended-bold',
    flex: 1,
    marginLeft: 8,
    textAlignVertical: 'center',
  },
  walletContainer: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  gearContainer: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  gearIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'microgramma-d-extended-bold',
    textAlign: 'center',
  },
  spacer: {
    width: 35,
    height: 35,
  },
  postContainer: {
    position: 'absolute',
    bottom: 66,
    right: 12,
    zIndex: 5,
  },
  postButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.75)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Geist-Black',
  },
  username: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
    fontFamily: 'Geist-Regular',
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Geist-Regular',
    position: 'absolute',
    top: 0,
    right: 0,
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
  bulletText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Geist-Regular',
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
  postStats: {
    paddingTop: 0,
  },
  statText: {
    fontSize: 13,
    color: '#888888',
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    width: 40,
    marginTop: -2,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  connectNavItem: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  connectIcon: {
    width: 26,
    height: 26,
    tintColor: '#FFFFFF',
  },
  activeNavIcon: {
    tintColor: '#666666',
    shadowColor: '#666666',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
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
    marginTop: 12,
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
  postDeleteButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  postDeleteButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '300',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 24,
    marginHorizontal: 12,
  },
});