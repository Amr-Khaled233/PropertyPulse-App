import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes } from '../constants/colors';
import { useAuthStore } from '../store/authStore';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = 'PropertyPulse', showBack = false, onBack }) => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleProfilePress = () => {
    if (user) {
      router.push('/profile');
    } else {
      router.push('/register');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={handleProfilePress}
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.placeholderAvatar]}>
                <MaterialIcons name="person" size={20} color={Colors.secondary} />
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.mobileMargin,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  placeholderAvatar: {
    backgroundColor: Colors.secondaryContainer + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.headlineMD,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  backButton: {
    padding: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.sm,
    borderRadius: 20,
  },
});