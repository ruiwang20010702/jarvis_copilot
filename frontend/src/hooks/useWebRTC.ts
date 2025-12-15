import { useState, useEffect, useRef } from 'react';
import { subscribeToSignal, sendSignal, isConnected } from '../sync';
import { useGameStore } from '../../store';

interface UseWebRTCProps {
    role: 'student' | 'teacher';
}

export const useWebRTC = ({ role }: UseWebRTCProps) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const { setRemoteStream } = useGameStore();

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const roleRef = useRef(role);

    // Keep roleRef updated
    useEffect(() => {
        roleRef.current = role;
        console.log('[useWebRTC] Role updated:', role);
    }, [role]);

    // Initialize WebRTC
    useEffect(() => {
        let checkConnectionInterval: NodeJS.Timeout | null = null;

        const init = async () => {
            try {
                // Check if mediaDevices is available (requires HTTPS or localhost)
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.error('[useWebRTC] mediaDevices not available. getUserMedia requires HTTPS or localhost.');
                    console.error('[useWebRTC] Current URL:', window.location.href);
                    console.error('[useWebRTC] To fix: access via https:// or http://localhost:3000');
                    // Continue without video - still try to establish signaling
                    checkConnectionInterval = setInterval(() => {
                        if (isConnected()) {
                            const currentRole = roleRef.current;
                            console.log('[useWebRTC] WebSocket connected (no video), sending presence signal for role:', currentRole);
                            if (currentRole === 'teacher') {
                                sendSignal({ type: 'TEACHER_HERE' });
                            } else {
                                sendSignal({ type: 'STUDENT_HERE' });
                            }
                            if (checkConnectionInterval) {
                                clearInterval(checkConnectionInterval);
                                checkConnectionInterval = null;
                            }
                        }
                    }, 1000);
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                localStreamRef.current = stream;

                // Wait for WebSocket connection before sending presence signal
                checkConnectionInterval = setInterval(() => {
                    if (isConnected()) {
                        const currentRole = roleRef.current;
                        console.log('[useWebRTC] WebSocket connected, sending presence signal for role:', currentRole);
                        if (currentRole === 'teacher') {
                            sendSignal({ type: 'TEACHER_HERE' });
                        } else {
                            sendSignal({ type: 'STUDENT_HERE' });
                        }
                        if (checkConnectionInterval) {
                            clearInterval(checkConnectionInterval);
                            checkConnectionInterval = null;
                        }
                    }
                }, 1000);

            } catch (err) {
                console.error('[useWebRTC] Error accessing media devices:', err);
                if (checkConnectionInterval) {
                    clearInterval(checkConnectionInterval);
                    checkConnectionInterval = null;
                }
            }
        };


        init();

        return () => {
            localStreamRef.current?.getTracks().forEach(track => track.stop());
            peerConnection.current?.close();
            setRemoteStream(null);
            if (checkConnectionInterval) {
                clearInterval(checkConnectionInterval);
            }
        };
    }, []);

    const createPeerConnection = () => {
        if (peerConnection.current) return;

        console.log('[useWebRTC] Creating PeerConnection');
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({ type: 'CANDIDATE', candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            console.log('[useWebRTC] Received remote track');
            setRemoteStream(event.streams[0]);
            setConnectionStatus('connected');
        };

        pc.onconnectionstatechange = () => {
            console.log('[useWebRTC] Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setConnectionStatus('connected');
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setConnectionStatus('disconnected');
                setRemoteStream(null);
            }
        };

        // Add local tracks
        localStreamRef.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current!);
        });

        peerConnection.current = pc;
        setConnectionStatus('connecting');
    };

    // Handle Signaling
    useEffect(() => {
        const handleSignal = async (payload: any, senderId?: string, senderRole?: string) => {
            if (!localStreamRef.current) return;

            const currentRole = roleRef.current;

            // Map sync roles to WebRTC roles for comparison
            // sync.ts uses 'coach' | 'student', but we use 'teacher' | 'student'
            const mappedSenderRole = senderRole === 'coach' ? 'teacher' : senderRole;

            // Ignore signals from same role (e.g. multiple tabs)
            if (mappedSenderRole === currentRole) return;

            console.log('[useWebRTC] Handling signal:', payload.type, 'from role:', senderRole, '(mapped:', mappedSenderRole, ') my role:', currentRole);

            try {
                switch (payload.type) {
                    case 'TEACHER_HERE':
                        if (currentRole === 'student') {
                            console.log('[useWebRTC] Teacher is here, announcing presence...');
                            sendSignal({ type: 'STUDENT_HERE' });
                        }
                        break;

                    case 'STUDENT_HERE':
                        if (currentRole === 'teacher') {
                            // Skip if connection already exists (duplicate signal)
                            if (peerConnection.current) {
                                console.log('[useWebRTC] Student signal received but connection already exists, ignoring...');
                                break;
                            }
                            console.log('[useWebRTC] Student is here, initiating call...');
                            createPeerConnection();
                            const offer = await peerConnection.current!.createOffer();
                            await peerConnection.current!.setLocalDescription(offer);
                            sendSignal({ type: 'OFFER', sdp: offer });
                        }
                        break;


                    case 'OFFER':
                        if (currentRole === 'student') {
                            console.log('[useWebRTC] Received offer, answering...');
                            createPeerConnection();
                            await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                            const answer = await peerConnection.current!.createAnswer();
                            await peerConnection.current!.setLocalDescription(answer);
                            sendSignal({ type: 'ANSWER', sdp: answer });
                        }
                        break;

                    case 'ANSWER':
                        if (currentRole === 'teacher' && peerConnection.current) {
                            console.log('[useWebRTC] Received answer');
                            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                        }
                        break;

                    case 'CANDIDATE':
                        if (peerConnection.current) {
                            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        }
                        break;
                }
            } catch (err) {
                console.error('[useWebRTC] Error handling signal:', err);
            }
        };

        const unsubscribe = subscribeToSignal(handleSignal);
        return () => unsubscribe();
    }, []);

    return { localStream, connectionStatus };
};
