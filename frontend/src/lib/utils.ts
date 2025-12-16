import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const UUID_KEY = 'santa-game-uuid';

/**
 * Get UUID from localStorage or generate new one
 */
export function getOrCreateUUID(): string {
    let uuid = localStorage.getItem(UUID_KEY);

    if (!uuid) {
        uuid = uuidv4();
        localStorage.setItem(UUID_KEY, uuid);
    }

    return uuid;
}

/**
 * Update UUID in localStorage
 */
export function updateUUID(uuid: string): void {
    localStorage.setItem(UUID_KEY, uuid);
}
