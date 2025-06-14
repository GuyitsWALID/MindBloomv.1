import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface AnimatedPlantProps {
  growthStage: number; // 0-100 percentage
  plantType: 'flower' | 'tree' | 'herb' | 'succulent';
  size?: number;
  isDark?: boolean;
}

export function AnimatedPlant({ growthStage, plantType, size = 80, isDark = false }: AnimatedPlantProps) {
  const growthAnimation = useRef(new Animated.Value(0)).current;
  const bloomAnimation = useRef(new Animated.Value(0)).current;
  const swayAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Growth animation
    Animated.timing(growthAnimation, {
      toValue: growthStage / 100,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Bloom animation (only when growth is above 60%)
    if (growthStage > 60) {
      Animated.timing(bloomAnimation, {
        toValue: 1,
        duration: 1500,
        delay: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: false,
      }).start();
    }

    // Gentle sway animation
    const sway = () => {
      Animated.sequence([
        Animated.timing(swayAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnimation, {
          toValue: -1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start(() => sway());
    };

    if (growthStage > 20) {
      sway();
    }
  }, [growthStage]);

  const stemHeight = growthAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [size * 0.1, size * 0.6],
  });

  const leafScale = growthAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });

  const flowerScale = bloomAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const swayRotation = swayAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const getPlantColors = () => {
    switch (plantType) {
      case 'flower':
        return {
          stem: '#22C55E',
          leaf: '#16A34A',
          bloom: '#EC4899',
          accent: '#F97316',
        };
      case 'tree':
        return {
          stem: '#92400E',
          leaf: '#15803D',
          bloom: '#22C55E',
          accent: '#059669',
        };
      case 'herb':
        return {
          stem: '#16A34A',
          leaf: '#22C55E',
          bloom: '#84CC16',
          accent: '#65A30D',
        };
      case 'succulent':
        return {
          stem: '#059669',
          leaf: '#10B981',
          bloom: '#F59E0B',
          accent: '#D97706',
        };
      default:
        return {
          stem: '#22C55E',
          leaf: '#16A34A',
          bloom: '#EC4899',
          accent: '#F97316',
        };
    }
  };

  const colors = getPlantColors();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Soil/Base */}
      <View style={[styles.soil, { 
        width: size * 0.8, 
        height: size * 0.15,
        backgroundColor: isDark ? '#374151' : '#92400E',
      }]} />
      
      {/* Plant Container */}
      <Animated.View 
        style={[
          styles.plantContainer,
          {
            transform: [{ rotate: swayRotation }],
          }
        ]}
      >
        {/* Stem */}
        <Animated.View
          style={[
            styles.stem,
            {
              height: stemHeight,
              backgroundColor: colors.stem,
              width: size * 0.08,
            }
          ]}
        />

        {/* Leaves */}
        <Animated.View
          style={[
            styles.leavesContainer,
            {
              transform: [{ scale: leafScale }],
            }
          ]}
        >
          {plantType === 'flower' && (
            <>
              <View style={[styles.leaf, styles.leftLeaf, { 
                backgroundColor: colors.leaf,
                width: size * 0.15,
                height: size * 0.25,
              }]} />
              <View style={[styles.leaf, styles.rightLeaf, { 
                backgroundColor: colors.leaf,
                width: size * 0.15,
                height: size * 0.25,
              }]} />
            </>
          )}
          
          {plantType === 'tree' && (
            <View style={[styles.treeCrown, { 
              backgroundColor: colors.leaf,
              width: size * 0.5,
              height: size * 0.4,
            }]} />
          )}
          
          {plantType === 'herb' && (
            <>
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.herbLeaf,
                    {
                      backgroundColor: colors.leaf,
                      width: size * 0.08,
                      height: size * 0.15,
                      transform: [
                        { rotate: `${(i - 2) * 25}deg` },
                        { translateY: -size * 0.1 * i },
                      ],
                    }
                  ]}
                />
              ))}
            </>
          )}
          
          {plantType === 'succulent' && (
            <>
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.succulentLeaf,
                    {
                      backgroundColor: colors.leaf,
                      width: size * 0.12,
                      height: size * 0.3,
                      transform: [
                        { rotate: `${i * 60}deg` },
                      ],
                    }
                  ]}
                />
              ))}
            </>
          )}
        </Animated.View>

        {/* Flower/Bloom */}
        {growthStage > 60 && (
          <Animated.View
            style={[
              styles.bloomContainer,
              {
                transform: [{ scale: flowerScale }],
              }
            ]}
          >
            {plantType === 'flower' && (
              <View style={styles.flower}>
                {[...Array(8)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.petal,
                      {
                        backgroundColor: colors.bloom,
                        width: size * 0.08,
                        height: size * 0.15,
                        transform: [{ rotate: `${i * 45}deg` }],
                      }
                    ]}
                  />
                ))}
                <View style={[styles.flowerCenter, { 
                  backgroundColor: colors.accent,
                  width: size * 0.06,
                  height: size * 0.06,
                }]} />
              </View>
            )}
            
            {plantType === 'tree' && (
              <>
                {[...Array(3)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.fruit,
                      {
                        backgroundColor: colors.bloom,
                        width: size * 0.06,
                        height: size * 0.06,
                        left: (i - 1) * size * 0.1,
                        top: i * size * 0.05,
                      }
                    ]}
                  />
                ))}
              </>
            )}
            
            {(plantType === 'herb' || plantType === 'succulent') && (
              <View style={[styles.smallBloom, { 
                backgroundColor: colors.bloom,
                width: size * 0.05,
                height: size * 0.05,
              }]} />
            )}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  soil: {
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
  },
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 0,
  },
  stem: {
    borderRadius: 4,
    marginBottom: 2,
  },
  leavesContainer: {
    position: 'absolute',
    bottom: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    borderRadius: 12,
    position: 'absolute',
  },
  leftLeaf: {
    transform: [{ rotate: '-30deg' }],
    left: -8,
  },
  rightLeaf: {
    transform: [{ rotate: '30deg' }],
    right: -8,
  },
  treeCrown: {
    borderRadius: 100,
  },
  herbLeaf: {
    borderRadius: 8,
    position: 'absolute',
  },
  succulentLeaf: {
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    transformOrigin: 'bottom center',
  },
  bloomContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flower: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    borderRadius: 12,
    position: 'absolute',
    transformOrigin: 'bottom center',
  },
  flowerCenter: {
    borderRadius: 100,
  },
  fruit: {
    borderRadius: 100,
    position: 'absolute',
  },
  smallBloom: {
    borderRadius: 100,
  },
});