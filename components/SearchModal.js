import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { getCategories } from '../services/api';
import Colors from '../constants/colors';

export default function SearchModal({ visible, onClose, onSearch, initialQuery = '', initialCategory = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (visible) fetchCategories();
  }, [visible]);

  useEffect(() => {
    setQuery(initialQuery);
    setSelectedCategory(initialCategory);
  }, [initialQuery, initialCategory]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.warn('[SearchModal] categories fetch failed:', err.message);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSearch = () => {
    onSearch({ query: query.trim(), category: selectedCategory });
    onClose();
  };

  const handleClear = () => {
    setQuery('');
    setSelectedCategory('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <Text style={styles.title}>What are you looking for?</Text>
          <Text style={styles.subtitle}>Search products from multiple platforms</Text>
        </View>

        {/* Search Input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Keyword</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. vintage camera, sneakers, sofa…"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Category picker */}
        <View style={styles.categorySection}>
          <Text style={styles.label}>Category</Text>
          {loadingCategories ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
          ) : (
            <FlatList
              data={[{ value: '', label: 'All' }, ...categories.map((c) => ({ value: c, label: formatLabel(c) }))]}
              keyExtractor={(item) => item.value || '__all__'}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catList}
              renderItem={({ item }) => {
                const active = item.value === selectedCategory;
                return (
                  <Pressable
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => setSelectedCategory(item.value)}
                  >
                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleClear}>
            <Text style={styles.btnSecondaryText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSearch}>
            <Text style={styles.btnPrimaryText}>Search</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function formatLabel(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  categorySection: {
    flex: 1,
  },
  catList: {
    paddingVertical: 4,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: Colors.textInverse,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  btnPrimary: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});
