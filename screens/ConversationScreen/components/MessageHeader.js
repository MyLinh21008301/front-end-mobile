// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { Image } from 'react-native';

// const MessageHeader = ({ sender, isMyMessage }) => {
//   return (
//     <View style={styles.messageHeader}>
//       <Image
//         source={
//           sender?.avatar
//             ? { uri: sender.avatar }
//             : require('../../../assets/icon.png')
//         }
//         style={styles.messageAvatar}
//       />
//       <Text style={styles.messageSenderName}>
//         {sender?.name || sender?.phoneNumber || 'Unknown'}
//       </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   messageHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   messageAvatar: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     marginRight: 8,
//   },
//   messageSenderName: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//   },
// });

// export default MessageHeader;


import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dvvvivioo/image/upload/v1745401126/Image_286_qj1u04.jpg';

const MessageHeader = ({ sender, isMyMessage }) => {
  return (
    <View style={styles.messageHeader}>
      {!isMyMessage && (
        <>
          <Image
            source={
              sender?.avatar || sender?.baseImg
                ? { uri: sender.avatar || sender.baseImg }
                : { uri: DEFAULT_AVATAR }
            }
            style={styles.messageAvatar}
            onError={(e) => console.log('Avatar load error for', sender?.phoneNumber || 'unknown', ':', e.nativeEvent.error)}
          />
          <Text style={styles.messageSenderName}>
            {sender?.name || sender?.phoneNumber || 'Unknown'}
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  messageSenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default MessageHeader;