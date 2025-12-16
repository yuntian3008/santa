import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getOrCreateUUID, updateUUID } from '@/lib/utils';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export enum GameState {
    WAITING = 'WAITING',
    VOTING = 'VOTING',
    ANSWERING = 'ANSWERING',
    RESULTS = 'RESULTS',
}

export enum Answer {
    UNKNOWN = 'Không rõ',
    PARTIAL = 'Đúng một phần',
}

export interface PlayerData {
    uuid: string;
    animalName: string;
}

export interface VotingStateData {
    proposerName: string;
    voteCount: number;
    voterThreshold: number;
    hasVoted?: boolean;
    userVote?: boolean;
    countdown?: number;
}

export interface AnsweringStateData {
    proposerName: string;
    countdown: number;
    answerCount: number;
    totalPlayers: number;
    hasAnswered?: boolean;
    answer?: Answer;
    isProposer?: boolean;
}

export interface ResultsStateData {
    result: Answer;
    counts: {
        [Answer.UNKNOWN]: number;
        [Answer.PARTIAL]: number;
    };
    countdown: number;
}

export interface GameStateUpdate {
    state: GameState;
    data?: VotingStateData | AnsweringStateData | ResultsStateData | any;
}

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [playerCount, setPlayerCount] = useState(0);
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
    const [stateData, setStateData] = useState<any>(null);
    const [connectionRejected, setConnectionRejected] = useState(false);

    useEffect(() => {
        const uuid = getOrCreateUUID();

        const newSocket = io(SOCKET_URL, {
            auth: { uuid },
            reconnection: true,
            reconnectionDelay: 500,
            reconnectionAttempts: 10,
        });

        newSocket.on('connect', () => {
            console.log('Connected to server');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
            setConnected(false);
        });

        newSocket.on('connection-rejected', (data: { reason: string }) => {
            console.error('Connection rejected:', data.reason);
            setConnectionRejected(true);
        });

        newSocket.on('player-joined', (data: any) => {
            console.log('Player joined:', data);
            // Update UUID in case server assigned a new one
            if (data.uuid) {
                updateUUID(data.uuid);
            }
            setPlayerData({
                uuid: data.uuid,
                animalName: data.animalName,
            });
            setPlayerCount(data.playerCount);
            setPlayers(data.players);
        });

        newSocket.on('player-count-update', (data: any) => {
            console.log('Player count update:', data);
            setPlayerCount(data.playerCount);
            setPlayers(data.players);
        });

        newSocket.on('state-update', (data: GameStateUpdate) => {
            console.log('State update:', data);
            setGameState(data.state);
            setStateData(data.data || null);
        });

        newSocket.on('state-sync', (data: GameStateUpdate) => {
            console.log('State sync:', data);
            setGameState(data.state);
            setStateData(data.data || null);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const proposeRound = useCallback((proposerName: string) => {
        if (socket) {
            socket.emit('propose-round', { proposerName });
        }
    }, [socket]);

    const vote = useCallback((approve: boolean) => {
        if (socket) {
            socket.emit('vote-round', { approve });
        }
    }, [socket]);

    const submitAnswer = useCallback((answer: Answer) => {
        if (socket) {
            socket.emit('submit-answer', { answer });
        }
    }, [socket]);

    return {
        connected,
        connectionRejected,
        playerData,
        playerCount,
        players,
        gameState,
        stateData,
        proposeRound,
        vote,
        submitAnswer,
    };
}
