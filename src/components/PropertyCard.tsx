// Property summary card — image (type-matched fallback), price, specs, location.

import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { radius, fonts, shadow } from '../theme/theme';
import { AppText } from './common/Text';
import { Badge } from './common/Badge';
import { propertyImage } from '../utils/propertyImages';
import { displayTitle } from '../utils/propertyTitle';
import { formatCompactCurrency, formatPropertySpecs } from '../utils/formatters';
import type { Property } from '../types/listing';

interface Props {
  property: Property;
  watched?: boolean;
  onToggleWatch?: (id: string) => void;
}

export function PropertyCard({ property, watched, onToggleWatch }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => router.push(`/property/${property.id}`)}
      style={({ pressed }) => [
        {
          backgroundColor: c.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: c.border,
          overflow: 'hidden',
          opacity: pressed ? 0.95 : 1,
        },
        shadow.soft,
      ]}
    >
      <View style={{ height: 168, backgroundColor: c.primary }}>
        <Image
          source={{ uri: propertyImage(property) }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
        <View style={{ position: 'absolute', top: 12, left: 12 }}>
          <Badge label={t(`propertyType.${property.type}`)} tone="info" solid />
        </View>
        {property.featured && (
          <View style={{ position: 'absolute', top: 12, right: 12 }}>
            <Badge label={t('admin.featured')} tone="warning" icon="star" solid />
          </View>
        )}
        {onToggleWatch && (
          <Pressable
            onPress={() => onToggleWatch(property.id)}
            hitSlop={10}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(10,22,40,0.55)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={watched ? 'star' : 'star-outline'} size={18} color={watched ? c.star : '#fff'} />
          </Pressable>
        )}
      </View>

      <View style={{ padding: 14, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 18 }} color="secondary">
            {formatCompactCurrency(property.price, property.currency)}
          </AppText>
          <Badge label={t(`listingStatus.${property.status}`)} tone="success" />
        </View>
        <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 14 }}>
          {displayTitle(property)}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={13} color={c.textMuted} />
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {[property.address?.state, property.address?.city].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: 6 }}>
          {formatPropertySpecs(property.bedrooms, property.bathrooms, property.areaSqm)}
        </AppText>
      </View>
    </Pressable>
  );
}
