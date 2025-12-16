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

export interface Player {
    id: string; // Socket ID
    uuid: string; // UUID v4 from localStorage
    animalName: string;
    joinedAt: number;
    lastSeen: number;
}

export interface GameRound {
    proposerName: string;
    proposerId: string;
    proposerUuid: string;
    voterThreshold: number; // Number of players when proposal was made
    votes: Set<string>; // Player IDs who voted yes
    voters: Set<string>; // All player IDs who voted (yes or no)
    playerVotes: Map<string, boolean>; // Player ID -> vote choice (true=approve, false=reject)
    answers: Map<string, Answer>; // Player UUID -> Answer
    startTime?: number;
    endTime?: number;
}

export interface GameStateData {
    state: GameState;
    players: Map<string, Player>;
    round: GameRound | null;
    answerCount: number; // For real-time display
    countdown: number; // Remaining seconds
}

// Socket event payloads
export interface ConnectData {
    uuid?: string;
}

export interface PlayerJoinedData {
    uuid: string;
    animalName: string;
    playerCount: number;
    players: Array<{ uuid: string; animalName: string }>;
}

export interface ProposeRoundData {
    proposerName: string;
}

export interface VoteRoundData {
    approve: boolean;
}

export interface SubmitAnswerData {
    answer: Answer;
}

export interface StateUpdateData {
    state: GameState;
    data?: any;
}

export interface VotingStateData {
    proposerName: string;
    voteCount: number;
    voterThreshold: number;
}

export interface AnsweringStateData {
    proposerName: string;
    countdown: number;
    answerCount: number;
    totalPlayers: number;
}

export interface ResultsStateData {
    result: Answer;
    counts: {
        [Answer.UNKNOWN]: number;
        [Answer.PARTIAL]: number;
    };
    countdown: number;
}
