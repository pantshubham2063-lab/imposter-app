import React from 'react';
import { View } from 'react-native';

type Props = {
  streams: Record<string, any>;
};

/** Hidden RTCViews keep remote audio playing on native WebRTC. */
export const RemoteVoiceStreams: React.FC<Props> = ({ streams }) => {
  try {
    const { RTCView } = require('react-native-webrtc');
    return (
      <View pointerEvents="none" style={{ width: 0, height: 0, opacity: 0 }}>
        {Object.entries(streams).map(([peerId, stream]) => (
          <RTCView
            key={peerId}
            streamURL={stream.toURL()}
            objectFit="cover"
            style={{ width: 1, height: 1 }}
          />
        ))}
      </View>
    );
  } catch {
    return null;
  }
};
