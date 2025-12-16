import { Navbar } from './components/Navbar';
import { GameScreen } from './components/GameScreen';
import { ActionButtons } from './components/ActionButtons';
import { useSocket } from './hooks/useSocket';

function App() {
    const {
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
    } = useSocket();

    if (connectionRejected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-destructive mb-4">
                        Phòng chơi đã đầy
                    </h1>
                    <p className="text-muted-foreground">
                        Số lượng người chơi tối đa là 30. Vui lòng thử lại sau.
                    </p>
                </div>
            </div>
        );
    }

    if (!connected || !playerData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Đang kết nối...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar
                playerCount={playerCount}
                players={players}
                currentPlayerName={playerData.animalName}
            />
            <GameScreen
                playerName={playerData.animalName}
                gameState={gameState}
                stateData={stateData}
            />
            <ActionButtons
                gameState={gameState}
                onProposeRound={proposeRound}
                onVote={vote}
                onSubmitAnswer={submitAnswer}
                hasVoted={stateData?.hasVoted}
                hasAnswered={stateData?.hasAnswered}
                isProposer={stateData?.isProposer}
            />
        </div>
    );
}

export default App;
