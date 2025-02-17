// StoryImage.js
import React, { useState } from "react";
import { Image, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function StoryImage({ currentStory, ...rest }) {
  const [imageDimensions, setImageDimensions] = useState({
    width: "100%",
    height: "100%",
  });

  return (
    <Image
    source={{ uri: currentStory.storyUrl }}
      style={[imageDimensions, rest.style]}
      fadeDuration={0}
      onLoadStart={() => {
        currentStory.loadStartTime = Date.now();
      }}
      onLoad={(event) => {
        const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
        const screenAspectRatio = width / height;
        const imageAspectRatio = imgWidth / imgHeight;

        if (imageAspectRatio > screenAspectRatio) {
          setImageDimensions({ width: "100%", height: "100%" });
        } else {
          setImageDimensions({ width: "100%", height: "100%" });
        }
      }}
      onError={(error) => {
        console.error(`Error cargando historia ${currentStory.id}:`, error);
      }}
      {...rest} // Permite pasar cualquier otra prop a <Image> desde <StoryViewer>
    />
  );
}
