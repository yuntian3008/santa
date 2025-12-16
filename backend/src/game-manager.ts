import type { Server } from 'socket.io';
import { GameState, Answer, type GameRound, type Player } from './types';
import type { PlayerManager } from './player-manager';

const VOTING_COUNTDOWN = 10; // 10 seconds for voting
const ANSWER_COUNTDOWN = 10; // 10 seconds for answering
const RESULTS_COUNTDOWN = 10; // 10 seconds for results display

export class GameManager {
    private state: GameState = GameState.WAITING;
    private round: GameRound | null = null;
    private countdownTimer: NodeJS.Timeout | null = null;
    private countdown: number = 0;

    constructor(private io: Server, private playerManager: PlayerManager) { }

    /**
     * Get current game state
     */
    getState(): GameState {
        return this.state;
    }

    /**
     * Get current round data
     */
    getRound(): GameRound | null {
        return this.round;
    }

    /**
     * Propose a new round
     * @param proposerName Name entered by proposer
     * @param proposerId Socket ID of proposer
     * @param proposerUuid UUID of proposer
     * @param currentPlayerCount Number of players at proposal time
     */
    proposeRound(proposerName: string, proposerId: string, proposerUuid: string, currentPlayerCount: number): void {
        if (this.state !== GameState.WAITING) {
            console.log('Cannot propose round: game not in WAITING state');
            return;
        }

        this.state = GameState.VOTING;
        this.countdown = VOTING_COUNTDOWN;
        this.round = {
            proposerName,
            proposerId,
            proposerUuid,
            voterThreshold: currentPlayerCount,
            votes: new Set(),
            voters: new Set(),
            playerVotes: new Map(),
            answers: new Map(),
        };

        console.log(`Round proposed by ${proposerName}, threshold: ${currentPlayerCount}`);

        // Broadcast voting state
        this.emitVotingState();

        // Start voting countdown
        this.countdownTimer = setInterval(() => {
            this.countdown--;

            if (this.countdown <= 0) {
                this.cancelVoting();
            } else {
                this.emitVotingState();
            }
        }, 1000);
    }

    /**
     * Handle vote on current proposal
     * @param playerId Socket ID of voter
     * @param approve True for yes, false for no
     */
    /**
     * Emit voting state update
     */
    private emitVotingState(): void {
        if (!this.round) return;

        this.io.emit('state-update', {
            state: GameState.VOTING,
            data: {
                proposerName: this.round.proposerName,
                voteCount: this.round.votes.size,
                voterThreshold: this.round.voterThreshold,
                countdown: this.countdown,
            },
        });
    }

    /**
     * Cancel voting and return to waiting state
     */
    private cancelVoting(): void {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }

        console.log('Voting cancelled: timeout reached without enough votes');
        this.state = GameState.WAITING;
        this.round = null;
        this.countdown = 0;

        // Broadcast waiting state
        this.io.emit('state-update', {
            state: GameState.WAITING,
        });
    }

    /**
     * Handle vote on current proposal
     * @param playerId Socket ID of voter
     * @param approve True for yes, false for no
     */
    vote(playerId: string, approve: boolean): void {
        if (this.state !== GameState.VOTING || !this.round) {
            console.log('Cannot vote: not in VOTING state');
            return;
        }

        // Record vote
        this.round.voters.add(playerId);
        this.round.playerVotes.set(playerId, approve);
        if (approve) {
            this.round.votes.add(playerId);
        }

        const voteCount = this.round.votes.size;
        const voterThreshold = this.round.voterThreshold;

        console.log(`Vote received: ${voteCount}/${voterThreshold}`);

        // Broadcast updated vote count
        this.emitVotingState();

        // Check if threshold reached (>= 50%)
        if (voteCount >= Math.ceil(voterThreshold / 2)) {
            // Clear voting timer before starting answering
            if (this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }
            this.startAnswering();
        }
    }

    /**
     * Start answering phase with countdown
     */
    private startAnswering(): void {
        if (!this.round) return;

        this.state = GameState.ANSWERING;
        this.countdown = ANSWER_COUNTDOWN;
        this.round.startTime = Date.now();

        console.log(`Answering phase started for ${this.round.proposerName}`);

        // Broadcast answering state
        this.emitAnsweringState();

        // Start countdown
        this.countdownTimer = setInterval(() => {
            this.countdown--;

            if (this.countdown <= 0) {
                this.endAnswering();
            } else {
                this.emitAnsweringState();
            }
        }, 1000);
    }

    /**
     * Emit answering state update
     */
    private emitAnsweringState(): void {
        if (!this.round) return;

        // Send personalized state to each connected client
        this.io.sockets.sockets.forEach((socket) => {
            const player = this.playerManager.getPlayerBySocketId(socket.id);
            if (!player) return;

            socket.emit('state-update', {
                state: GameState.ANSWERING,
                data: {
                    proposerName: this.round!.proposerName,
                    countdown: this.countdown,
                    answerCount: this.round!.answers.size,
                    totalPlayers: this.round!.voterThreshold - 1, // Exclude proposer
                    isProposer: player.uuid === this.round!.proposerUuid,
                    hasAnswered: this.round!.answers.has(player.uuid),
                    answer: this.round!.answers.get(player.uuid),
                },
            });
        });
    }

    /**
     * Submit answer during answering phase
     * @param playerUuid Player's UUID
     * @param answer Answer choice
     */
    submitAnswer(playerUuid: string, answer: Answer): void {
        if (this.state !== GameState.ANSWERING || !this.round) {
            console.log('Cannot submit answer: not in ANSWERING state');
            return;
        }

        // Check if player is the proposer
        if (playerUuid === this.round.proposerUuid) {
            console.log(`Proposer ${playerUuid} cannot answer their own question`);
            return;
        }

        // Check if already answered
        if (this.round.answers.has(playerUuid)) {
            console.log(`Player ${playerUuid} already answered`);
            return;
        }

        // Record answer
        this.round.answers.set(playerUuid, answer);
        console.log(`Answer received: ${answer} (${this.round.answers.size} total)`);

        // Broadcast updated answer count
        this.emitAnsweringState();
    }

    /**
     * End answering phase and calculate results
     */
    private endAnswering(): void {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }

        if (!this.round) return;

        this.round.endTime = Date.now();

        // Calculate results
        const answers = Array.from(this.round.answers.values());
        const partialCount = answers.filter(a => a === Answer.PARTIAL).length;
        const unknownCount = answers.filter(a => a === Answer.UNKNOWN).length;

        // Default "Không rõ" for players who didn't answer (excluding proposer)
        const defaultUnknownCount = (this.round.voterThreshold - 1) - answers.length;
        const totalUnknownCount = unknownCount + defaultUnknownCount;

        // Result: if at least one "Đúng một phần" → "Đúng một phần", else "Không rõ"
        const result = partialCount >= 1 ? Answer.PARTIAL : Answer.UNKNOWN;

        console.log(`Results: ${result} (Partial: ${partialCount}, Unknown: ${totalUnknownCount})`);

        // Show results
        this.showResults(result, partialCount, totalUnknownCount);
    }

    /**
     * Show results for 10 seconds
     */
    private showResults(result: Answer, partialCount: number, unknownCount: number): void {
        this.state = GameState.RESULTS;
        this.countdown = RESULTS_COUNTDOWN;

        // Broadcast results
        const emitResults = () => {
            this.io.emit('state-update', {
                state: GameState.RESULTS,
                data: {
                    result,
                    counts: {
                        [Answer.PARTIAL]: partialCount,
                        [Answer.UNKNOWN]: unknownCount,
                    },
                    countdown: this.countdown,
                },
            });
        };

        emitResults();

        // Countdown timer
        this.countdownTimer = setInterval(() => {
            this.countdown--;

            if (this.countdown <= 0) {
                this.endRound();
            } else {
                emitResults();
            }
        }, 1000);
    }

    /**
     * End round and return to waiting state
     */
    private endRound(): void {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }

        this.state = GameState.WAITING;
        this.round = null;
        this.countdown = 0;

        console.log('Round ended, returning to WAITING state');

        // Broadcast waiting state
        this.io.emit('state-update', {
            state: GameState.WAITING,
        });
    }

    /**
     * Get state sync data for reconnecting player
     * @param player Player object
     */
    getStateSyncData(player: Player): any {
        const baseData = { state: this.state };

        switch (this.state) {
            case GameState.WAITING:
                return baseData;

            case GameState.VOTING:
                if (!this.round) return baseData;
                return {
                    ...baseData,
                    data: {
                        proposerName: this.round.proposerName,
                        voteCount: this.round.votes.size,
                        voterThreshold: this.round.voterThreshold,
                        hasVoted: this.round.voters.has(player.id),
                        userVote: this.round.playerVotes.get(player.id),
                        countdown: this.countdown,
                    },
                };

            case GameState.ANSWERING:
                if (!this.round) return baseData;
                return {
                    ...baseData,
                    data: {
                        proposerName: this.round.proposerName,
                        countdown: this.countdown,
                        answerCount: this.round.answers.size,
                        totalPlayers: this.round.voterThreshold - 1, // Exclude proposer
                        hasAnswered: this.round.answers.has(player.uuid),
                        answer: this.round.answers.get(player.uuid),
                        isProposer: player.uuid === this.round.proposerUuid,
                    },
                };

            case GameState.RESULTS:
                // Calculate counts from current round
                if (!this.round) return baseData;
                const answers = Array.from(this.round.answers.values());
                const partialCount = answers.filter(a => a === Answer.PARTIAL).length;
                const unknownCount = this.round.voterThreshold - partialCount;
                const result = partialCount >= 1 ? Answer.PARTIAL : Answer.UNKNOWN;

                return {
                    ...baseData,
                    data: {
                        result,
                        counts: {
                            [Answer.PARTIAL]: partialCount,
                            [Answer.UNKNOWN]: unknownCount,
                        },
                        countdown: this.countdown,
                    },
                };

            default:
                return baseData;
        }
    }

    /**
     * Check if player has already answered in current round
     */
    hasPlayerAnswered(playerUuid: string): boolean {
        return this.round?.answers.has(playerUuid) ?? false;
    }
}
