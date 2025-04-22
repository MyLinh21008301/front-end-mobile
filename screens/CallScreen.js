// import React, { useEffect, useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import InCallManager from 'react-native-incall-manager';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { endCall } from '../api/ConversationAPI';
// import RNCallKeep from 'react-native-callkeep';

// const CallScreen = ({ route, navigation }) => {
//   const { callId, friend, peerConnection, isInitiator } = route.params;
//   const [callStatus, setCallStatus] = useState('Đang gọi...');

//   useEffect(() => {
//     peerConnection.ontrack = (event) => {
//       setCallStatus('Đã kết nối');
//     };

//     peerConnection.oniceconnectionstatechange = () => {
//       if (peerConnection.iceConnectionState === 'disconnected' || peerConnection.iceConnectionState === 'closed') {
//         handleEndCall();
//       }
//     };

//     return () => {
//       peerConnection.close();
//       InCallManager.stop();
//     };
//   }, [peerConnection]);

//   const handleEndCall = async () => {
//     try {
//       const jwt = await AsyncStorage.getItem('authToken');
//       await endCall(jwt, callId);
//       RNCallKeep.endCall(callId);
//       InCallManager.stop();
//       peerConnection.close();
//       navigation.goBack();
//     } catch (error) {
//       console.error('Lỗi khi kết thúc cuộc gọi:', error);
//       Alert.alert('Lỗi', 'Không thể kết thúc cuộc gọi.');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.callerName}>{friend.name || 'Unknown'}</Text>
//       <Text style={styles.callStatus}>{callStatus}</Text>
//       <View style={styles.controls}>
//         <TouchableOpacity style={styles.endButton} onPress={handleEndCall}>
//           <Feather name="x" size={30} color="#fff" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   callerName: {
//     fontSize: 24,
//     color: '#fff',
//     marginBottom: 20,
//   },
//   callStatus: {
//     fontSize: 18,
//     color: '#ccc',
//     marginBottom: 40,
//   },
//   controls: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   endButton: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#FF3B30',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default CallScreen;