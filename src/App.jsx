
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import LandingPage from './pages/LandingPage';
import ItemOne from './pages/ItemOne';
import LotteryAnalysis from './pages/analysis';
import TemporalSequenceAnalyzer from './pages/AdAnalysis';
import ItemPut from './pages/ItemPut';
import Chart from './pages/Chat';
import LotteryDataAnalyzer from './pages/Claudeanal';
import Chanal from './pages/Chanal';
import CurriculumLearningPlatform from './pages/TestOnePage';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/Chat' element={<Chart />} />
          <Route path='/Canal' element={<LotteryDataAnalyzer />} />
          <Route path='/chatai' element={<CurriculumLearningPlatform />} />
          <Route path='/Chanal' element={<Chanal />} />
          <Route path='/one/:dataset/:index/:id' element={<ItemOne />} />
          <Route path='/itemput' element={<ItemPut />} />
          <Route path='/analysis' element={<LotteryAnalysis />} />
          <Route path='/adanal' element={<TemporalSequenceAnalyzer />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
