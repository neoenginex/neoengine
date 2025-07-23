# 📱 NeoEngine Frontend Architecture

**Complete technical documentation for NeoEngine's React Native mobile application and user experience**

---

## 🎯 Frontend Overview

NeoEngine's frontend is a **mobile-first React Native application** that provides:
- **Intuitive Mining Interface**: One-tap resource contribution
- **Social Identity System**: @handle creation and Profile NFTs
- **Guild Coordination**: Team mining and competition
- **Gamified Experience**: Achievements, cosmetics, and progression
- **Cross-Platform Compatibility**: iOS and Android optimization

### **Core Design Principles:**
- **Mobile-First**: Optimized for touch interfaces and mobile interactions
- **Performance-Centric**: Smooth 60fps animations and instant responses
- **User-Friendly**: Complex blockchain operations made simple
- **Battery-Conscious**: Efficient background processing and power management
- **Offline-Capable**: Core functionality works without internet connection

---

## 🏗️ Architecture Overview

### **Application Structure:**

```
📱 NeoEngine App
├── 🔐 Authentication Layer
│   ├── PIN Security System
│   ├── Wallet Integration (Mobile Wallet Adapter)
│   └── Biometric Authentication (Face ID/Touch ID)
│
├── 🆔 Identity Management
│   ├── @Handle Creation & Management
│   ├── Profile NFT System
│   └── Cross-Device Synchronization
│
├── ⛏️ Mining Interface
│   ├── Resource Contribution Dashboard
│   ├── Real-Time Performance Metrics
│   ├── Device Linking (NeoChain)
│   └── Reward Tracking
│
├── 🤝 Social Features
│   ├── Guild System
│   ├── Leaderboards & Competitions
│   ├── Achievement System
│   └── Social Feed & Messaging
│
├── 🎨 Customization
│   ├── Cosmetic NFT Marketplace
│   ├── Profile Customization
│   ├── Badge Collection
│   └── Staking Interface
│
└── ⚙️ Settings & Management
    ├── Device Management
    ├── Mining Preferences
    ├── Privacy Controls
    └── Help & Support
```

---

## 📱 Screen Architecture & User Flows

### **Core Screens:**

### 1. **Authentication Screens**

**PIN Setup/Entry (screens/CreatePasscode.tsx, screens/EnterPasscode.tsx)**
```typescript
interface PasscodeScreenProps {
  mode: 'create' | 'verify' | 'reset';
  onSuccess: () => void;
  onFailed: (attempts: number) => void;
}

export const PasscodeScreen: React.FC<PasscodeScreenProps> = ({ mode, onSuccess, onFailed }) => {
  const [passcode, setPasscode] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  
  const handlePasscodeEntry = async (code: string) => {
    setPasscode(code);
    
    if (mode === 'create') {
      await storePasscodeSecurely(code);
      onSuccess();
    } else {
      const isValid = await verifyPasscode(code);
      if (isValid) {
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        onFailed(newAttempts);
      }
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <PasscodeInput
        length={6}
        onComplete={handlePasscodeEntry}
        autoFocus={true}
        secureTextEntry={mode === 'verify'}
      />
      <BiometricPrompt
        enabled={mode === 'verify'}
        onSuccess={onSuccess}
        fallbackToPasscode={true}
      />
    </SafeAreaView>
  );
};
```

**Wallet Connection (components/ConnectButton.tsx)**
```typescript
export const ConnectWalletButton: React.FC = () => {
  const { connect, connected, publicKey, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
      // Initialize user data after connection
      await initializeUserData(publicKey);
    } catch (error) {
      showErrorAlert('Failed to connect wallet', error.message);
    } finally {
      setIsConnecting(false);
    }
  };
  
  if (connected) {
    return (
      <ConnectedWalletView
        publicKey={publicKey}
        onDisconnect={disconnect}
      />
    );
  }
  
  return (
    <TouchableOpacity
      style={styles.connectButton}
      onPress={handleConnect}
      disabled={isConnecting}
    >
      <Text style={styles.connectButtonText}>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Text>
    </TouchableOpacity>
  );
};
```

### 2. **Identity Management Screens**

**Username Creation (screens/CreateUsername.tsx)**
```typescript
interface CreateUsernameScreenProps {
  onSuccess: (handle: string) => void;
}

export const CreateUsernameScreen: React.FC<CreateUsernameScreenProps> = ({ onSuccess }) => {
  const [handle, setHandle] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const { publicKey } = useWallet();
  
  const checkHandleAvailability = useMemo(
    () => debounce(async (handleToCheck: string) => {
      if (handleToCheck.length < 3) return;
      
      setIsChecking(true);
      try {
        const available = await identityContract.checkHandleAvailability(handleToCheck);
        setIsAvailable(available);
      } catch (error) {
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    }, 500),
    []
  );
  
  useEffect(() => {
    if (handle.length >= 3) {
      checkHandleAvailability(handle);
    }
  }, [handle, checkHandleAvailability]);
  
  const handleCreateIdentity = async () => {
    if (!isAvailable || !publicKey) return;
    
    try {
      await identityContract.createIdentity(handle, publicKey);
      await AsyncStorage.setItem('userHandle', handle);
      onSuccess(handle);
    } catch (error) {
      showErrorAlert('Failed to create identity', error.message);
    }
  };
  
  return (
    <KeyboardAvoidingView style={styles.container}>
      <HandleInput
        value={handle}
        onChangeText={setHandle}
        placeholder="Choose your @handle"
        autoFocus={true}
        maxLength={20}
      />
      <AvailabilityIndicator
        isChecking={isChecking}
        isAvailable={isAvailable}
        handle={handle}
      />
      <CreateIdentityButton
        onPress={handleCreateIdentity}
        disabled={!isAvailable}
        loading={isChecking}
      />
    </KeyboardAvoidingView>
  );
};
```

**Profile Creation (screens/CreateProfile.tsx)**
```typescript
interface ProfileData {
  displayName: string;
  bio: string;
  website: string;
  profileImage: ImagePickerResult | null;
  bannerImage: ImagePickerResult | null;
}

export const CreateProfileScreen: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    website: '',
    profileImage: null,
    bannerImage: null,
  });
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const { publicKey } = useWallet();
  
  const handleImageSelection = async (type: 'profile' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
      base64: true,
    });
    
    if (!result.canceled) {
      setProfileData(prev => ({
        ...prev,
        [`${type}Image`]: result.assets[0],
      }));
    }
  };
  
  const handleCreateProfile = async () => {
    if (!publicKey) return;
    
    setIsCreating(true);
    try {
      // Upload images to IPFS
      const [profileImageCID, bannerImageCID] = await Promise.all([
        profileData.profileImage ? uploadToIPFS(profileData.profileImage) : null,
        profileData.bannerImage ? uploadToIPFS(profileData.bannerImage) : null,
      ]);
      
      // Create metadata JSON
      const metadata = createProfileMetadata({
        ...profileData,
        profileImageCID,
        bannerImageCID,
      });
      
      // Upload metadata to IPFS
      const metadataCID = await uploadMetadataToIPFS(metadata);
      
      // Create Profile NFT on blockchain
      await profileContract.createProfile({
        owner: publicKey,
        metadataUri: `ipfs://${metadataCID}`,
        ...profileData,
      });
      
      // Update local storage and navigate
      await AsyncStorage.setItem('profileCreated', 'true');
      NavigationService.navigate('Home');
      
    } catch (error) {
      showErrorAlert('Failed to create profile', error.message);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <ProfileImageSelector
        image={profileData.profileImage}
        onSelect={() => handleImageSelection('profile')}
        placeholder="Add Profile Picture"
      />
      <BannerImageSelector
        image={profileData.bannerImage}
        onSelect={() => handleImageSelection('banner')}
        placeholder="Add Banner Image"
      />
      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={profileData.displayName}
        onChangeText={(text) => setProfileData(prev => ({ ...prev, displayName: text }))}
      />
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Bio"
        multiline={true}
        numberOfLines={4}
        value={profileData.bio}
        onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
      />
      <CreateProfileButton
        onPress={handleCreateProfile}
        disabled={!profileData.displayName || isCreating}
        loading={isCreating}
      />
    </ScrollView>
  );
};
```

### 3. **Mining Interface Screens**

**Connect Page (screens/Connect.tsx) - Main Mining Dashboard**
```typescript
interface MiningStats {
  totalEarned: number;
  todayEarned: number;
  miningPower: number;
  devicesConnected: number;
  currentStatus: 'idle' | 'mining' | 'optimizing';
}

export const ConnectScreen: React.FC = () => {
  const [isMining, setIsMining] = useState<boolean>(false);
  const [miningStats, setMiningStats] = useState<MiningStats | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const { publicKey } = useWallet();
  
  const toggleMining = async () => {
    if (!publicKey) return;
    
    try {
      if (isMining) {
        await stopMining();
        setIsMining(false);
      } else {
        await startMining();
        setIsMining(true);
      }
    } catch (error) {
      showErrorAlert('Mining Error', error.message);
    }
  };
  
  const startMining = async () => {
    // Get device specifications
    const deviceSpecs = await getDeviceSpecs();
    
    // Start CPU mining
    await cpuMiningContract.startMiningSession(deviceSpecs);
    
    // Start GPU mining if available
    if (deviceSpecs.hasGPU) {
      await gpuMiningContract.contributeGPU(deviceSpecs.gpuSpecs);
    }
    
    // Start other resource contributions
    await Promise.all([
      ramSharingContract.contributeRAM(deviceSpecs.availableRAM),
      storageSharingContract.contributeStorage(deviceSpecs.availableStorage),
      bandwidthSharingContract.contributeBandwidth(deviceSpecs.networkSpecs),
    ]);
  };
  
  const stopMining = async () => {
    // Stop all mining activities
    await Promise.all([
      cpuMiningContract.stopMiningSession(),
      gpuMiningContract.stopGPUContribution(),
      ramSharingContract.stopRAMSharing(),
      storageSharingContract.stopStorageSharing(),
      bandwidthSharingContract.stopBandwidthSharing(),
    ]);
  };
  
  // Real-time stats updates
  useEffect(() => {
    if (!isMining) return;
    
    const interval = setInterval(async () => {
      try {
        const stats = await getMiningStats(publicKey);
        setMiningStats(stats);
      } catch (error) {
        console.error('Failed to fetch mining stats:', error);
      }
    }, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [isMining, publicKey]);
  
  return (
    <SafeAreaView style={styles.container}>
      <MiningStatusHeader
        isMining={isMining}
        stats={miningStats}
      />
      
      <MiningToggleButton
        isMining={isMining}
        onToggle={toggleMining}
        disabled={!publicKey}
      />
      
      <ResourceContributionPanel
        cpuContribution={miningStats?.cpuContribution}
        gpuContribution={miningStats?.gpuContribution}
        ramContribution={miningStats?.ramContribution}
        storageContribution={miningStats?.storageContribution}
        bandwidthContribution={miningStats?.bandwidthContribution}
      />
      
      <DeviceManagementPanel
        connectedDevices={connectedDevices}
        onAddDevice={() => NavigationService.navigate('LinkDevice')}
        onDeviceSettings={(device) => NavigationService.navigate('DeviceSettings', { device })}
      />
      
      <RecentEarningsPanel
        recentEarnings={miningStats?.recentEarnings}
        onViewAll={() => NavigationService.navigate('EarningsHistory')}
      />
    </SafeAreaView>
  );
};
```

**Device Linking Interface**
```typescript
export const LinkDeviceScreen: React.FC = () => {
  const [qrData, setQrData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [linkedDevices, setLinkedDevices] = useState<Device[]>([]);
  
  const generatePairingQR = async () => {
    try {
      const pairingToken = await deviceLinkingContract.initiatePairing(
        await getDeviceInfo()
      );
      setQrData(JSON.stringify({
        token: pairingToken,
        deviceId: await getDeviceId(),
        expires: Date.now() + 300000, // 5 minutes
      }));
    } catch (error) {
      showErrorAlert('Failed to generate pairing code', error.message);
    }
  };
  
  const handleQRScan = async (data: string) => {
    try {
      const pairingData = JSON.parse(data);
      
      // Verify pairing token hasn't expired
      if (Date.now() > pairingData.expires) {
        throw new Error('Pairing code has expired');
      }
      
      // Complete device pairing
      await deviceLinkingContract.completePairing(pairingData.token);
      
      // Refresh linked devices list
      const updatedDevices = await deviceLinkingContract.getLinkedDevices();
      setLinkedDevices(updatedDevices);
      
      setIsScanning(false);
      showSuccessAlert('Device paired successfully!');
      
    } catch (error) {
      showErrorAlert('Pairing failed', error.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <Tabs>
        <Tab title="Generate QR">
          <QRCodeGenerator
            value={qrData}
            size={200}
            onGenerate={generatePairingQR}
          />
          <Text style={styles.instructionText}>
            Show this QR code to the device you want to link
          </Text>
        </Tab>
        
        <Tab title="Scan QR">
          <QRCodeScanner
            onRead={handleQRScan}
            active={isScanning}
            showMarker={true}
            markerStyle={styles.qrMarker}
          />
          <Button
            title={isScanning ? "Stop Scanning" : "Start Scanning"}
            onPress={() => setIsScanning(!isScanning)}
          />
        </Tab>
      </Tabs>
      
      <LinkedDevicesList
        devices={linkedDevices}
        onDeviceRemove={(device) => handleDeviceRemoval(device)}
        onDeviceSettings={(device) => NavigationService.navigate('DeviceSettings', { device })}
      />
    </View>
  );
};
```

### 4. **Social Features Screens**

**Guild Management (screens/Guild.tsx)**
```typescript
interface Guild {
  id: string;
  name: string;
  memberCount: number;
  totalMiningPower: number;
  rank: number;
  isOwner: boolean;
  isMember: boolean;
}

export const GuildScreen: React.FC = () => {
  const [userGuild, setUserGuild] = useState<Guild | null>(null);
  const [availableGuilds, setAvailableGuilds] = useState<Guild[]>([]);
  const [isCreatingGuild, setIsCreatingGuild] = useState<boolean>(false);
  const { publicKey } = useWallet();
  
  const handleCreateGuild = async (guildData: CreateGuildRequest) => {
    if (!publicKey) return;
    
    setIsCreatingGuild(true);
    try {
      const guild = await guildContract.createGuild({
        name: guildData.name,
        description: guildData.description,
        isPublic: guildData.isPublic,
        founder: publicKey,
        initialStake: guildData.stakeAmount,
      });
      
      setUserGuild(guild);
      NavigationService.goBack();
      
    } catch (error) {
      showErrorAlert('Failed to create guild', error.message);
    } finally {
      setIsCreatingGuild(false);
    }
  };
  
  const handleJoinGuild = async (guildId: string) => {
    try {
      await guildContract.joinGuild(guildId, publicKey);
      const updatedGuild = await guildContract.getGuild(guildId);
      setUserGuild(updatedGuild);
    } catch (error) {
      showErrorAlert('Failed to join guild', error.message);
    }
  };
  
  if (userGuild) {
    return (
      <GuildDashboard
        guild={userGuild}
        onLeaveGuild={() => handleLeaveGuild(userGuild.id)}
        onInviteMembers={() => NavigationService.navigate('InviteMembers', { guild: userGuild })}
        onViewLeaderboard={() => NavigationService.navigate('GuildLeaderboard')}
      />
    );
  }
  
  return (
    <View style={styles.container}>
      <CreateGuildSection
        onCreateGuild={() => NavigationService.navigate('CreateGuild')}
        isCreating={isCreatingGuild}
      />
      
      <AvailableGuildsList
        guilds={availableGuilds}
        onJoinGuild={handleJoinGuild}
        onViewDetails={(guild) => NavigationService.navigate('GuildDetails', { guild })}
      />
      
      <GuildLeaderboard
        topGuilds={availableGuilds.slice(0, 10)}
        onViewAll={() => NavigationService.navigate('FullLeaderboard')}
      />
    </View>
  );
};
```

### 5. **Profile & Customization Screens**

**Profile Display (screens/Profile.tsx)**
```typescript
export const ProfileScreen: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [equippedCosmetics, setEquippedCosmetics] = useState<CosmeticNFT[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profile = await profileContract.getUserProfile(publicKey);
        const cosmetics = await cosmeticContract.getEquippedCosmetics(profile.mint);
        const userAchievements = await achievementContract.getUserAchievements(publicKey);
        
        setUserProfile(profile);
        setEquippedCosmetics(cosmetics);
        setAchievements(userAchievements);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };
    
    loadProfileData();
  }, [publicKey]);
  
  const handleEquipCosmetic = async (cosmetic: CosmeticNFT) => {
    try {
      await cosmeticContract.equipCosmetic(cosmetic.mint, userProfile.mint);
      
      // Update local state
      setEquippedCosmetics(prev => [...prev, cosmetic]);
      showSuccessAlert('Cosmetic equipped successfully!');
      
    } catch (error) {
      showErrorAlert('Failed to equip cosmetic', error.message);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <ProfileHeader
        profile={userProfile}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
      />
      
      <CosmeticDisplay
        equippedCosmetics={equippedCosmetics}
        onUnequipCosmetic={(cosmetic) => handleUnequipCosmetic(cosmetic)}
        onOpenInventory={() => NavigationService.navigate('CosmeticInventory')}
      />
      
      <AchievementBadges
        achievements={achievements}
        onViewAll={() => NavigationService.navigate('Achievements')}
      />
      
      <MiningStats
        totalEarned={userProfile?.totalDSXEarned}
        currentRank={userProfile?.rank}
        miningHistory={userProfile?.miningHistory}
      />
      
      <SocialStats
        followers={userProfile?.followers}
        following={userProfile?.following}
        guildMembership={userProfile?.guild}
      />
    </ScrollView>
  );
};
```

---

## 🎨 Component Library

### **Reusable UI Components:**

**Mining Toggle Button**
```typescript
interface MiningToggleButtonProps {
  isMining: boolean;
  onToggle: () => void;
  disabled?: boolean;
  miningPower?: number;
}

export const MiningToggleButton: React.FC<MiningToggleButtonProps> = ({
  isMining,
  onToggle,
  disabled = false,
  miningPower = 0,
}) => {
  const animatedScale = useSharedValue(1);
  const animatedRotation = useSharedValue(0);
  
  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate button press
    animatedScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    onToggle();
  };
  
  // Rotating animation when mining
  useEffect(() => {
    if (isMining) {
      animatedRotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1
      );
    } else {
      animatedRotation.value = withTiming(0, { duration: 300 });
    }
  }, [isMining]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: animatedScale.value },
      { rotate: `${animatedRotation.value}deg` },
    ],
  }));
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.toggleButton, isMining && styles.miningActive]}
    >
      <Animated.View style={[styles.buttonContent, animatedStyle]}>
        <NeoEngineIcon
          name={isMining ? "mining-active" : "mining-idle"}
          size={48}
          color={isMining ? Colors.primaryAccent : Colors.textSecondary}
        />
        <Text style={[styles.buttonText, isMining && styles.miningText]}>
          {isMining ? 'Mining Active' : 'Start Mining'}
        </Text>
        {isMining && miningPower > 0 && (
          <Text style={styles.miningPowerText}>
            {formatMiningPower(miningPower)} H/s
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};
```

**Resource Contribution Panel**
```typescript
interface ResourcePanelProps {
  cpuContribution?: number;
  gpuContribution?: number;
  ramContribution?: number;
  storageContribution?: number;
  bandwidthContribution?: number;
}

export const ResourceContributionPanel: React.FC<ResourcePanelProps> = ({
  cpuContribution = 0,
  gpuContribution = 0,
  ramContribution = 0,
  storageContribution = 0,
  bandwidthContribution = 0,
}) => {
  const resources = [
    {
      type: 'CPU',
      icon: 'cpu',
      value: cpuContribution,
      unit: 'cores',
      color: Colors.cpuColor,
    },
    {
      type: 'GPU',
      icon: 'gpu',
      value: gpuContribution,
      unit: 'GB VRAM',
      color: Colors.gpuColor,
    },
    {
      type: 'RAM',
      icon: 'memory',
      value: ramContribution,
      unit: 'GB',
      color: Colors.ramColor,
    },
    {
      type: 'Storage',
      icon: 'storage',
      value: storageContribution,
      unit: 'GB',
      color: Colors.storageColor,
    },
    {
      type: 'Bandwidth',
      icon: 'network',
      value: bandwidthContribution,
      unit: 'Mbps',
      color: Colors.bandwidthColor,
    },
  ];
  
  return (
    <View style={styles.resourcePanel}>
      <Text style={styles.panelTitle}>Resource Contribution</Text>
      <View style={styles.resourceGrid}>
        {resources.map((resource) => (
          <ResourceItem
            key={resource.type}
            type={resource.type}
            icon={resource.icon}
            value={resource.value}
            unit={resource.unit}
            color={resource.color}
            isActive={resource.value > 0}
          />
        ))}
      </View>
    </View>
  );
};

const ResourceItem: React.FC<ResourceItemProps> = ({
  type,
  icon,
  value,
  unit,
  color,
  isActive,
}) => {
  const animatedOpacity = useSharedValue(isActive ? 1 : 0.5);
  const animatedBorderColor = useSharedValue(isActive ? color : Colors.border);
  
  useEffect(() => {
    animatedOpacity.value = withTiming(isActive ? 1 : 0.5, { duration: 300 });
    animatedBorderColor.value = withTiming(
      isActive ? color : Colors.border,
      { duration: 300 }
    );
  }, [isActive]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
    borderColor: animatedBorderColor.value,
  }));
  
  return (
    <Animated.View style={[styles.resourceItem, animatedStyle]}>
      <NeoEngineIcon name={icon} size={24} color={color} />
      <Text style={styles.resourceType}>{type}</Text>
      <Text style={styles.resourceValue}>
        {formatNumber(value)} {unit}
      </Text>
    </Animated.View>
  );
};
```

### **Custom Hooks:**

**useWalletConnection Hook**
```typescript
export const useWalletConnection = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  
  const connect = async () => {
    setIsConnecting(true);
    try {
      // Use Mobile Wallet Adapter for connection
      const wallet = await MobileWalletAdapter.connect();
      setPublicKey(wallet.publicKey);
      setConnected(true);
      
      // Store connection info
      await AsyncStorage.setItem('wallet_connected', 'true');
      await AsyncStorage.setItem('wallet_pubkey', wallet.publicKey.toString());
      
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnect = async () => {
    try {
      await MobileWalletAdapter.disconnect();
      setConnected(false);
      setPublicKey(null);
      
      // Clear stored connection info
      await AsyncStorage.removeItem('wallet_connected');
      await AsyncStorage.removeItem('wallet_pubkey');
      
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };
  
  // Auto-reconnect on app start
  useEffect(() => {
    const autoReconnect = async () => {
      try {
        const wasConnected = await AsyncStorage.getItem('wallet_connected');
        const storedPubkey = await AsyncStorage.getItem('wallet_pubkey');
        
        if (wasConnected === 'true' && storedPubkey) {
          const pubkey = new PublicKey(storedPubkey);
          setPublicKey(pubkey);
          setConnected(true);
        }
      } catch (error) {
        console.error('Auto-reconnect failed:', error);
      }
    };
    
    autoReconnect();
  }, []);
  
  return {
    connected,
    publicKey,
    isConnecting,
    connect,
    disconnect,
  };
};
```

**useMiningStats Hook**
```typescript
interface MiningStats {
  isActive: boolean;
  totalEarned: number;
  todayEarned: number;
  miningPower: number;
  efficiency: number;
  devicesActive: number;
}

export const useMiningStats = (publicKey: PublicKey | null) => {
  const [stats, setStats] = useState<MiningStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchStats = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch stats from all mining contracts
      const [cpuStats, gpuStats, socialStats, rewardStats] = await Promise.all([
        cpuMiningContract.getUserStats(publicKey),
        gpuMiningContract.getUserStats(publicKey),
        socialContract.getUserStats(publicKey),
        rewardsContract.getUserRewards(publicKey),
      ]);
      
      // Aggregate stats
      const aggregatedStats: MiningStats = {
        isActive: cpuStats.isActive || gpuStats.isActive,
        totalEarned: rewardStats.totalLifetimeEarned,
        todayEarned: rewardStats.todayEarned,
        miningPower: cpuStats.hashrate + gpuStats.computePower,
        efficiency: calculateEfficiency(cpuStats, gpuStats),
        devicesActive: cpuStats.activeDevices + gpuStats.activeDevices,
      };
      
      setStats(aggregatedStats);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);
  
  // Real-time updates
  useEffect(() => {
    if (!publicKey) return;
    
    fetchStats();
    
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [publicKey, fetchStats]);
  
  return {
    stats,
    isLoading,
    error,
    refreshStats: fetchStats,
  };
};
```

---

## 🔄 State Management

### **Context Providers:**

**Global App Context**
```typescript
interface AppContextType {
  user: UserProfile | null;
  miningStatus: MiningStatus;
  connectedDevices: Device[];
  notifications: Notification[];
  settings: AppSettings;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [miningStatus, setMiningStatus] = useState<MiningStatus>('idle');
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Load initial app data
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_profile');
        const storedSettings = await AsyncStorage.getItem('app_settings');
        const storedDevices = await AsyncStorage.getItem('connected_devices');
        
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedSettings) setSettings(JSON.parse(storedSettings));
        if (storedDevices) setConnectedDevices(JSON.parse(storedDevices));
        
      } catch (error) {
        console.error('Failed to load app data:', error);
      }
    };
    
    loadAppData();
  }, []);
  
  // Auto-save data changes
  useEffect(() => {
    AsyncStorage.setItem('user_profile', JSON.stringify(user));
  }, [user]);
  
  useEffect(() => {
    AsyncStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);
  
  const contextValue: AppContextType = {
    user,
    miningStatus,
    connectedDevices,
    notifications,
    settings,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

---

## 🔔 Background Processing & Notifications

### **Background Mining Service:**

```typescript
// services/BackgroundMiningService.ts
class BackgroundMiningService {
  private static instance: BackgroundMiningService;
  private miningInterval: NodeJS.Timeout | null = null;
  
  public static getInstance(): BackgroundMiningService {
    if (!BackgroundMiningService.instance) {
      BackgroundMiningService.instance = new BackgroundMiningService();
    }
    return BackgroundMiningService.instance;
  }
  
  public async startBackgroundMining(): Promise<void> {
    // Register background task
    const taskId = await BackgroundTask.start({
      taskName: 'NeoEngine Mining',
      taskDescription: 'Mining $DSX tokens in the background',
    });
    
    // Start mining loop
    this.miningInterval = setInterval(async () => {
      try {
        await this.performMiningCycle();
      } catch (error) {
        console.error('Background mining error:', error);
      }
    }, 60000); // Every 60 seconds
    
    // Schedule local notification for mining updates
    await this.schedulePeriodicNotifications();
  }
  
  public async stopBackgroundMining(): Promise<void> {
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
    
    await BackgroundTask.stop();
    await this.cancelScheduledNotifications();
  }
  
  private async performMiningCycle(): Promise<void> {
    // Check if device is charging or has sufficient battery
    const batteryState = await Battery.getBatteryStateAsync();
    if (batteryState.batteryLevel < 0.2 && !batteryState.isCharging) {
      return; // Skip mining to preserve battery
    }
    
    // Perform lightweight mining operations
    const deviceSpecs = await getDeviceSpecs();
    const miningResult = await cpuMiningContract.submitBackgroundProof(deviceSpecs);
    
    if (miningResult.rewardsEarned > 0) {
      // Show notification for earned rewards
      await this.showRewardNotification(miningResult.rewardsEarned);
    }
  }
  
  private async showRewardNotification(amount: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Mining Reward Earned!',
        body: `You earned ${formatNumber(amount)} $DSX tokens`,
        data: { type: 'mining_reward', amount },
      },
      trigger: null, // Show immediately
    });
  }
}
```

### **Push Notification Handler:**

```typescript
// services/NotificationService.ts
export class NotificationService {
  public static async initialize(): Promise<void> {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Notification permissions not granted');
    }
    
    // Configure notification channels (Android)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('mining', {
        name: 'Mining Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      
      await Notifications.setNotificationChannelAsync('social', {
        name: 'Social Activity',
        importance: Notifications.AndroidImportance.LOW,
      });
    }
    
    // Set up notification handlers
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    
    // Handle notification responses
    Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationResponse(response);
    });
  }
  
  private static handleNotificationResponse(response: NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    switch (data.type) {
      case 'mining_reward':
        NavigationService.navigate('Earnings', { highlightRecent: true });
        break;
      case 'guild_invitation':
        NavigationService.navigate('Guild', { guildId: data.guildId });
        break;
      case 'achievement_unlocked':
        NavigationService.navigate('Achievements', { highlightId: data.achievementId });
        break;
      default:
        NavigationService.navigate('Home');
    }
  }
  
  public static async scheduleAchievementNotification(
    achievementId: string,
    achievementName: string
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Achievement Unlocked!',
        body: `You earned the "${achievementName}" badge`,
        data: { type: 'achievement_unlocked', achievementId },
      },
      trigger: null,
    });
  }
}
```

---

## 🎨 Design System & Styling

### **Color Palette:**

```typescript
// constants/Colors.ts
export const Colors = {
  // Primary Brand Colors
  primary: '#00D4FF',           // NeoEngine Blue
  primaryDark: '#0099CC',       // Darker blue for dark mode
  primaryAccent: '#00FFB7',     // Neon green accent
  
  // Mining Resource Colors
  cpuColor: '#FF6B6B',          // Red for CPU
  gpuColor: '#4ECDC4',          // Teal for GPU
  ramColor: '#45B7D1',          // Blue for RAM
  storageColor: '#96CEB4',      // Green for Storage
  bandwidthColor: '#FFEAA7',    // Yellow for Bandwidth
  
  // UI Colors
  background: '#0A0E1B',        // Dark background
  backgroundSecondary: '#1A1F2E', // Lighter dark background
  surface: '#242B3D',           // Card/surface color
  border: '#3A4A5C',            // Border color
  
  // Text Colors
  textPrimary: '#FFFFFF',       // Primary text
  textSecondary: '#B8C5D1',     // Secondary text
  textMuted: '#7A8A9A',         // Muted text
  
  // Status Colors
  success: '#00FF88',           // Success green
  warning: '#FFD93D',           // Warning yellow
  error: '#FF6B93',             // Error red
  info: '#00D4FF',              // Info blue
  
  // Social Colors
  guildColor: '#9B59B6',        // Purple for guilds
  achievementColor: '#F39C12',  // Orange for achievements
  rewardColor: '#27AE60',       // Green for rewards
};
```

### **Typography:**

```typescript
// constants/Typography.ts
export const Typography = {
  // Font Families
  fontFamily: {
    primary: 'Gravix-Regular',      // Custom NeoEngine font
    secondary: 'System',            // System font fallback
    monospace: 'SF Mono',           // For numbers and addresses
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};
```

### **Component Styles:**

```typescript
// styles/components.ts
export const ComponentStyles = StyleSheet.create({
  // Button Styles
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  primaryButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
  },
  
  // Card Styles
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Mining Toggle Button
  miningToggle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  
  miningToggleActive: {
    borderColor: Colors.primaryAccent,
    backgroundColor: Colors.primary + '20',
    shadowColor: Colors.primaryAccent,
    shadowOpacity: 0.5,
  },
});
```

---

## 📱 Platform-Specific Optimizations

### **iOS Optimizations:**

```typescript
// ios/NeoEngine/AppDelegate.mm
#import "AppDelegate.h"
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Enable background app refresh for mining
  [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:UIApplicationBackgroundFetchIntervalMinimum];
  
  // Configure background processing
  [self configureBackgroundProcessing];
  
  // Initialize React Native bridge
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"NeoEngine" initialProperties:nil];
  
  return YES;
}

- (void)configureBackgroundProcessing {
  // Register background task identifiers
  [[BGTaskScheduler sharedScheduler] registerForTaskWithIdentifier:@"com.neoengine.mining"
                                                        usingQueue:nil
                                                     launchHandler:^(__kindof BGTask * _Nonnull task) {
    [self handleMiningBackgroundTask:task];
  }];
}

@end
```

### **Android Optimizations:**

```kotlin
// android/app/src/main/java/com/neoengine/MiningForegroundService.kt
class MiningForegroundService : Service() {
    companion object {
        const val CHANNEL_ID = "NeoEngine_Mining"
        const val NOTIFICATION_ID = 1
    }
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        
        // Start mining in background thread
        Thread {
            performBackgroundMining()
        }.start()
        
        return START_STICKY // Restart service if killed
    }
    
    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "NeoEngine Mining",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Background mining service"
            setShowBadge(false)
        }
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }
    
    private fun performBackgroundMining() {
        // Background mining logic
        while (true) {
            try {
                // Perform mining calculations
                val result = NeoHashCalculator.calculateHash()
                
                // Submit to blockchain if valid
                if (result.isValid) {
                    SubmitProofTask().execute(result)
                }
                
                Thread.sleep(60000) // 60 second intervals
                
            } catch (e: Exception) {
                Log.e("MiningService", "Mining error", e)
                break
            }
        }
    }
}
```

---

## 🔧 Performance Optimization

### **Memory Management:**

```typescript
// utils/MemoryManager.ts
export class MemoryManager {
  private static imageCache = new Map<string, string>();
  private static profileCache = new Map<string, UserProfile>();
  
  public static async cacheProfileImage(profileId: string, imageUri: string): Promise<void> {
    // Compress image before caching
    const compressedUri = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 300, height: 300 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    this.imageCache.set(profileId, compressedUri.uri);
    
    // Limit cache size to prevent memory issues
    if (this.imageCache.size > 50) {
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
  }
  
  public static getCachedProfileImage(profileId: string): string | null {
    return this.imageCache.get(profileId) || null;
  }
  
  public static clearCache(): void {
    this.imageCache.clear();
    this.profileCache.clear();
  }
}
```

### **Battery Optimization:**

```typescript
// utils/BatteryManager.ts
export class BatteryManager {
  public static async shouldAllowMining(): Promise<boolean> {
    const batteryState = await Battery.getBatteryStateAsync();
    
    // Don't mine if battery is critically low
    if (batteryState.batteryLevel < 0.15) {
      return false;
    }
    
    // Reduce mining intensity if not charging and battery < 50%
    if (!batteryState.isCharging && batteryState.batteryLevel < 0.5) {
      return false;
    }
    
    // Check if device is overheating (iOS only)
    if (Platform.OS === 'ios') {
      const thermalState = await getThermalState();
      if (thermalState === 'critical' || thermalState === 'serious') {
        return false;
      }
    }
    
    return true;
  }
  
  public static async optimizeMiningForBattery(): Promise<MiningConfig> {
    const batteryState = await Battery.getBatteryStateAsync();
    
    if (batteryState.isCharging) {
      return {
        intensity: 'high',
        interval: 60000,      // 1 minute
        resources: ['cpu', 'gpu', 'ram', 'storage', 'bandwidth'],
      };
    } else if (batteryState.batteryLevel > 0.5) {
      return {
        intensity: 'medium',
        interval: 120000,     // 2 minutes
        resources: ['cpu', 'ram', 'bandwidth'],
      };
    } else {
      return {
        intensity: 'low',
        interval: 300000,     // 5 minutes
        resources: ['cpu'],
      };
    }
  }
}
```

---

## 🧪 Testing Strategy

### **Unit Tests:**

```typescript
// __tests__/components/MiningToggleButton.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MiningToggleButton } from '../../components/MiningToggleButton';

describe('MiningToggleButton', () => {
  it('should render correctly when not mining', () => {
    const { getByText } = render(
      <MiningToggleButton
        isMining={false}
        onToggle={jest.fn()}
      />
    );
    
    expect(getByText('Start Mining')).toBeTruthy();
  });
  
  it('should call onToggle when pressed', async () => {
    const mockToggle = jest.fn();
    const { getByRole } = render(
      <MiningToggleButton
        isMining={false}
        onToggle={mockToggle}
      />
    );
    
    fireEvent.press(getByRole('button'));
    
    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });
  
  it('should show mining power when active', () => {
    const { getByText } = render(
      <MiningToggleButton
        isMining={true}
        onToggle={jest.fn()}
        miningPower={1500}
      />
    );
    
    expect(getByText('1.5K H/s')).toBeTruthy();
  });
});
```

### **Integration Tests:**

```typescript
// __tests__/flows/MiningFlow.test.tsx
import { renderApp, navigateToScreen, mockWalletConnection } from '../utils/testUtils';

describe('Mining Flow Integration', () => {
  beforeEach(() => {
    mockWalletConnection();
  });
  
  it('should complete full mining flow', async () => {
    const app = renderApp();
    
    // Navigate to Connect screen
    await navigateToScreen(app, 'Connect');
    
    // Start mining
    const miningButton = await app.findByText('Start Mining');
    fireEvent.press(miningButton);
    
    // Verify mining started
    await waitFor(() => {
      expect(app.getByText('Mining Active')).toBeTruthy();
    });
    
    // Check that mining stats update
    await waitFor(
      () => {
        expect(app.queryByText(/H\/s/)).toBeTruthy();
      },
      { timeout: 10000 }
    );
  });
  
  it('should handle mining errors gracefully', async () => {
    // Mock network error
    mockNetworkError();
    
    const app = renderApp();
    await navigateToScreen(app, 'Connect');
    
    const miningButton = await app.findByText('Start Mining');
    fireEvent.press(miningButton);
    
    // Should show error message
    await waitFor(() => {
      expect(app.getByText(/Failed to start mining/)).toBeTruthy();
    });
  });
});
```

---

## 📈 Analytics & Monitoring

### **User Analytics:**

```typescript
// services/AnalyticsService.ts
export class AnalyticsService {
  public static async trackScreenView(screenName: string): Promise<void> {
    try {
      await Analytics.logEvent('screen_view', {
        screen_name: screenName,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }
  
  public static async trackMiningEvent(eventType: string, data?: any): Promise<void> {
    await Analytics.logEvent('mining_event', {
      event_type: eventType,
      ...data,
      timestamp: Date.now(),
    });
  }
  
  public static async trackUserAction(action: string, context?: any): Promise<void> {
    await Analytics.logEvent('user_action', {
      action,
      context: JSON.stringify(context),
      timestamp: Date.now(),
    });
  }
}
```

### **Performance Monitoring:**

```typescript
// services/PerformanceMonitor.ts
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  
  public static startTimer(operationName: string): void {
    this.metrics.set(operationName, Date.now());
  }
  
  public static endTimer(operationName: string): number {
    const startTime = this.metrics.get(operationName);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    this.metrics.delete(operationName);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operationName} took ${duration}ms`);
      AnalyticsService.trackEvent('performance_warning', {
        operation: operationName,
        duration,
      });
    }
    
    return duration;
  }
  
  public static async measureAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.startTimer(operationName);
    try {
      const result = await operation();
      this.endTimer(operationName);
      return result;
    } catch (error) {
      this.endTimer(operationName);
      throw error;
    }
  }
}
```

---

**🎯 Result: A comprehensive, performant, and user-friendly React Native application that makes complex blockchain mining operations accessible to everyday mobile users, while providing a gamified social experience that encourages long-term engagement and community building.**