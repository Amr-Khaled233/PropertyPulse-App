// Thin themed wrapper around react-native-chart-kit's LineChart.

import { useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/theme';
import { AppText } from './common/Text';

interface Props {
  labels: string[];
  data: number[];
  title?: string;
  suffix?: string;
  formatY?: (n: number) => string;
}

export function LineChartCard({ labels, data, title, suffix, formatY }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const chartWidth = width - 40; // screen padding 20 each side

  if (!data.length) return null;

  // Thin out labels so they don't overlap on a phone.
  const step = Math.max(1, Math.ceil(labels.length / 6));
  const shownLabels = labels.map((l, i) => (i % step === 0 ? l : ''));

  return (
    <View style={{ gap: 8 }}>
      {title && <AppText variant="label" color="textMuted">{title}</AppText>}
      <LineChart
        data={{ labels: shownLabels, datasets: [{ data }] }}
        width={chartWidth}
        height={200}
        yAxisSuffix={suffix ?? ''}
        formatYLabel={formatY ? (v) => formatY(Number(v)) : undefined}
        withInnerLines={false}
        withOuterLines={false}
        chartConfig={{
          backgroundGradientFrom: c.surface,
          backgroundGradientTo: c.surface,
          decimalPlaces: 0,
          color: () => c.secondary,
          labelColor: () => c.textMuted,
          propsForDots: { r: '3', strokeWidth: '2', stroke: c.secondary },
          propsForBackgroundLines: { stroke: c.border },
        }}
        bezier
        style={{ borderRadius: radius.md }}
      />
    </View>
  );
}
