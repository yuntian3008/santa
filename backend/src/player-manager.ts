import { v4 as uuidv4 } from 'uuid';
import type { Player } from './types';

// 30 Vietnamese animal names
const ANIMAL_NAMES = [
    'Hổ', 'Sư tử', 'Voi', 'Gấu', 'Hươu',
    'Ngựa', 'Bò', 'Trâu', 'Gà', 'Vịt',
    'Chó', 'Mèo', 'Thỏ', 'Chuột', 'Khỉ',
    'Heo', 'Dê', 'Cừu', 'Sóc', 'Chồn',
    'Cáo', 'Chim', 'Đại bàng', 'Hải âu', 'Cú',
    'Bướm', 'Ong', 'Kiến', 'Rắn', 'Rùa',
];

const DISCONNECT_TIMEOUT = 60 * 1000; // 1 minute in milliseconds

export class PlayerManager {
    private players: Map<string, Player> = new Map(); // Socket ID -> Player
    private uuidToPlayer: Map<string, Player> = new Map(); // UUID -> Player
    private availableNames: Set<string> = new Set(ANIMAL_NAMES);
    private disconnectTimers: Map<string, NodeJS.Timeout> = new Map(); // UUID -> Timer

    /**
     * Add a new player or reconnect existing player
     * @param socketId Socket connection ID
     * @param uuid Optional UUID from localStorage
     * @returns Player object, null if rejected (>30 players), or 'duplicate' if duplicate connection
     */
    addPlayer(socketId: string, uuid?: string): Player | null | 'duplicate' {
        // Check if reconnecting with valid UUID
        if (uuid && this.uuidToPlayer.has(uuid)) {
            const existingPlayer = this.uuidToPlayer.get(uuid)!;

            // Check if old socket is still active - this is a duplicate connection
            if (this.players.has(existingPlayer.id)) {
                console.log(`Duplicate connection detected for UUID ${uuid} (socket ${socketId})`);
                return 'duplicate';
            }

            // Clear disconnect timer if exists
            if (this.disconnectTimers.has(uuid)) {
                clearTimeout(this.disconnectTimers.get(uuid)!);
                this.disconnectTimers.delete(uuid);
            }

            // Update player with new socket ID
            existingPlayer.id = socketId;
            existingPlayer.lastSeen = Date.now();

            // Update socket ID mapping
            this.players.set(socketId, existingPlayer);

            console.log(`Player reconnected: ${existingPlayer.animalName} (${uuid})`);
            return existingPlayer;
        }

        // New player - check capacity
        if (this.availableNames.size === 0) {
            console.log('Cannot add player: room is full (30/30)');
            return null;
        }

        // Assign random animal name from available pool
        const namesArray = Array.from(this.availableNames);
        const randomIndex = Math.floor(Math.random() * namesArray.length);
        const animalName = namesArray[randomIndex];
        this.availableNames.delete(animalName);

        // Create new player
        const newUuid = uuid || uuidv4();
        const player: Player = {
            id: socketId,
            uuid: newUuid,
            animalName,
            joinedAt: Date.now(),
            lastSeen: Date.now(),
        };

        this.players.set(socketId, player);
        this.uuidToPlayer.set(newUuid, player);

        console.log(`New player joined: ${animalName} (${newUuid})`);
        return player;
    }

    /**
     * Handle player disconnect - start timeout timer
     * @param socketId Socket connection ID
     */
    disconnectPlayer(socketId: string): void {
        const player = this.players.get(socketId);
        if (!player) return;

        // Remove socket ID mapping
        this.players.delete(socketId);

        // Start disconnect timer
        const timer = setTimeout(() => {
            this.removePlayer(player.uuid);
        }, DISCONNECT_TIMEOUT);

        this.disconnectTimers.set(player.uuid, timer);
        console.log(`Player disconnected: ${player.animalName}, will be removed in 1 minute`);
    }

    /**
     * Permanently remove player and return animal name to pool
     * @param uuid Player UUID
     */
    private removePlayer(uuid: string): void {
        const player = this.uuidToPlayer.get(uuid);
        if (!player) return;

        // Return animal name to pool
        this.availableNames.add(player.animalName);

        // Clean up mappings
        this.uuidToPlayer.delete(uuid);
        this.disconnectTimers.delete(uuid);

        console.log(`Player removed: ${player.animalName} (${uuid})`);
    }

    /**
     * Get player by socket ID
     */
    getPlayerBySocketId(socketId: string): Player | undefined {
        return this.players.get(socketId);
    }

    /**
     * Get player by UUID
     */
    getPlayerByUuid(uuid: string): Player | undefined {
        return this.uuidToPlayer.get(uuid);
    }

    /**
     * Get all active players
     */
    getAllPlayers(): Player[] {
        return Array.from(this.players.values());
    }

    /**
     * Get current player count
     */
    getPlayerCount(): number {
        return this.players.size;
    }

    /**
     * Get all player data for client (UUID + animal name)
     */
    getPlayersData(): Array<{ uuid: string; animalName: string }> {
        return Array.from(this.players.values()).map(p => ({
            uuid: p.uuid,
            animalName: p.animalName,
        }));
    }
}
