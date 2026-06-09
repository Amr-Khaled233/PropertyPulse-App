import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/colors';
import { useAuthStore } from '../store/authStore';


export { ProfileScreen as default } from '../app/screens/ProfileScreen';

// export default function ProfileScreen() {
//   const router = useRouter();
//   const user = useAuthStore((s) => s.user);
//   const signOut = useAuthStore((s) => s.signOut);

//   if (!user) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.content}>
//           <Text style={styles.title}>Profile</Text>
//           <View style={styles.placeholder}>
//             <MaterialIcons name="person" size={48} color={Colors.secondary} />
//             <Text style={styles.placeholderText}>You are not logged in</Text>
//             <TouchableOpacity
//               style={styles.button}
//               onPress={() => router.push('/register')}
//             >
//               <Text style={styles.buttonText}>Register</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.content}>
//         <Text style={styles.title}>Profile</Text>
//         <View style={styles.profileCard}>
//           <View style={styles.avatarPlaceholder}>
//             <MaterialIcons name="person" size={40} color={Colors.secondary} />
//           </View>
//           <Text style={styles.name}>{user.email}</Text>
//           <Text style={styles.email}>{user.email}</Text>
//         </View>
//         <TouchableOpacity
//           style={styles.signOutButton}
//           onPress={() => {
//             signOut();
//             router.push('/');
//           }}
//         >
//           <MaterialIcons name="logout" size={20} color="#fff" />
//           <Text style={styles.signOutText}>Sign Out</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.headlineLG,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  placeholderText: {
    fontSize: FontSizes.bodyMD,
    color: Colors.onSurfaceVariant,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondaryContainer + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: FontSizes.headlineMD,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  email: {
    fontSize: FontSizes.bodyMD,
    color: Colors.onSurfaceVariant,
  },
  button: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.bodyMD,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: FontSizes.bodyMD,
    fontWeight: '600',
  },
});
