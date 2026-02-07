

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import LandingPage from './pages/LandingPage';
import ItemOne from './pages/ItemOne';
import LotteryAnalysis from './pages/Analysis';
import TemporalSequenceAnalyzer from './pages/AdAnalysis';
import ItemPut from './pages/ItemPut';
import Chart from './pages/Chat';
import LotteryDataAnalyzer from './pages/Claudeanal';
import Chanal from './pages/Chanal';
import CurriculumLearningPlatform from './pages/TestOnePage';
import PublicPredictions from './pages/PublicPredictions';
import AlgebraicBonds from './pages/AlgebraicBonds';
import GridPredictor from './pages/GridPredictor';
import ProfessionalChase from './pages/ProfessionalChase';
import ClusterSeedOriginsExporter from './components/ClusterSeedOriginsExporter';


function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/dashboard' element={<LandingPage />} />
          <Route path='/predictions' element={<PublicPredictions />} />
          <Route path='/algebraic' element={<AlgebraicBonds />} />
          <Route path='/grid-predictor' element={<GridPredictor />} />
          <Route path='/Chat' element={<Chart />} />
          <Route path='/Canal' element={<LotteryDataAnalyzer />} />
          <Route path='/chatai' element={<CurriculumLearningPlatform />} />
          <Route path='/Chanal' element={<Chanal />} />
          <Route path='/one/:dataset/:index/:id' element={<ItemOne />} />
          <Route path='/itemput' element={<ItemPut />} />
          <Route path='/analysis' element={<LotteryAnalysis />} />
          <Route path='/adanal' element={<TemporalSequenceAnalyzer />} />
          <Route path='/professional-chase' element={<ProfessionalChase />} />
          <Route path='/export-seeds' element={<ClusterSeedOriginsExporter />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
