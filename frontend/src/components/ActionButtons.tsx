import { useState } from 'react';
import { Button } from './ui/button';
import { X, Check } from 'lucide-react';
import { GameState, Answer } from '@/hooks/useSocket';

interface ActionButtonsProps {
    gameState: GameState;
    onProposeRound: (name: string) => void;
    onVote: (approve: boolean) => void;
    onSubmitAnswer: (answer: Answer) => void;
    hasVoted?: boolean;
    hasAnswered?: boolean;
    isProposer?: boolean;
}

export function ActionButtons({
    gameState,
    onProposeRound,
    onVote,
    onSubmitAnswer,
    hasVoted,
    hasAnswered,
    isProposer,
}: ActionButtonsProps) {
    const [showNameInput, setShowNameInput] = useState(false);
    const [proposerName, setProposerName] = useState('');
    const [myVote, setMyVote] = useState<boolean | null>(null);

    const handlePropose = () => {
        if (proposerName.trim()) {
            onProposeRound(proposerName.trim());
            setProposerName('');
            setShowNameInput(false);
        }
    };

    const handleVote = (approve: boolean) => {
        setMyVote(approve);
        onVote(approve);
    };

    // Reset vote when game state changes
    if (gameState !== GameState.VOTING && myVote !== null) {
        setMyVote(null);
    }

    return (
        <div className="border-t bg-white">
            <div className="container mx-auto px-4 py-6">
                {gameState === GameState.WAITING && (
                    <div className="max-w-md mx-auto">
                        {!showNameInput ? (
                            <Button
                                size="lg"
                                className="w-full h-16 text-lg rounded-2xl"
                                onClick={() => setShowNameInput(true)}
                            >
                                Giúp tôi tìm manh mối
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Nhập tên của bạn"
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={proposerName}
                                    onChange={(e) => setProposerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePropose()}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowNameInput(false);
                                            setProposerName('');
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handlePropose}
                                        disabled={!proposerName.trim()}
                                    >
                                        Đề xuất
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {gameState === GameState.VOTING && (
                    <div className="flex gap-4 max-w-md mx-auto">
                        <Button
                            size="lg"
                            variant={myVote === false ? "destructive" : "outline"}
                            className={`flex-1 h-20 rounded-2xl text-lg transition-all ${myVote === false
                                ? 'ring-2 ring-destructive ring-offset-2'
                                : myVote === true
                                    ? 'opacity-40'
                                    : ''
                                }`}
                            onClick={() => handleVote(false)}
                            disabled={hasVoted}
                        >
                            <X className="h-8 w-8" />
                            <span className="ml-2">Từ chối</span>
                        </Button>
                        <Button
                            size="lg"
                            variant={myVote === true ? "default" : "outline"}
                            className={`flex-1 h-20 rounded-2xl text-lg transition-all ${myVote === true
                                ? 'ring-2 ring-primary ring-offset-2'
                                : myVote === false
                                    ? 'opacity-40'
                                    : ''
                                }`}
                            onClick={() => handleVote(true)}
                            disabled={hasVoted}
                        >
                            <Check className="h-8 w-8" />
                            <span className="ml-2">Đồng ý</span>
                        </Button>
                    </div>
                )}

                {gameState === GameState.ANSWERING && (
                    <div className="flex flex-col gap-4 max-w-md mx-auto">
                        {isProposer ? (
                            <div className="text-center text-muted-foreground py-8">
                                <p className="text-lg font-semibold">Bạn là người đề xuất</p>
                                <p className="text-sm mt-2">Chỉ có thể xem, không được trả lời</p>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="flex-1 h-20 rounded-2xl text-lg"
                                    onClick={() => onSubmitAnswer(Answer.UNKNOWN)}
                                    disabled={hasAnswered}
                                >
                                    Không rõ
                                </Button>
                                <Button
                                    size="lg"
                                    className="flex-1 h-20 rounded-2xl text-lg"
                                    onClick={() => onSubmitAnswer(Answer.PARTIAL)}
                                    disabled={hasAnswered}
                                >
                                    Đúng một phần
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {gameState === GameState.RESULTS && (
                    <div className="text-center text-muted-foreground">
                        Đang hiển thị kết quả...
                    </div>
                )}
            </div>
        </div>
    );
}
