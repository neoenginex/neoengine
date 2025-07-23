import React, {useState, useRef, useEffect} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Animated, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, Alert} from 'react-native';
import { PostService } from '../utils/supabase';

interface ThreadProps {
  onTabChange?: (tab: string) => void;
  onHeaderNavigation?: (tab: string) => void;
  selectedPost?: any;
  currentUserWallet?: string;
}

export default function Thread({
  onTabChange, 
  onHeaderNavigation, 
  selectedPost,
  currentUserWallet
}: ThreadProps) {
  const [commentText, setCommentText] = useState('');
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([]);
  const [currentPost, setCurrentPost] = useState(selectedPost);
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

  const handleLike = async (postId: string) => {
    if (!currentUserWallet) return;
    
    const wasLiked = userLikedPosts.includes(postId);
    
    // Optimistic update
    if (wasLiked) {
      setUserLikedPosts(prev => prev.filter(id => id !== postId));
      setCurrentPost(prev => prev ? { ...prev, like_count: Math.max(0, prev.like_count - 1) } : prev);
    } else {
      setUserLikedPosts(prev => [...prev, postId]);
      setCurrentPost(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : prev);
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
        setCurrentPost(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : prev);
      } else {
        setUserLikedPosts(prev => prev.filter(id => id !== postId));
        setCurrentPost(prev => prev ? { ...prev, like_count: Math.max(0, prev.like_count - 1) } : prev);
      }
    }
  };

  const handleDeletePost = () => {
    if (!selectedPost || !currentUserWallet) return;
    
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
              await PostService.deletePost(selectedPost.id, currentUserWallet);
              onHeaderNavigation?.('home');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          }
        }
      ]
    );
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


  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[
        styles.header, 
        { 
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image
            source={require('../assets/icons/x.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>THREAD</Text>
        <View style={styles.spacer} />
      </Animated.View>

      <ScrollView 
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={1}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollContent}>
          {/* Original Post */}
          {selectedPost && (
            <View style={styles.originalPostContent}>
              <View style={styles.postHeader}>
                <View style={styles.userAvatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.displayName}>
                    {/* TODO: Fetch from blockchain profile */}
                    User {selectedPost.wallet.slice(0, 6)}
                  </Text>
                  <Text style={styles.username}>@{selectedPost.wallet.slice(0, 8)}...</Text>
                </View>
                <View style={styles.commentTimestampContainer}>
                  <Text style={styles.commentTimestamp}>{formatTimeAgo(selectedPost.created_at)}</Text>
                  {selectedPost.wallet === currentUserWallet && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={handleDeletePost}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.postText}>{selectedPost.content}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity 
                  style={styles.commentButton}
                >
                  <Image
                    source={require('../assets/icons/comment.png')}
                    style={styles.commentIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.likeButton}
                >
                  <Image
                    source={require('../assets/icons/like.png')}
                    style={[styles.heartIcon, styles.heartEmpty]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text style={styles.statText}>{formatLikeCount(selectedPost.like_count || 0)}</Text>
              </View>
            </View>
          )}

          {/* Comments Section - Real comments will be added later */}
          <View style={styles.commentsContainer}>
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          </View>
        </View>
      </ScrollView>

      {/* Comment Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.commentInputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#666666"
                multiline={true}
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendIndicator, { backgroundColor: commentText.trim().length > 0 ? '#FFFFFF' : '#666666' }]}
                disabled={commentText.trim().length === 0}
                onPress={() => {
                  if (commentText.trim()) {
                    // TODO: Save comment to database
                    console.log('Comment:', commentText.trim());
                    setCommentText('');
                  }
                }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  backButton: {
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
  originalPostContent: {
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
    marginTop: 1,
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
  },
  likeButton: {
    padding: 4,
    marginRight: 4,
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
  statText: {
    fontSize: 13,
    color: '#888888',
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    width: 40,
    marginTop: -2,
  },
  commentsContainer: {
    paddingHorizontal: 0,
    paddingTop: 24,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'microgramma-d-extended-bold',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 8,
  },
  commentContent: {
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    paddingRight: 50,
  },
  commentInfo: {
    flex: 1,
  },
  commentDisplayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Geist-Regular',
  },
  commentUsername: {
    fontSize: 12,
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
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    fontFamily: 'Geist-Regular',
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyButton: {
    marginLeft: 16,
    padding: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Geist-Regular',
  },
  replyingToHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  replyingToContent: {
    flex: 1,
  },
  replyingToDisplayName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Geist-Regular',
  },
  replyingToUsername: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'Geist-Regular',
    marginBottom: 2,
  },
  replyingToComment: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'Geist-Regular',
    lineHeight: 14,
  },
  cancelReply: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Geist-Regular',
  },
  commentInputContainer: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    marginRight: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
    paddingRight: 4,
    paddingLeft: 4,
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    minHeight: 20,
    maxHeight: 80,
    textAlignVertical: 'center',
  },
  sendIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#666666',
    marginLeft: 2,
  },
  sendButton: {
    backgroundColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonCenter: {
    alignSelf: 'center',
    marginTop: 0,
  },
  sendButtonTop: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'microgramma-d-extended-bold',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    marginRight: 12,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    marginRight: 8,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
});