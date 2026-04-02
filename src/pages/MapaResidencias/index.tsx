/**
 * Mapa de Residências — Módulo Principal (Português)
 * CRUD completo de Estrutura Física com terminologia PRISMA.
 *
 * Mapeamento de equivalência PRISMA x IPEN:
 * - Pavilhão (PRISMA) = Galeria (IPEN)
 * - Galeria (PRISMA) = Bloco (IPEN)
 */
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  buscarResidencias,
  cadastrarResidencia,
  atualizarResidencia,
  inativarResidencia,
} from './servicoResidencias';
import {
  Ala,
  AlaLabel,
  TipoResidencia,
  TipoResidenciaLabel,
  Regime,
  RegimeLabel,
} from './tipos';
import type { Residencia, FormDataResidencia } from './tipos';
import { SincronizadorIpen } from './SincronizadorIpen';
import './MapaResidencias.css';

// ---------------------------------------------------------------------------
// Configuração Inicial
// ---------------------------------------------------------------------------

const FORMULARIO_VAZIO: FormDataResidencia = {
  ala: Ala.MASCULINA,
  pavilhao: '',
  galeria: '',
  piso: '',
  tipoResidencia: TipoResidencia.CELA,
  numeroResidencia: '',
  capacidade: 0,
  regime: Regime.NAO_INFORMADO,
};

// ---------------------------------------------------------------------------
// Validações
// ---------------------------------------------------------------------------

function validarFormulario(dados: FormDataResidencia): Record<string, string> {
  const erros: Record<string, string> = {};
  if (!dados.pavilhao.trim()) erros.pavilhao = 'Pavilhão é obrigatório.';
  if (!dados.galeria.trim()) erros.galeria = 'Galeria é obrigatória.';
  if (!dados.piso.trim()) erros.piso = 'Piso é obrigatório.';
  if (!dados.numeroResidencia.trim()) erros.numeroResidencia = 'Número da residência é obrigatório.';
  if (dados.capacidade < 0 || isNaN(dados.capacidade))
    erros.capacidade = 'Capacidade deve ser zero ou maior.';
  return erros;
}

// ---------------------------------------------------------------------------
// Componentes Utilitários
// ---------------------------------------------------------------------------

const CampoForm: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="mr-field">
    <label className="mr-label">{label}</label>
    {children}
    {error && <span className="mr-error">{error}</span>}
  </div>
);

// ---------------------------------------------------------------------------
// Estado de Filtros
// ---------------------------------------------------------------------------

interface EstadoFiltros {
  ala: string;
  pavilhao: string;
  galeria: string;
  piso: string;
  tipoResidencia: string;
  regime: string;
}

const FILTROS_VAZIOS: EstadoFiltros = {
  ala: '',
  pavilhao: '',
  galeria: '',
  piso: '',
  tipoResidencia: '',
  regime: '',
};

// ---------------------------------------------------------------------------
// Página Mapa de Residências
// ---------------------------------------------------------------------------

export const MapaResidencias: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [residencias, setResidencias] = useState<Residencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState<EstadoFiltros>(FILTROS_VAZIOS);

  // Estados de Modal (Cadastro/Edição)
  const [modalAberto, setModalAberto] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormDataResidencia>(FORMULARIO_VAZIO);
  const [errosForm, setErrosForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  // Estados de Exclusão
  const [alvoExclusao, setAlvoExclusao] = useState<Residencia | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Estado de Sincronização
  const [sincronizadorAberto, setSincronizadorAberto] = useState(false);

  // ---------------------------------------------------------------------------
  // Busca de Dados
  // ---------------------------------------------------------------------------

  const carregarResidencias = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await buscarResidencias();
      setResidencias(dados);
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao carregar mapa de residências.', 'error');
    } finally {
      setCarregando(false);
    }
  }, [addToast]);

  useEffect(() => {
    carregarResidencias();
  }, [carregarResidencias]);

  // ---------------------------------------------------------------------------
  // Lógica de Filtros
  // ---------------------------------------------------------------------------

  const residenciasFiltradas = residencias.filter(r => {
    if (filtros.ala && r.ala !== filtros.ala) return false;
    if (filtros.pavilhao && !r.pavilhao.toLowerCase().includes(filtros.pavilhao.toLowerCase())) return false;
    if (filtros.galeria && !r.galeria.toLowerCase().includes(filtros.galeria.toLowerCase())) return false;
    if (filtros.piso && !r.piso.toLowerCase().includes(filtros.piso.toLowerCase())) return false;
    if (filtros.tipoResidencia && r.tipoResidencia !== filtros.tipoResidencia) return false;
    if (filtros.regime && r.regime !== filtros.regime) return false;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Ações do Modal
  // ---------------------------------------------------------------------------

  function abrirModalNovo() {
    setFormulario(FORMULARIO_VAZIO);
    setErrosForm({});
    setIdEdicao(null);
    setModalAberto(true);
  }

  function abrirModalEdicao(r: Residencia) {
    setFormulario({
      ala: r.ala,
      pavilhao: r.pavilhao,
      galeria: r.galeria,
      piso: r.piso,
      tipoResidencia: r.tipoResidencia,
      numeroResidencia: r.numeroResidencia,
      capacidade: r.capacidade,
      regime: r.regime,
    });
    setErrosForm({});
    setIdEdicao(r.id);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setIdEdicao(null);
    setErrosForm({});
    setSalvando(false);
  }

  // ---------------------------------------------------------------------------
  // Operações de Salvamento
  // ---------------------------------------------------------------------------

  async function manipularSubmissao(e: React.FormEvent) {
    e.preventDefault();
    const erros = validarFormulario(formulario);
    if (Object.keys(erros).length > 0) {
      setErrosForm(erros);
      return;
    }

    setSalvando(true);
    try {
      const uid = user?.uid || 'desconhecido';
      
      if (idEdicao) {
        await atualizarResidencia(idEdicao, formulario, uid);
        addToast('Residência atualizada com sucesso.', 'success');
      } else {
        await cadastrarResidencia(formulario, uid);
        addToast('Residência cadastrada com sucesso.', 'success');
      }
      
      setModalAberto(false);
      await carregarResidencias();
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao processar residência.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Operações de Exclusão
  // ---------------------------------------------------------------------------

  async function confirmarExclusao() {
    if (!alvoExclusao) return;
    setExcluindo(true);
    try {
      const uid = user?.uid || 'desconhecido';
      await inativarResidencia(alvoExclusao.id, uid);
      addToast('Residência excluída (inativada) com sucesso.', 'success');
      setAlvoExclusao(null);
      await carregarResidencias();
    } catch (erro: any) {
      addToast(erro.message || 'Erro ao excluir registro.', 'error');
    } finally {
      setExcluindo(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Renderização de Filtros
  // ---------------------------------------------------------------------------

  function renderizarFiltros() {
    return (
      <div className="mr-filters">
        <select
          className="mr-select mr-filter-select"
          value={filtros.ala}
          onChange={e => setFiltros(f => ({ ...f, ala: e.target.value }))}
          aria-label="Filtrar por Ala"
        >
          <option value="">Todas as Alas</option>
          {Object.values(Ala).map(v => (
            <option key={v} value={v}>{AlaLabel[v]}</option>
          ))}
        </select>

        <input
          className="mr-input mr-filter-input"
          placeholder="Pavilhão..."
          value={filtros.pavilhao}
          onChange={e => setFiltros(f => ({ ...f, pavilhao: e.target.value }))}
          aria-label="Filtrar por Pavilhão"
        />

        <input
          className="mr-input mr-filter-input"
          placeholder="Galeria..."
          value={filtros.galeria}
          onChange={e => setFiltros(f => ({ ...f, galeria: e.target.value }))}
          aria-label="Filtrar por Galeria"
        />

        <input
          className="mr-input mr-filter-input"
          placeholder="Piso..."
          value={filtros.piso}
          onChange={e => setFiltros(f => ({ ...f, piso: e.target.value }))}
          aria-label="Filtrar por Piso"
        />

        <select
          className="mr-select mr-filter-select"
          value={filtros.tipoResidencia}
          onChange={e => setFiltros(f => ({ ...f, tipoResidencia: e.target.value }))}
          aria-label="Filtrar por Tipo"
        >
          <option value="">Todos os Tipos</option>
          {Object.values(TipoResidencia).map(v => (
            <option key={v} value={v}>{TipoResidenciaLabel[v]}</option>
          ))}
        </select>

        <select
          className="mr-select mr-filter-select"
          value={filtros.regime}
          onChange={e => setFiltros(f => ({ ...f, regime: e.target.value }))}
          aria-label="Filtrar por Regime"
        >
          <option value="">Todos os Regimes</option>
          {Object.values(Regime).map(v => (
            <option key={v} value={v}>{RegimeLabel[v]}</option>
          ))}
        </select>

        {Object.values(filtros).some(Boolean) && (
          <button
            className="mr-btn mr-btn-ghost mr-btn-sm"
            onClick={() => setFiltros(FILTROS_VAZIOS)}
            title="Limpar todos os filtros"
          >
            Limpar Filtros
          </button>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Renderização de Tabela
  // ---------------------------------------------------------------------------

  function renderizarTabela() {
    if (carregando) {
      return (
        <div className="mr-loading-state">
          <span className="mr-spinner" />
          <p>Carregando mapa de residências...</p>
        </div>
      );
    }

    if (residenciasFiltradas.length === 0) {
      return (
        <div className="mr-empty-state">
          <p>{residencias.length === 0 ? 'Nenhuma residência cadastrada.' : 'Nenhum resultado para os filtros aplicados.'}</p>
        </div>
      );
    }

    return (
      <div className="mr-table-wrapper">
        <table className="mr-table" role="grid">
          <thead>
            <tr>
              <th>Ala</th>
              <th>Pavilhão</th>
              <th>Galeria</th>
              <th>Piso</th>
              <th>Tipo</th>
              <th>Residência</th>
              <th className="mr-th-center">Capacidade</th>
              <th>Regime</th>
              <th className="mr-th-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {residenciasFiltradas.map(r => (
              <tr key={r.id} className="mr-row">
                <td>
                  <span className={`mr-badge mr-badge-ala-${r.ala.toLowerCase()}`}>
                    {AlaLabel[r.ala]}
                  </span>
                </td>
                <td>{r.pavilhao}</td>
                <td>{r.galeria}</td>
                <td>{r.piso}</td>
                <td>
                  <span className="mr-badge mr-badge-tipo">
                    {TipoResidenciaLabel[r.tipoResidencia]}
                  </span>
                </td>
                <td className="mr-td-number">{r.numeroResidencia}</td>
                <td className="mr-th-center">{r.capacidade}</td>
                <td>
                  <span className={`mr-badge mr-badge-regime-${r.regime.toLowerCase()}`}>
                    {RegimeLabel[r.regime]}
                  </span>
                </td>
                <td className="mr-td-actions">
                  <button
                    className="mr-btn mr-btn-ghost mr-btn-sm"
                    onClick={() => abrirModalEdicao(r)}
                    aria-label="Editar"
                  >
                    Editar
                  </button>
                  <button
                    className="mr-btn mr-btn-danger mr-btn-sm"
                    onClick={() => setAlvoExclusao(r)}
                    aria-label="Excluir"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Renderização de Modal
  // ---------------------------------------------------------------------------

  function renderizarModal() {
    if (!modalAberto) return null;
    return (
      <div className="mr-overlay" role="dialog" aria-modal="true">
        <div className="mr-modal">
          <div className="mr-modal-header">
            <h2 className="mr-modal-title">{idEdicao ? 'Editar Residência' : 'Cadastrar Residência'}</h2>
            <button className="mr-modal-close" onClick={fecharModal} aria-label="Fechar" disabled={salvando}>&times;</button>
          </div>

          <form className="mr-modal-form" onSubmit={manipularSubmissao} noValidate>
            <div className="mr-form-grid">
              
              <CampoForm label="Ala *" error={errosForm.ala}>
                <select
                  className="mr-select"
                  value={formulario.ala}
                  onChange={e => setFormulario(f => ({ ...f, ala: e.target.value as Ala }))}
                  required
                >
                  {Object.values(Ala).map(v => (
                    <option key={v} value={v}>{AlaLabel[v]}</option>
                  ))}
                </select>
              </CampoForm>

              <CampoForm label="Pavilhão (Galeria IPEN) *" error={errosForm.pavilhao}>
                <input
                  className={`mr-input ${errosForm.pavilhao ? 'mr-input-error' : ''}`}
                  value={formulario.pavilhao}
                  onChange={e => setFormulario(f => ({ ...f, pavilhao: e.target.value }))}
                  placeholder="Ex.: A, B, C1"
                  maxLength={20}
                />
              </CampoForm>

              <CampoForm label="Galeria (Bloco IPEN) *" error={errosForm.galeria}>
                <input
                  className={`mr-input ${errosForm.galeria ? 'mr-input-error' : ''}`}
                  value={formulario.galeria}
                  onChange={e => setFormulario(f => ({ ...f, galeria: e.target.value }))}
                  placeholder="Ex.: 01, Norte"
                  maxLength={20}
                />
              </CampoForm>

              <CampoForm label="Piso *" error={errosForm.piso}>
                <input
                  className={`mr-input ${errosForm.piso ? 'mr-input-error' : ''}`}
                  value={formulario.piso}
                  onChange={e => setFormulario(f => ({ ...f, piso: e.target.value }))}
                  placeholder="Ex.: T, 1, 2"
                  maxLength={10}
                />
              </CampoForm>

              <CampoForm label="Tipo de Residência *" error={errosForm.tipoResidencia}>
                <select
                  className="mr-select"
                  value={formulario.tipoResidencia}
                  onChange={e => setFormulario(f => ({ ...f, tipoResidencia: e.target.value as TipoResidencia }))}
                  required
                >
                  {Object.values(TipoResidencia).map(v => (
                    <option key={v} value={v}>{TipoResidenciaLabel[v]}</option>
                  ))}
                </select>
              </CampoForm>

              <CampoForm label="Número da Residência *" error={errosForm.numeroResidencia}>
                <input
                  className={`mr-input ${errosForm.numeroResidencia ? 'mr-input-error' : ''}`}
                  value={formulario.numeroResidencia}
                  onChange={e => setFormulario(f => ({ ...f, numeroResidencia: e.target.value }))}
                  placeholder="Ex.: 01, A05"
                  maxLength={10}
                />
              </CampoForm>

              <CampoForm label="Capacidade *" error={errosForm.capacidade}>
                <input
                  className={`mr-input ${errosForm.capacidade ? 'mr-input-error' : ''}`}
                  type="number"
                  min={0}
                  value={formulario.capacidade}
                  onChange={e => setFormulario(f => ({ ...f, capacidade: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="0"
                />
              </CampoForm>

              <CampoForm label="Regime *" error={errosForm.regime}>
                <select
                  className="mr-select"
                  value={formulario.regime}
                  onChange={e => setFormulario(f => ({ ...f, regime: e.target.value as Regime }))}
                  required
                >
                  {Object.values(Regime).map(v => (
                    <option key={v} value={v}>{RegimeLabel[v]}</option>
                  ))}
                </select>
              </CampoForm>

            </div>

            <div className="mr-modal-footer">
              <button type="button" className="mr-btn mr-btn-ghost" onClick={fecharModal} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="mr-btn mr-btn-primary" disabled={salvando}>
                {salvando ? <span className="mr-spinner-sm" /> : null}
                {salvando ? 'Salvando...' : idEdicao ? 'Salvar Alterações' : 'Cadastrar Residência'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Renderização de Confirmação de Exclusão
  // ---------------------------------------------------------------------------

  function renderizarModalExclusao() {
    if (!alvoExclusao) return null;
    return (
      <div className="mr-overlay" role="dialog" aria-modal="true">
        <div className="mr-modal mr-modal-sm">
          <div className="mr-modal-header">
            <h2 className="mr-modal-title">Confirmar Exclusão</h2>
            <button className="mr-modal-close" onClick={() => setAlvoExclusao(null)} disabled={excluindo}>&times;</button>
          </div>
          <div className="mr-delete-body">
            <p>Deseja excluir a residência <strong>{alvoExclusao.rotuloExibicao}</strong>?</p>
            <p className="mr-delete-hint">O registro será inativado para manter o histórico de auditoria.</p>
          </div>
          <div className="mr-modal-footer">
            <button className="mr-btn mr-btn-ghost" onClick={() => setAlvoExclusao(null)} disabled={excluindo}>
              Cancelar
            </button>
            <button className="mr-btn mr-btn-danger" onClick={confirmarExclusao} disabled={excluindo}>
              {excluindo ? <span className="mr-spinner-sm" /> : null}
              {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Renderização Base
  // ---------------------------------------------------------------------------

  return (
    <div className="mr-page">
      <div className="mr-page-header">
        <div className="mr-page-header-text">
          <h1 className="mr-page-title">Mapa de Residências</h1>
          <p className="mr-page-subtitle">
            Gestão da estrutura física e alocação operacional.
            {!carregando && (
              <span className="mr-count">
                {' '}({residenciasFiltradas.length} {residenciasFiltradas.length === 1 ? 'registro' : 'registros'})
              </span>
            )}
          </p>
        </div>
        <div className="mr-page-actions">
          {(user?.email === 'admin@prisma.com' || user?.email === 'admin@google.com') && (
            <button 
              className="mr-btn mr-btn-ghost" 
              onClick={() => setSincronizadorAberto(true)}
              title="Sincronizar relatório de alocados do I-PEN"
            >
              Sincronizar I-PEN
            </button>
          )}
          <button className="mr-btn mr-btn-primary" onClick={abrirModalNovo} id="btn-nova-residencia">
            + Nova Residência
          </button>
        </div>
      </div>

      {renderizarFiltros()}
      {renderizarTabela()}
      {renderizarModal()}
      {renderizarModalExclusao()}
      
      <SincronizadorIpen 
        aberto={sincronizadorAberto}
        aoFechar={() => setSincronizadorAberto(false)}
        aoConcluir={carregarResidencias}
      />
    </div>
  );
};
