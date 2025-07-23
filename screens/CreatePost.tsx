import React, {useState} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, TextInput, SafeAreaView, Alert, ActivityIndicator} from 'react-native';
import { PostService } from '../utils/supabase';

interface CreatePostProps {
  onHeaderNavigation?: (tab: string) => void;
}

export default function CreatePost({onHeaderNavigation}: CreatePostProps) {
  const [postText, setPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [currentUserWallet] = useState('demo_wallet_123'); // TODO: Get from actual wallet connection


  const handleBack = () => {
    onHeaderNavigation?.('home');
  };

  const handlePost = async () => {
    if (postText.trim().length === 0) return;
    
    setIsPosting(true);
    
    try {
      await PostService.createPost(currentUserWallet, postText.trim());
      
      // Clear the text and navigate back
      setPostText('');
      onHeaderNavigation?.('home');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={handleBack} style={styles.backButtonContainer}>
            <Image
              source={require('../assets/icons/x.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={handlePost}
          style={[styles.postButton, { 
            opacity: (postText.trim().length > 0 && !isPosting) ? 1 : 0.5,
            backgroundColor: isPosting ? '#444444' : '#666666'
          }]}
          disabled={postText.trim().length === 0 || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postButtonText}>POST</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.postArea}>
          <View style={styles.userSection}>
            <View style={styles.userAvatar} />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={postText}
                onChangeText={setPostText}
                placeholder="What's happening?"
                placeholderTextColor="#666666"
                multiline={true}
                maxLength={2000}
                autoFocus={true}
                textAlignVertical="top"
                editable={!isPosting}
              />
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={[styles.characterCount, {
              color: postText.length > 1800 ? '#ff4444' : '#666666'
            }]}>
              {postText.length}/2000
            </Text>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#666666',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButtonContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  title: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'microgramma-d-extended-bold',
    textAlignVertical: 'center',
  },
  postButton: {
    backgroundColor: '#666666',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'microgramma-d-extended-bold',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  postArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  inputContainer: {
    flex: 1,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Geist-Regular',
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
    paddingTop: 2,
    marginTop: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 20,
    paddingBottom: 20,
  },
  characterCount: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Geist-Regular',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    marginRight: 4,
  },
});