import React, { useRef, useState } from 'react';
import { 
  ScrollView, 
  ScrollViewProps, 
  View, 
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface FadeEdgeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  fadeWidth?: number;
  gradientColors?: [string, string, ...string[]];
}

export default function FadeEdgeScrollView({ 
  children, 
  fadeWidth = 40,
  gradientColors = ['transparent', '#1C1C1E', '#1C1C1E', 'transparent'],
  horizontal = true,
  showsHorizontalScrollIndicator = false,
  ...props
}: FadeEdgeScrollViewProps) {
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(event.nativeEvent.contentOffset.x);
  };

  const handleContentSizeChange = (width: number) => {
    setContentWidth(width);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setScrollViewWidth(event.nativeEvent.layout.width);
  };

  const isLeftVisible = scrollX > 5;
  const isRightVisible = scrollX + scrollViewWidth < contentWidth - 5;

  return (
    <View style={{ position: 'relative' }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        scrollEventThrottle={16}
        {...props}
      >
        <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
          {children}
        </View>
      </ScrollView>

      {/* Gradiente izquierdo */}
      {isLeftVisible && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.1, y: 0.5 }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: fadeWidth,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Gradiente derecho */}
      {isRightVisible && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.9, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: fadeWidth,
            pointerEvents: 'none',
          }}
        />
      )}
    </View>
  );
}