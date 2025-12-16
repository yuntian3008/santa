import { Server } from 'socket.io';
import { PlayerManager } from './player-manager';
import { GameManager } from './game-manager';
import { Answer, type ConnectData, type ProposeRoundData, type VoteRoundData, type SubmitAnswerData } from './types';

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5174';

// Initialize Socket.io server
const io = new Server(Number(PORT), {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
    },
});

// Initialize managers
const playerManager = new PlayerManager();
const gameManager = new GameManager(io, playerManager);

console.log(`🎮 Santa Game Server starting...`);

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Extract UUID from handshake auth
    const uuid = socket.handshake.auth.uuid as string | undefined;

    // Add player
    const player = playerManager.addPlayer(socket.id, uuid);

    if (player === 'duplicate') {
        // Reject duplicate connection
        socket.emit('connection-rejected', { reason: 'Duplicate connection detected. Please close other tabs.' });
        socket.disconnect();
        console.log(`Connection rejected: duplicate UUID ${uuid}`);
        return;
    }

    if (!player) {
        // Reject connection if room is full
        socket.emit('connection-rejected', { reason: 'Room is full (30/30)' });
        socket.disconnect();
        console.log(`Connection rejected: room is full`);
        return;
    }

    // Send player data to client
    socket.emit('player-joined', {
        uuid: player.uuid,
        animalName: player.animalName,
        playerCount: playerManager.getPlayerCount(),
        players: playerManager.getPlayersData(),
    });

    // Broadcast to all clients about new player
    io.emit('player-count-update', {
        playerCount: playerManager.getPlayerCount(),
        players: playerManager.getPlayersData(),
    });

    // Send current game state for synchronization
    const stateSync = gameManager.getStateSyncData(player);
    socket.emit('state-sync', stateSync);

    console.log(`✅ Player joined: ${player.animalName} (${player.uuid}), Total: ${playerManager.getPlayerCount()}`);

    // Handle propose round
    socket.on('propose-round', (data: ProposeRoundData) => {
        const currentPlayer = playerManager.getPlayerBySocketId(socket.id);
        if (!currentPlayer) return;

        console.log(`📢 Round proposed by ${data.proposerName}`);
        gameManager.proposeRound(
            data.proposerName,
            socket.id,
            currentPlayer.uuid,
            playerManager.getPlayerCount()
        );
    });

    // Handle vote
    socket.on('vote-round', (data: VoteRoundData) => {
        const currentPlayer = playerManager.getPlayerBySocketId(socket.id);
        if (!currentPlayer) return;

        console.log(`🗳️  Vote from ${currentPlayer.animalName}: ${data.approve ? 'Yes' : 'No'}`);
        gameManager.vote(socket.id, data.approve);
    });

    // Handle answer submission
    socket.on('submit-answer', (data: SubmitAnswerData) => {
        const currentPlayer = playerManager.getPlayerBySocketId(socket.id);
        if (!currentPlayer) return;

        console.log(`💬 Answer from ${currentPlayer.animalName}: ${data.answer}`);
        gameManager.submitAnswer(currentPlayer.uuid, data.answer);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);

        const currentPlayer = playerManager.getPlayerBySocketId(socket.id);
        if (currentPlayer) {
            playerManager.disconnectPlayer(socket.id);

            // Broadcast updated player count
            io.emit('player-count-update', {
                playerCount: playerManager.getPlayerCount(),
                players: playerManager.getPlayersData(),
            });

            console.log(`👋 Player disconnected: ${currentPlayer.animalName}, Total: ${playerManager.getPlayerCount()}`);
        }
    });
});

// Server is already listening from the constructor
console.log(`✨ Server running on port ${PORT}`);
console.log(`🌐 CORS enabled for: ${CORS_ORIGIN}`);
