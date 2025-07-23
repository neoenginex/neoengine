# 🤝 Contributing to NeoEngine

Thank you for your interest in contributing to NeoEngine! This guide will help you get started with contributing to our decentralized social identity platform.

## 📋 Quick Start

1. **Fork the repository** and clone your fork
2. **Follow the setup guide** in [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)
3. **Create a feature branch** for your changes
4. **Make your changes** and test thoroughly
5. **Submit a pull request** with a clear description

## 🏗️ Project Structure

```
neoengine/
├── programs/              # Solana smart contracts
│   ├── neoengine-identity/    # SBT handle system
│   ├── neoengine-profile/     # Profile NFT contract
│   ├── neoengine-cosmetics/   # Cosmetic NFT system
│   └── dsx-scoring/           # Social mining rewards
├── screens/              # React Native screens
├── components/           # Reusable React components
├── utils/               # Utility functions
├── assets/              # Images, fonts, etc.
└── tests/               # Test files
```

## 🛠️ Development Guidelines

### **Smart Contract Development**

- **Language**: Rust with Anchor framework
- **Testing**: Write comprehensive tests for all functions
- **Security**: Follow Solana security best practices
- **Documentation**: Document all public functions

```rust
// Example: Good function documentation
/// Creates a new Profile NFT linked to an SBT handle
/// 
/// # Arguments
/// * `profile_data` - The profile information to store
/// 
/// # Errors
/// * `ProfileError::DisplayNameTooLong` - If display name exceeds 32 chars
/// * `ProfileError::InvalidSbtOwner` - If SBT handle doesn't belong to user
pub fn create_profile_nft(
    ctx: Context<CreateProfileNft>,
    profile_data: ProfileData,
) -> Result<()> {
    // Implementation...
}
```

### **Mobile App Development**

- **Language**: TypeScript with React Native
- **Styling**: Use the existing color scheme in `components/Colors.tsx`
- **Navigation**: Follow the existing navigation patterns
- **Testing**: Test on both iOS and Android

```typescript
// Example: Good component structure
interface ProfileCardProps {
  profile: ProfileData;
  onPress?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onPress 
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      {/* Component implementation */}
    </TouchableOpacity>
  );
};
```

### **Code Style**

- **Rust**: Follow `rustfmt` formatting
- **TypeScript**: Use 2-space indentation
- **Naming**: Use descriptive variable and function names
- **Comments**: Explain the "why", not the "what"

## 🧪 Testing

### **Smart Contract Tests**

```bash
# Run all contract tests
anchor test

# Run specific test file
anchor test tests/profile-nft.ts

# Run tests with logs
anchor test --skip-deploy
```

### **Mobile App Tests**

```bash
# Run JavaScript tests
npm test

# Run tests in watch mode
npm test -- --watch

# Test on specific platform
npm run ios
npm run android
```

### **Integration Tests**

Before submitting, test the complete flow:
1. Connect wallet
2. Create SBT handle
3. Create Profile NFT
4. Mint cosmetic
5. Equip/unequip cosmetic
6. Claim DSX rewards

## 📝 Pull Request Process

### **1. Branch Naming**

Use descriptive branch names:
- `feature/cosmetic-trading-ui`
- `fix/profile-image-upload`
- `docs/update-deployment-guide`
- `refactor/simplify-wallet-connection`

### **2. Commit Messages**

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(cosmetics): add rarity-based cosmetic filtering

fix(profile): resolve IPFS image loading timeout

docs(readme): update smart contract deployment guide

refactor(scoring): simplify DSX reward calculation
```

### **3. Pull Request Template**

```markdown
## 📝 Description
Brief description of the changes made.

## 🎯 Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## 🧪 Testing
- [ ] I have tested these changes locally
- [ ] All existing tests pass
- [ ] I have added new tests for my changes (if applicable)

## 📱 Platform Testing
- [ ] iOS tested
- [ ] Android tested
- [ ] Smart contracts tested on devnet

## 📋 Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have added documentation for my changes (if applicable)
```

## 🔍 Code Review Process

### **What We Look For**

1. **Functionality**: Does the code work as intended?
2. **Security**: Are there any security vulnerabilities?
3. **Performance**: Is the code efficient?
4. **Maintainability**: Is the code readable and well-structured?
5. **Testing**: Are there adequate tests?

### **Review Timeline**

- **Initial Response**: Within 24 hours
- **Full Review**: Within 3-5 business days
- **Follow-up Reviews**: Within 24 hours of updates

## 🏷️ Issue Guidelines

### **Bug Reports**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment**
- Device: [e.g. iPhone 12, Pixel 5]
- OS: [e.g. iOS 15.0, Android 12]
- App Version: [e.g. 1.0.0]
- Solana Cluster: [e.g. devnet, mainnet]

**Additional context**
Add any other context about the problem here.
```

### **Feature Requests**

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## 🎯 Priority Areas

We're actively looking for contributions in these areas:

### **High Priority**
- Smart contract security audits
- Mobile app performance optimization  
- UI/UX improvements
- Cross-platform testing

### **Medium Priority**
- Additional cosmetic types
- Social features implementation
- Analytics integration
- Documentation improvements

### **Low Priority**
- Code refactoring
- Additional test coverage
- Build process optimization

## 🌟 Recognition

Contributors will be recognized through:

- **README Credits**: Listed in the main README
- **Discord Role**: Special contributor role in our Discord
- **NFT Rewards**: Exclusive contributor cosmetic NFTs
- **Beta Access**: Early access to new features

## 📚 Resources

### **Learning Resources**
- [Solana Development](https://docs.solana.com/)
- [Anchor Framework](https://anchor-lang.com/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)

### **Tools**
- [Solana CLI](https://docs.solana.com/cli)
- [Anchor CLI](https://anchor-lang.com/docs/cli)
- [Flipper](https://fbflipper.com/) for React Native debugging

### **Community**
- **Discord**: https://discord.gg/neoengine
- **Twitter**: https://twitter.com/neoengineapp
- **GitHub Discussions**: Use for questions and ideas

## 🚫 What We Don't Accept

- **Malicious Code**: Any code that could harm users
- **Copyright Violations**: Copyrighted assets without permission
- **Spam**: Low-effort or irrelevant contributions
- **Breaking Changes**: Without proper discussion and approval

## 📄 License

By contributing to NeoEngine, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Questions?** Join our [Discord](https://discord.gg/neoengine) or open a [GitHub Discussion](https://github.com/neoengine/neoengine/discussions).

**Thank you for helping make NeoEngine better!** 🚀