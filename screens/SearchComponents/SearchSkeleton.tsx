"use client"

import { View, Animated, StyleSheet } from "react-native"
import { useEffect, useRef } from "react"

interface SearchSkeletonProps {
  theme: {
    background: string
    text: string
    textSecondary: string
    inputBackground: string
    placeholder: string
    icon: string
    buttonBackground: string
  }
  count?: number
}

const SearchSkeleton = ({ theme, count = 3 }: SearchSkeletonProps) => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [fadeAnim])

  const renderSkeletonItem = (index: number) => (
    <Animated.View
      key={`skeleton-${index}`}
      style={[styles.resultItem, { opacity: fadeAnim, backgroundColor: theme.inputBackground }]}
    >
      <View style={[styles.avatarSkeleton, { backgroundColor: theme.placeholder }]} />
      <View style={styles.textContainer}>
        <View style={[styles.usernameSkeleton, { backgroundColor: theme.placeholder }]} />
        <View style={[styles.nameSkeleton, { backgroundColor: theme.placeholder }]} />
      </View>
    </Animated.View>
  )

  return (
    <View style={styles.container}>{Array.from({ length: count }).map((_, index) => renderSkeletonItem(index))}</View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },
  avatarSkeleton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  usernameSkeleton: {
    height: 16,
    width: "50%",
    borderRadius: 4,
    marginBottom: 8,
  },
  nameSkeleton: {
    height: 14,
    width: "70%",
    borderRadius: 4,
  },
})

export default SearchSkeleton
