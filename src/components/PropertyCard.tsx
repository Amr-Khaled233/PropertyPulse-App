import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../constants/colors';

interface PropertyCardProps {
  title: string;
  location: string;
  price: string;
  roi: string;
  aiScore?: string;
  imageUrl: string;
  beds?: number;
  baths?: number;
  area?: string;
  status: string;
  isHot?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  title,
  location,
  price,
  roi,
  aiScore,
  imageUrl,
  beds,
  baths,
  area,
  status,
  isHot,
}) => {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.95}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, isHot ? styles.hotBadge : styles.roiBadge]}>
            <Text style={[styles.badgeText, isHot ? styles.hotText : styles.roiText]}>
              {isHot ? 'Hot Deal' : `${roi} ROI`}
            </Text>
          </View>
          {aiScore && (
            <View style={styles.aiBadge}>
              <MaterialIcons name="bolt" size={14} color={Colors.secondary} />
              <Text style={styles.aiScoreText}>{aiScore} AI Score</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.saveButton}>
          <MaterialIcons name="bookmark-border" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color={Colors.onSurfaceVariant} />
              <Text style={styles.location} numberOfLines={1}>{location}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Starting From</Text>
            <Text style={styles.price}>{price}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.features}>
            {beds && (
              <View style={styles.feature}>
                <MaterialIcons name="bed" size={18} color={Colors.onSurfaceVariant} />
                <Text style={styles.featureText}>{beds}</Text>
              </View>
            )}
            {baths && (
              <View style={styles.feature}>
                <MaterialIcons name="bathtub" size={18} color={Colors.onSurfaceVariant} />
                <Text style={styles.featureText}>{baths}</Text>
              </View>
            )}
            {area && (
              <View style={styles.feature}>
                <MaterialIcons name="square-foot" size={18} color={Colors.onSurfaceVariant} />
                <Text style={styles.featureText}>{area}</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, status === 'Ready to Move' ? styles.readyBadge : styles.offPlanBadge]}>
            <Text style={[styles.statusText, status === 'Ready to Move' ? styles.readyText : styles.offPlanText]}>
              {status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 240,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  roiBadge: {
    backgroundColor: Colors.secondaryContainer,
  },
  hotBadge: {
    backgroundColor: 'rgba(11, 155, 114, 0.1)',
    borderWidth: 1,
    borderColor: '#0B9B72',
  },
  badgeText: {
    fontSize: FontSizes.labelMD,
    fontWeight: '700',
  },
  roiText: {
    color: Colors.onSurface,
  },
  hotText: {
    color: '#0B9B72',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  aiScoreText: {
    fontSize: FontSizes.labelMD,
    fontWeight: '700',
    color: Colors.primary,
  },
  saveButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: FontSizes.headlineSM,
    fontWeight: '500',
    color: Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  location: {
    fontSize: FontSizes.bodySM,
    color: Colors.onSurfaceVariant,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: FontSizes.labelMD,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: FontSizes.headlineSM,
    fontWeight: '500',
    color: Colors.onSurface,
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  features: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureText: {
    fontSize: FontSizes.labelMD,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  readyBadge: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  offPlanBadge: {
    backgroundColor: Colors.tertiaryFixed,
  },
  statusText: {
    fontSize: FontSizes.labelMD,
    fontWeight: '500',
  },
  readyText: {
    color: Colors.primary,
  },
  offPlanText: {
    color: Colors.onSurface,
  },
});