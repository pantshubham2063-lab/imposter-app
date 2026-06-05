import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { GameProvider, useGame } from '../context/GameContext';
import { SplashView } from '../views/SplashView';
import { OnboardingView } from '../views/OnboardingView';
import { AuthView } from '../views/AuthView';
import { HomeView } from '../views/HomeView';
import { CategorySelectionView } from '../views/CategorySelectionView';
import { LobbyView } from '../views/LobbyView';
import { GameplayView } from '../views/GameplayView';
import { ProfileSettingsView } from '../views/ProfileSettingsView';
import { LocalSetupView } from '../views/LocalSetupView';
import { LocalGameplayView } from '../views/LocalGameplayView';
import { MultiplayerSetupView } from '../views/MultiplayerSetupView';

function GameContent() {
  const { currentScreen, setScreen } = useGame();

  switch (currentScreen) {
    case 'splash':
      return <SplashView onFinished={() => setScreen('onboarding')} />;
    case 'onboarding':
      return <OnboardingView onFinished={() => setScreen('auth')} />;
    case 'auth':
      return <AuthView />;
    case 'home':
      return <HomeView />;
    case 'categorySetup':
      return <CategorySelectionView />;
    case 'localSetup':
      return <LocalSetupView />;
    case 'localGameplay':
      return <LocalGameplayView />;
    case 'multiplayerSetup':
      return <MultiplayerSetupView />;
    case 'lobby':
      return <LobbyView />;
    case 'gameplay':
      return <GameplayView />;
    case 'profile':
      return <ProfileSettingsView />;
    default:
      return <SplashView onFinished={() => setScreen('onboarding')} />;
  }
}

export default function HomeScreen() {
  return (
    <GameProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#080B11" />
        <GameContent />
      </View>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B11',
  },
});
