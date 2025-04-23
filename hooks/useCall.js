import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import io from 'socket.io-client';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';
import { PermissionsAndroid } from 'react-native';

const managerInstances = new Map();

const useCall = ({ roomId, url, token, userPhone }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting');

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteUsernameRef = useRef(null);
  const isMounted = useRef(false);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          throw new Error('Camera or microphone permission denied');
        }
      } catch (err) {
        throw err;
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleMicrophone = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  };

  useEffect(() => {
    setCallStatus('connecting');

    if (isMounted.current) return;
    isMounted.current = true;

    if (!url || !token) {
      setError('Invalid url or token');
      setCallStatus('failed');
      return;
    }

    let managerEntry = managerInstances.get(url);
    if (!managerEntry) {
      const manager = io(url, {
        reconnectionAttempts: 2,
        reconnectionDelay: 1000,
        autoConnect: true,
        query: { token, roomId },
        transports: ['websocket'],
        auth: { token },
      });
      managerEntry = { manager, usageCount: 0 };
      managerInstances.set(url, managerEntry);
    }

    managerEntry.usageCount += 1;
    socketRef.current = managerEntry.manager;

    const initWebRTC = async () => {
      try {
        await requestPermissions();

        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        const stream = await mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        peerConnectionRef.current.ontrack = (event) => {
          const [remote] = event.streams;
          setRemoteStream(remote);
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate && socketRef.current && remoteUsernameRef.current) {
            socketRef.current.emit('ice_candidate', {
              roomId,
              targetUserId: remoteUsernameRef.current,
              candidate: event.candidate,
            });
          }
        };
      } catch (err) {
        setError('Failed to initialize WebRTC: ' + err.message);
        setCallStatus('failed');
      }
    };

    const resetWebRTC = async () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setCallStatus('connecting');
      setIsConnected(false);
      await initWebRTC();
    };

    initWebRTC();

    socketRef.current.on('auth_error', (message) => {
      setError(`Authentication failed: ${message}`);
      setCallStatus('failed');
      socketRef.current.disconnect();
    });

    socketRef.current.on('room_full', () => {
      setError('Room is full');
      setCallStatus('failed');
      socketRef.current.disconnect();
    });

    socketRef.current.on('call_ended', (message) => {
      setError(message);
      setCallStatus('ended');
      socketRef.current.disconnect();
    });

    socketRef.current.on('user_joined', ({ userId }) => {
      if (userId !== userPhone && peerConnectionRef.current) {
        remoteUsernameRef.current = userId;
        peerConnectionRef.current.createOffer().then((offer) => {
          peerConnectionRef.current.setLocalDescription(offer);
          socketRef.current.emit('offer', {
            roomId,
            targetUserId: userId,
            offer,
          });
        });
      }
      setCallStatus('connecting');
    });

    socketRef.current.on('offer', ({ offer, senderId }) => {
      if (peerConnectionRef.current) {
        remoteUsernameRef.current = senderId;
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        peerConnectionRef.current.createAnswer().then((answer) => {
          peerConnectionRef.current.setLocalDescription(answer);
          socketRef.current.emit('answer', {
            roomId,
            targetUserId: senderId,
            answer,
          });
        });
      }
    });

    socketRef.current.on('answer', ({ answer, senderId }) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setIsConnected(true);
        setCallStatus('connected');
      }
    });

    socketRef.current.on('ice_candidate', ({ candidate }) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on('user_left', async () => {
      if (isMounted.current) {
        await resetWebRTC();
      }
    });

    return () => {
      if (isMounted.current) {
        socketRef.current.emit('leave_call', { roomId });
        socketRef.current.disconnect();
        peerConnectionRef.current?.close();
        localStream?.getTracks().forEach((track) => track.stop());

        const managerEntry = managerInstances.get(url);
        if (managerEntry) {
          managerEntry.usageCount -= 1;
          if (managerEntry.usageCount <= 0) {
            managerInstances.delete(url);
          }
        }
        isMounted.current = false;
      }
    };
  }, [roomId, userPhone, token, url]);

  return { localStream, remoteStream, isConnected, error, callStatus, toggleCamera, toggleMicrophone };
};

export default useCall;