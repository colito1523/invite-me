import { View, Text, TouchableOpacity, StyleSheet } from "react-native"

function ReplyBox({ text, onClose }) {
  // If there's no text, we don't render anything
  if (!text) return null

  return (
    <View style={styles.replyContainer}>
      <View style={styles.replyIndicator} />
      <View style={styles.contentContainer}>
        <Text style={styles.replyingToText}>Replying to</Text>
        <Text style={styles.replyText} numberOfLines={1} ellipsizeMode="tail">
          {text}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
        <Text style={styles.closeButton}>×</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "#EFEFEF",
  },
  replyIndicator: {
    width: 2.5,
    height: "70%",
    backgroundColor: "#3897F0", // Instagram blue
    borderRadius: 4,
    marginRight: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  replyingToText: {
    fontSize: 11,
    color: "#8E8E8E",
    marginBottom: 2,
  },
  replyText: {
    color: "#262626",
    fontSize: 13,
    fontWeight: "500",
  },
  closeButtonContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  closeButton: {
    color: "#8E8E8E",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 22,
  },
})

export default ReplyBox

