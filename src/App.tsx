import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './guards/AuthGuard';
import { Login } from './pages/Login';
import { Home } from './pages/Home';

import { Placeholder } from './components/ui/Placeholder';

const Triagem = () => <Placeholder title="Módulo de Triagem" description="Ambiente de entrada e evolução clínica primária." />;
const Farmacia = () => <Placeholder title="Módulo de Farmácia" description="Gestão de controle de estoque e medicamentos estruturada sob protocolos SUS." />;
const Psicologia = () => <Placeholder title="Módulo de Psicologia" description="Atendimentos evolutivos, documentação mental e proteção LGPD." />;
const Vacinacao = () => <Placeholder title="Módulo de Vacinação" description="Controle de caderneta, datas, lotes e histórico vacinal." />;
const Indicadores = () => <Placeholder title="Módulo de Indicadores" description="Painel gerencial de produtividade, taxa de ocupação e metas de financiamento." />;
const MapaCelas = () => <Placeholder title="Módulo de Mapa de Celas" description="Localização e ocupação de salas de contenção atreladas ao prontuário." />;
const GestaoUsuarios = () => <Placeholder title="Módulo de Gestão de Usuários" description="Controle de acessos, revogação e atribuição de permissões no sistema." />;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              <Route path="/inicio" element={<Home />} />
              <Route path="triagem" element={<Triagem />} />
              <Route path="farmacia" element={<Farmacia />} />
              <Route path="psicologia" element={<Psicologia />} />
              <Route path="vacinacao" element={<Vacinacao />} />
              <Route path="indicadores" element={<Indicadores />} />
              <Route path="mapa-celas" element={<MapaCelas />} />
              <Route path="usuarios" element={<GestaoUsuarios />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
