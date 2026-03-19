import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { signOut } from '../../services/supabase';
import Colors from '../../constants/colors';

export default function ProfileScreen() {
  const { user, location, requestLocation, locationError, watchlist, showActionButtons, saveShowActionButtons } = useApp();
  const [signingOut, setSigningOut] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(!!location);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          setSigningOut(false);
        },
      },
    ]);
  };

  const handleLocationToggle = async (val) => {
    setLocationEnabled(val);
    if (val) await requestLocation();
  };

  const avatar = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
          <Text style={styles.email}>{user?.email ?? 'Guest'}</Text>
          <Text style={styles.memberSince}>
            Member since {new Date(user?.created_at ?? Date.now()).getFullYear()}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{watchlist.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Location-based results</Text>
              <Text style={styles.settingHint}>
                {location
                  ? `📍 ${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`
                  : locationError ?? 'Tap to enable'}
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.card}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show action buttons</Text>
              <Text style={styles.settingHint}>Display ✕ / ↩ / ♥ buttons below the card deck</Text>
            </View>
            <Switch
              value={showActionButtons}
              onValueChange={saveShowActionButtons}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.card}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App name</Text>
            <Text style={styles.infoValue}>SwipeMart</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data sources</Text>
            <Text style={styles.infoValue}>DummyJSON (dev)</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && { opacity: 0.6 }]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut
            ? <ActivityIndicator color={Colors.nope} />
            : <Text style={styles.signOutText}>Sign Out</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  email: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  memberSince: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  settingInfo: { flex: 1 },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  signOutBtn: {
    backgroundColor: Colors.nopeLight,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: Colors.nope,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.nope,
  },
});
