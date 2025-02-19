import { Dimensions, StyleSheet, Platform } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? "10%" : "5%",
    left: "5%",
    zIndex: 10,
  },
  imageContainer: {
    width: screenWidth,
    height: "100%",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
    paddingBottom: screenHeight * 0.05, // 5% del alto
  },
  infoContainer: {
    padding: screenWidth * 0.05, // 5% del ancho
  },
  nameContainer: {
    position: "absolute",
    top: "68%",
    left: "5%",
    right: "5%",
    zIndex: 10,
  },
  name: {
    fontSize: screenWidth * 0.050,
    fontWeight: "bold",
    color: "white",
  },
  friendCountText: {
    fontSize: screenWidth * 0.050,
    color: "white",
    fontWeight: "bold",
    marginTop: screenHeight * 0.005,
  },
  spacer: {
    height: screenHeight * 0.2,
  },
  friendCountContainer: {
    alignItems: "flex-start",
    marginTop: screenHeight * 0.025,
    marginBottom: screenHeight * 0.025,
  },
  mutualFriendsContainer: {
    alignItems: "flex-start",
    marginTop: screenHeight * 0.02,
    marginBottom: screenHeight * 0.025,
  },
  number: {
    fontSize: screenWidth * 0.06,
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: screenHeight * 0.01,
    gap: screenWidth * 0.025,
  },
  button: {
    width: "42%",
    height: screenHeight * 0.043,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: screenWidth * 0.05,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: screenHeight * 0.01,
  },
  buttonText: {
    color: "#fff",
    fontSize: screenWidth * 0.04,
    fontWeight: "bold",
  },
  menuContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? "10%" : "5%",
    right: "5%",
    zIndex: 10,
  },
  menuContent: {
    marginTop: screenHeight * 0.075,
    borderRadius: screenWidth * 0.03,
  },
  menuStyle: {
    borderRadius: screenWidth * 0.03,
  },
  ovalContainer: {
    marginTop: screenHeight * 0.025,
    marginBottom: screenHeight * 0.010,
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: screenWidth * 0.075,
  },
  oval: {
    width: "42%",
    height: screenHeight * 0.043,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: screenWidth * 0.05,
    justifyContent: "center",
    alignItems: "center",
  },
  ovalText: {
    color: "white",
    fontSize: screenWidth * 0.040,
    fontWeight: "bold",
  },
  contentWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ovalAndIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  ovalWrapper: {
    flex: 1,
  },
  iconsContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginLeft: screenWidth * 0.025,
    gap: screenWidth * 0.05,
    position: "relative",
  },
  iconButton: {
    borderRadius: screenWidth * 0.05,
    padding: screenWidth * 0.03,
    marginBottom: screenWidth * 0.00,
  },
  friendshipButton: {
    zIndex: 10,
    width: screenWidth * 0.12,
    height: screenWidth * 0.12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: screenWidth * 0.025,
  },
  mutualFriendIm: {
    width: screenWidth * 0.1,
    height: screenWidth * 0.1,
    borderRadius: screenWidth * 0.05,
    marginRight: -screenWidth * 0.0375,
    borderWidth: 2,
    borderColor: "white",
  },
  mutualFriendImagesContainer: {
    flexDirection: "row",
    position: "relative",
    height: screenWidth * 0.1,
  },
  mutualFriendImage: {
    width: screenWidth * 0.1,
    height: screenWidth * 0.1,
    borderRadius: screenWidth * 0.05,
    position: "absolute",
  },
  mutualFriendMoreText: {
    color: "white",
    fontSize: screenWidth * 0.035,
    marginLeft: screenWidth * 0.025,
  },
  noMutualFriendsText: {
    color: "white",
    fontSize: screenWidth * 0.035,
  },
  heartCountText: {
    color: "white",
    fontSize: screenWidth * 0.04,
    marginTop: screenHeight * 0.005,
    textAlign: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
