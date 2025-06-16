import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface MoodData {
  date: string;
  mood: string;
  intensity: number;
}

interface MoodChartProps {
  data: MoodData[];
  isDark?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export function MoodChart({ data, isDark = false }: MoodChartProps) {
  const chartWidth = screenWidth - 48;
  const chartHeight = 200;
  const maxIntensity = 10;

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'excellent': return '#10B981';
      case 'good': return '#22C55E';
      case 'neutral': return '#6B7280';
      case 'low': return '#F59E0B';
      case 'poor': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const calculateTrend = () => {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(0, Math.ceil(data.length / 2));
    const older = data.slice(Math.ceil(data.length / 2));
    
    const recentAvg = recent.reduce((sum, item) => sum + item.intensity, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.intensity, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  };

  const trend = calculateTrend();

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp size={16} color="#10B981" />;
      case 'declining': return <TrendingDown size={16} color="#EF4444" />;
      default: return <Minus size={16} color="#6B7280" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'improving': return '#10B981';
      case 'declining': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (data.length === 0) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[styles.emptyText, isDark && styles.darkText]}>
          No mood data available. Start tracking to see your progress!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>Mood Trends</Text>
        <View style={styles.trendIndicator}>
          {getTrendIcon()}
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trend.charAt(0).toUpperCase() + trend.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          {[10, 8, 6, 4, 2].map((value) => (
            <Text key={value} style={[styles.yAxisLabel, isDark && styles.darkText]}>
              {value}
            </Text>
          ))}
        </View>

        <View style={styles.chart}>
          <View style={styles.gridLines}>
            {[0, 1, 2, 3, 4].map((index) => (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: (index * chartHeight) / 5 },
                  isDark && styles.darkGridLine
                ]}
              />
            ))}
          </View>

          <View style={styles.dataPoints}>
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * (chartWidth - 60);
              const y = chartHeight - (point.intensity / maxIntensity) * chartHeight;
              
              return (
                <View key={index} style={styles.dataPointContainer}>
                  <View
                    style={[
                      styles.dataPoint,
                      {
                        left: x,
                        top: y,
                        backgroundColor: getMoodColor(point.mood),
                      }
                    ]}
                  />
                  {index < data.length - 1 && (
                    <View
                      style={[
                        styles.connectionLine,
                        {
                          left: x + 6,
                          top: y + 6,
                          width: ((data.length > 1 ? (chartWidth - 60) / (data.length - 1) : 0)) - 12,
                          transform: [
                            {
                              rotate: `${Math.atan2(
                                (chartHeight - (data[index + 1].intensity / maxIntensity) * chartHeight) - y,
                                (chartWidth - 60) / (data.length - 1)
                              )}rad`
                            }
                          ]
                        },
                        { backgroundColor: getMoodColor(point.mood) }
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.xAxis}>
        {data.map((point, index) => (
          <Text key={index} style={[styles.xAxisLabel, isDark && styles.darkText]}>
            {new Date(point.date).getDate()}
          </Text>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendTitle, isDark && styles.darkText]}>Mood Scale</Text>
        <View style={styles.legendItems}>
          {[
            { label: 'Excellent', color: '#10B981' },
            { label: 'Good', color: '#22C55E' },
            { label: 'Neutral', color: '#6B7280' },
            { label: 'Low', color: '#F59E0B' },
            { label: 'Poor', color: '#EF4444' },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, isDark && styles.darkText]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkContainer: {
    backgroundColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  darkText: {
    color: '#F9FAFB',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    padding: 40,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 16,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  yAxisLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'right',
  },
  chart: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  darkGridLine: {
    backgroundColor: '#4B5563',
  },
  dataPoints: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  dataPointContainer: {
    position: 'absolute',
  },
  dataPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  connectionLine: {
    height: 2,
    position: 'absolute',
    transformOrigin: 'left center',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 36,
    marginBottom: 16,
  },
  xAxisLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});