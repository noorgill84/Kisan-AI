import { LanguageProvider } from '@/context/LanguageContext';
import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { HomePage } from '@/pages/HomePage';
import { DiagnosisPage } from '@/pages/DiagnosisPage';
import { ProcessingPage } from '@/pages/ProcessingPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { AboutPage } from '@/pages/AboutPage';
import { WeatherPage } from '@/pages/WeatherPage';

function PageRouter() {
  const { page } = useApp();

  switch (page) {
    case 'home':
      return <HomePage />;
    case 'diagnosis':
      return <DiagnosisPage />;
    case 'processing':
      return <ProcessingPage />;
    case 'results':
      return <ResultsPage />;
    case 'history':
      return <HistoryPage />;
    case 'weather':
      return <WeatherPage />;
    case 'about':
      return <AboutPage />;
    default:
      return <HomePage />;
  }
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <main className="flex-1">
        <PageRouter />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </LanguageProvider>
  );
}

export default App;
