import { Card, CardContent } from './ui/card';
import {
    GameState,
    type VotingStateData,
    type AnsweringStateData,
    type ResultsStateData,
} from '@/hooks/useSocket';

interface GameScreenProps {
    playerName?: string;
    gameState: GameState;
    stateData: any;
}

export function GameScreen({ playerName, gameState, stateData }: GameScreenProps) {
    return (
        <div className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
            <Card className="w-full max-w-2xl">
                <CardContent className="p-8">
                    {gameState === GameState.WAITING && (
                        <WaitingState playerName={playerName} />
                    )}
                    {gameState === GameState.VOTING && (
                        <VotingState data={stateData as VotingStateData} />
                    )}
                    {gameState === GameState.ANSWERING && (
                        <AnsweringState data={stateData as AnsweringStateData} />
                    )}
                    {gameState === GameState.RESULTS && (
                        <ResultsState data={stateData as ResultsStateData} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function WaitingState({ playerName }: { playerName?: string }) {
    return (
        <div className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">
                Xin chào <span className="text-primary">{playerName || '...'}</span>
            </h2>
            <p className="text-muted-foreground">
                Nhấn nút bên dưới để bắt đầu lượt chơi
            </p>
        </div>
    );
}

function VotingState({ data }: { data: VotingStateData }) {
    if (!data) return null;

    return (
        <div className="text-center py-12">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Đề xuất từ</h2>
                <p className="text-3xl font-bold text-primary">{data.proposerName}</p>
            </div>
            {data.countdown !== undefined && (
                <div className={`text-5xl font-bold mb-4 ${data.countdown <= 3 ? 'text-red-600 animate-pulse' : 'text-muted-foreground'
                    }`}>
                    {data.countdown}s
                </div>
            )}
            <div className="text-lg">
                <p className="text-muted-foreground mb-2">Số phiếu đồng ý</p>
                <p className="text-4xl font-bold">
                    {data.voteCount} / {data.voterThreshold}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Cần {Math.ceil(data.voterThreshold / 2)} phiếu để bắt đầu
                </p>
            </div>
            {data.hasVoted && data.userVote !== undefined && (
                <div className={`mt-6 p-3 rounded-lg ${data.userVote
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                    }`}>
                    <p className={`text-sm font-semibold ${data.userVote ? 'text-green-700' : 'text-red-700'
                        }`}>
                        ✓ Bạn đã bỏ phiếu: {data.userVote ? 'Đồng ý' : 'Từ chối'}
                    </p>
                </div>
            )}
            {data.hasVoted && data.userVote === undefined && (
                <p className="mt-4 text-sm text-green-600 font-semibold">
                    ✓ Bạn đã bỏ phiếu
                </p>
            )}
        </div>
    );
}

function AnsweringState({ data }: { data: AnsweringStateData }) {
    if (!data) return null;

    return (
        <div className="text-center py-12">
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                    Câu hỏi:
                </h2>
                <p className="text-2xl font-bold leading-relaxed">
                    Bạn <span className="text-primary">{data.proposerName}</span> đã chọn đúng quà
                    hoặc người tặng quà đúng không?
                </p>
            </div>

            <div className="mb-6">
                <div className="text-6xl font-bold text-primary mb-2">
                    {data.countdown}s
                </div>
                <p className="text-muted-foreground">
                    {data.answerCount}/{data.totalPlayers} người đã trả lời
                </p>
            </div>

            {data.isProposer ? (
                <p className="text-sm text-muted-foreground font-semibold">
                    Bạn chỉ được xem thui
                </p>
            ) : data.hasAnswered && (
                <p className="text-sm text-green-600 font-semibold">
                    ✓ Câu trả lời của bạn: {data.answer}
                </p>
            )}
        </div>
    );
}

function ResultsState({ data }: { data: ResultsStateData }) {
    if (!data) return null;

    return (
        <div className="text-center py-12">
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                    Kết quả:
                </h2>
                <p className="text-4xl font-bold text-primary mb-6">{data.result}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                <div className="bg-secondary rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Đúng một phần</p>
                    <p className="text-3xl font-bold">{data.counts['Đúng một phần']}</p>
                </div>
                <div className="bg-secondary rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Không rõ</p>
                    <p className="text-3xl font-bold">{data.counts['Không rõ']}</p>
                </div>
            </div>

            <div className="text-2xl font-semibold text-muted-foreground">
                {data.countdown}s
            </div>
        </div>
    );
}
