import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageViewer = ({ visible, imageUri, onClose }) => {
  const [scale, setScale] = useState(1);
  const [lastScale, setLastScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Create Animated.Value refs for pan gesture
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const pinchRef = useRef();
  const panRef = useRef();
  const doubleTapRef = useRef();
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale2 = Animated.multiply(baseScale, pinchScale);

  // Handle pinch gesture for zooming
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const newScale = lastScale * event.nativeEvent.scale;
      const clampedScale = Math.max(1, Math.min(newScale, 5));
      
      baseScale.setValue(clampedScale);
      pinchScale.setValue(1);
      
      setScale(clampedScale);
      setLastScale(clampedScale);
      
      // Reset position if zoomed out completely
      if (clampedScale <= 1) {
        setScale(1);
        setLastScale(1);
        translateX.setValue(0);
        translateY.setValue(0);
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
      }
    }
  };

  // Handle pan gesture for moving when zoomed in - FIXED VERSION
  const onPanGestureEvent = Animated.event(
    [{ 
      nativeEvent: { 
        translationX: translateX,
        translationY: translateY 
      } 
    }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Update last translate values when gesture ends
      lastTranslateX.current += event.nativeEvent.translationX;
      lastTranslateY.current += event.nativeEvent.translationY;
      
      // Apply constraints to prevent panning outside bounds
      const maxTranslateX = (screenWidth * (scale - 1)) / 2;
      const maxTranslateY = (screenHeight * (scale - 1)) / 2;
      
      lastTranslateX.current = Math.max(-maxTranslateX, Math.min(maxTranslateX, lastTranslateX.current));
      lastTranslateY.current = Math.max(-maxTranslateY, Math.min(maxTranslateY, lastTranslateY.current));
      
      // Reset translation values for next gesture
      translateX.setValue(0);
      translateY.setValue(0);
      
      // Set final position
      translateX.setValue(lastTranslateX.current);
      translateY.setValue(lastTranslateY.current);
    }
  };

  // Handle double tap to zoom in/out
  const onDoubleTap = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      if (scale > 1) {
        // Zoom out and reset position
        setScale(1);
        setLastScale(1);
        baseScale.setValue(1);
        translateX.setValue(0);
        translateY.setValue(0);
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
      } else {
        // Zoom in to 2x
        setScale(2);
        setLastScale(2);
        baseScale.setValue(2);
      }
    }
  };

  const resetZoom = () => {
    setScale(1);
    setLastScale(1);
    baseScale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };

  const handleClose = () => {
    resetZoom();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          <TapGestureHandler
            ref={doubleTapRef}
            onHandlerStateChange={onDoubleTap}
            numberOfTaps={2}
          >
            <Animated.View style={styles.imageContainer}>
              <PinchGestureHandler
                ref={pinchRef}
                onGestureEvent={onPinchGestureEvent}
                onHandlerStateChange={onPinchHandlerStateChange}
                simultaneousHandlers={[panRef, doubleTapRef]}
              >
                <Animated.View style={styles.imageContainer}>
                  <PanGestureHandler
                    ref={panRef}
                    onGestureEvent={onPanGestureEvent}
                    onHandlerStateChange={onPanHandlerStateChange}
                    simultaneousHandlers={[pinchRef, doubleTapRef]}
                    enabled={scale > 1}
                  >
                    <Animated.View style={styles.imageContainer}>
                      {isLoading && (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#ffffff" />
                          <Text style={styles.loadingText}>Loading image...</Text>
                        </View>
                      )}
                      <Animated.Image
                        source={{ uri: imageUri }}
                        style={[
                          styles.fullImage,
                          {
                            transform: [
                              { scale: scale2 },
                              { translateX: Animated.add(translateX, new Animated.Value(0)) },
                              { translateY: Animated.add(translateY, new Animated.Value(0)) },
                            ],
                            opacity: isLoading ? 0.3 : 1,
                          },
                        ]}
                        resizeMode="contain"
                        onLoadStart={() => setIsLoading(true)}
                        onLoad={() => setIsLoading(false)}
                      />
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>

          {/* Zoom indicator */}
          {scale > 1 && (
            <View style={styles.zoomIndicator}>
              <TouchableOpacity onPress={resetZoom} style={styles.resetButton}>
                <Ionicons name="contract-outline" size={20} color="#fff" />
              </TouchableOpacity>
              
            </View>
          )}
          
          {/* Zoom level indicator */}
          <View style={styles.zoomLevelIndicator}>
            <Text style={styles.zoomLevelText}>{Math.round(scale * 100)}%</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    height: screenHeight,
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    zIndex: 10,
  },
  resetButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
  },
  zoomLevelIndicator: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 10,
  },
  zoomLevelText: {
    color: '#ffffff',
    fontSize: 14,
  },
});

export default ImageViewer;