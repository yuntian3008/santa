import { Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet';
import type { PlayerData } from '@/hooks/useSocket';

interface NavbarProps {
    playerCount: number;
    players: PlayerData[];
    currentPlayerName?: string;
}

export function Navbar({ playerCount, players, currentPlayerName }: NavbarProps) {
    return (
        <nav className="border-b bg-white">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-primary">Build for Lộc ❤️</h1>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Users className="h-4 w-4" />
                            <Badge variant="secondary">{playerCount}</Badge>
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Danh sách người chơi ({playerCount}/30)</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-2">
                            {players.map((player) => (
                                <div
                                    key={player.uuid}
                                    className={`px-3 py-2 rounded-md ${player.animalName === currentPlayerName
                                        ? 'bg-primary text-primary-foreground font-semibold'
                                        : 'bg-secondary'
                                        }`}
                                >
                                    {player.animalName}
                                </div>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}
