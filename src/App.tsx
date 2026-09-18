import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store/app'
import { Shell } from './components/Shell'
import { Welcome } from './screens/Welcome'
import { Survey } from './screens/Survey'
import { Diagnosis } from './screens/Diagnosis'
import { Matches } from './screens/Matches'
import { Compare } from './screens/Compare'
import { Roadmap } from './screens/Roadmap'
import { ProgramDetail } from './screens/ProgramDetail'

export default function App() {
  return (
    <AppProvider>
      {/* HashRouter: приложение раздаётся как статика на GitHub Pages без серверных правил. */}
      <HashRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/survey" element={<Survey />} />
            <Route path="/diagnosis" element={<Diagnosis />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/program/:id" element={<ProgramDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </HashRouter>
    </AppProvider>
  )
}
