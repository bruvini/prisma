/**
 * Mapa de Residências — Modal de Gestão Estrutural (CRUD)
 */
import React from 'react';
import {
  Ala,
  AlaLabel,
  TipoResidencia,
  TipoResidenciaLabel,
  RegimeLabel,
} from './tipos';
import type { Residencia } from './tipos';

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  residencias: Residencia[];
  filtros: any;
  setFiltros: (f: any) => void;
  abrirModalNovo: () => void;
  abrirModalEdicao: (r: Residencia) => void;
  setAlvoExclusao: (r: Residencia | null) => void;
}

export const GestaoResidenciasModal: React.FC<Props> = ({
  aberto,
  aoFechar,
  residencias,
  filtros,
  setFiltros,
  abrirModalNovo,
  abrirModalEdicao,
  setAlvoExclusao,
}) => {
  if (!aberto) return null;

  // Filtragem local da tabela de gestão (apenas campos estruturais)
  const filtradas = residencias.filter(r => {
    if (filtros.ala            && r.ala !== filtros.ala) return false;
    if (filtros.pavilhao       && !r.pavilhao.toLowerCase().includes(filtros.pavilhao.toLowerCase())) return false;
    if (filtros.galeria        && !r.galeria.toLowerCase().includes(filtros.galeria.toLowerCase())) return false;
    if (filtros.tipoResidencia && r.tipoResidencia !== filtros.tipoResidencia) return false;
    return true;
  });

  return (
    <div className="mr-overlay" role="dialog" aria-modal="true">
      <div className="mr-modal mr-modal-management">
        <div className="mr-modal-header">
          <h2 className="mr-modal-title">Gestão Estrutural de Residências</h2>
          <button className="mr-modal-close" onClick={aoFechar} aria-label="Fechar">&times;</button>
        </div>

        <div className="mr-modal-form">
          <div className="mr-management-layout">

            {/* Controles: filtros + botão bem separados */}
            <div className="mr-management-controls">
              <div className="mr-management-filters">
                <select
                  className="mr-select mr-filter-select"
                  value={filtros.ala}
                  onChange={e => setFiltros((f: any) => ({ ...f, ala: e.target.value }))}
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
                  onChange={e => setFiltros((f: any) => ({ ...f, pavilhao: e.target.value }))}
                />

                <input
                  className="mr-input mr-filter-input"
                  placeholder="Galeria..."
                  value={filtros.galeria}
                  onChange={e => setFiltros((f: any) => ({ ...f, galeria: e.target.value }))}
                />

                <select
                  className="mr-select mr-filter-select"
                  value={filtros.tipoResidencia}
                  onChange={e => setFiltros((f: any) => ({ ...f, tipoResidencia: e.target.value }))}
                >
                  <option value="">Todos os Tipos</option>
                  {Object.values(TipoResidencia).map(v => (
                    <option key={v} value={v}>{TipoResidenciaLabel[v]}</option>
                  ))}
                </select>
              </div>

              <div className="mr-management-action">
                <button className="mr-btn mr-btn-primary" onClick={abrirModalNovo}>
                  + Nova Residência
                </button>
              </div>
            </div>

            <div className="mr-table-wrapper">
              <table className="mr-table">
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
                  {filtradas.map(r => (
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
                      <td className="mr-td-number">
                        <div className="mr-td-number-stack">
                          <strong>{r.numeroResidencia}</strong>
                          {r.cadastroProvisorio && (
                            <span className="mr-badge-mini mr-badge-provisoria">Provisória</span>
                          )}
                          {r.pendenteRevisao && !r.cadastroProvisorio && (
                            <span className="mr-badge-mini mr-badge-revisao">Pendente Revisão</span>
                          )}
                        </div>
                      </td>
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
                        >
                          Editar
                        </button>
                        <button
                          className="mr-btn mr-btn-danger mr-btn-sm"
                          onClick={() => setAlvoExclusao(r)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtradas.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: 'center',
                          padding: 'var(--spacing-10)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Nenhuma residência encontrada para os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mr-modal-footer">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {filtradas.length} {filtradas.length === 1 ? 'registro' : 'registros'}
          </span>
          <button className="mr-btn mr-btn-ghost" onClick={aoFechar}>Fechar Gestão</button>
        </div>
      </div>
    </div>
  );
};
