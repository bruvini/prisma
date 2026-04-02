/**
 * Mapa de Residências — Página principal
 * CRUD completo com Firestore, modal centralizado e Toast feedback.
 */
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  fetchResidences,
  createResidence,
  updateResidence,
  inactivateResidence,
} from './residenciasService';
import {
  Ala,
  AlaLabel,
  TipoResidencia,
  TipoResidenciaLabel,
  Regime,
  RegimeLabel,
} from './types';
import type { Residence, ResidenceFormData } from './types';
import './MapaResidencias.css';

// ---------------------------------------------------------------------------
// Valores iniciais do formulário
// ---------------------------------------------------------------------------

const EMPTY_FORM: ResidenceFormData = {
  ala: Ala.MASCULINA,
  pavilion: '',
  gallery: '',
  floor: '',
  residenceType: TipoResidencia.CELA,
  residenceNumber: '',
  capacity: 0,
  regime: Regime.NAO_INFORMADO,
};

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

function validate(form: ResidenceFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.pavilion.trim()) errors.pavilion = 'Pavilhão é obrigatório.';
  if (!form.gallery.trim()) errors.gallery = 'Galeria é obrigatória.';
  if (!form.floor.trim()) errors.floor = 'Piso é obrigatório.';
  if (!form.residenceNumber.trim()) errors.residenceNumber = 'Número da Residência é obrigatório.';
  if (form.capacity < 0 || isNaN(form.capacity))
    errors.capacity = 'Capacidade deve ser um número não negativo.';
  return errors;
}

// ---------------------------------------------------------------------------
// Sub-componente: Select acessível
// ---------------------------------------------------------------------------

const Field: React.FC<{
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
// Sub-componente: Filtros
// ---------------------------------------------------------------------------

interface FiltersState {
  ala: string;
  pavilion: string;
  gallery: string;
  floor: string;
  residenceType: string;
  regime: string;
}

const EMPTY_FILTERS: FiltersState = {
  ala: '',
  pavilion: '',
  gallery: '',
  floor: '',
  residenceType: '',
  regime: '',
};

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export const MapaResidencias: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResidenceFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState<Residence | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Leitura
  // ---------------------------------------------------------------------------

  const loadResidences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchResidences();
      setResidences(data);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar residências. Verifique a conexão.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadResidences();
  }, [loadResidences]);

  // ---------------------------------------------------------------------------
  // Filtros
  // ---------------------------------------------------------------------------

  const filtered = residences.filter(r => {
    if (filters.ala && r.ala !== filters.ala) return false;
    if (filters.pavilion && !r.pavilion.toLowerCase().includes(filters.pavilion.toLowerCase())) return false;
    if (filters.gallery && !r.gallery.toLowerCase().includes(filters.gallery.toLowerCase())) return false;
    if (filters.floor && !r.floor.toLowerCase().includes(filters.floor.toLowerCase())) return false;
    if (filters.residenceType && r.residenceType !== filters.residenceType) return false;
    if (filters.regime && r.regime !== filters.regime) return false;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Modal helpers
  // ---------------------------------------------------------------------------

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setIsModalOpen(true);
  }

  function openEdit(r: Residence) {
    setForm({
      ala: r.ala,
      pavilion: r.pavilion,
      gallery: r.gallery,
      floor: r.floor,
      residenceType: r.residenceType,
      residenceNumber: r.residenceNumber,
      capacity: r.capacity,
      regime: r.regime,
    });
    setFormErrors({});
    setEditingId(r.id);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormErrors({});
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const uid = user?.uid ?? 'unknown';
      if (editingId) {
        await updateResidence(editingId, form, uid);
        addToast('Residência atualizada com sucesso.', 'success');
      } else {
        await createResidence(form, uid);
        addToast('Residência cadastrada com sucesso.', 'success');
      }
      closeModal();
      await loadResidences();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const uid = user?.uid ?? 'unknown';
      await inactivateResidence(deleteTarget.id, uid);
      addToast('Residência excluída com sucesso.', 'success');
      setDeleteTarget(null);
      await loadResidences();
    } catch {
      addToast('Erro ao excluir residência. Tente novamente.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render — Filtros
  // ---------------------------------------------------------------------------

  function renderFilters() {
    return (
      <div className="mr-filters">
        <select
          className="mr-select mr-filter-select"
          value={filters.ala}
          onChange={e => setFilters(f => ({ ...f, ala: e.target.value }))}
          aria-label="Filtrar por ala"
        >
          <option value="">Todas as Alas</option>
          {Object.values(Ala).map(v => (
            <option key={v} value={v}>{AlaLabel[v]}</option>
          ))}
        </select>

        <input
          className="mr-input mr-filter-input"
          placeholder="Pavilhão..."
          value={filters.pavilion}
          onChange={e => setFilters(f => ({ ...f, pavilion: e.target.value }))}
          aria-label="Filtrar por pavilhão"
        />

        <input
          className="mr-input mr-filter-input"
          placeholder="Galeria..."
          value={filters.gallery}
          onChange={e => setFilters(f => ({ ...f, gallery: e.target.value }))}
          aria-label="Filtrar por galeria"
        />

        <input
          className="mr-input mr-filter-input"
          placeholder="Piso..."
          value={filters.floor}
          onChange={e => setFilters(f => ({ ...f, floor: e.target.value }))}
          aria-label="Filtrar por piso"
        />

        <select
          className="mr-select mr-filter-select"
          value={filters.residenceType}
          onChange={e => setFilters(f => ({ ...f, residenceType: e.target.value }))}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os Tipos</option>
          {Object.values(TipoResidencia).map(v => (
            <option key={v} value={v}>{TipoResidenciaLabel[v]}</option>
          ))}
        </select>

        <select
          className="mr-select mr-filter-select"
          value={filters.regime}
          onChange={e => setFilters(f => ({ ...f, regime: e.target.value }))}
          aria-label="Filtrar por regime"
        >
          <option value="">Todos os Regimes</option>
          {Object.values(Regime).map(v => (
            <option key={v} value={v}>{RegimeLabel[v]}</option>
          ))}
        </select>

        {Object.values(filters).some(Boolean) && (
          <button
            className="mr-btn mr-btn-ghost mr-btn-sm"
            onClick={() => setFilters(EMPTY_FILTERS)}
            title="Limpar filtros"
          >
            Limpar filtros
          </button>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — Tabela
  // ---------------------------------------------------------------------------

  function renderTable() {
    if (loading) {
      return (
        <div className="mr-loading-state">
          <span className="mr-spinner" />
          <p>Carregando residências...</p>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="mr-empty-state">
          <p>{residences.length === 0 ? 'Nenhuma residência cadastrada ainda.' : 'Nenhuma residência corresponde aos filtros aplicados.'}</p>
        </div>
      );
    }

    return (
      <div className="mr-table-wrapper">
        <table className="mr-table" role="table" aria-label="Lista de residências">
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
            {filtered.map(r => (
              <tr key={r.id} className="mr-row">
                <td>
                  <span className={`mr-badge mr-badge-ala-${r.ala.toLowerCase()}`}>
                    {AlaLabel[r.ala]}
                  </span>
                </td>
                <td>{r.pavilion}</td>
                <td>{r.gallery}</td>
                <td>{r.floor}</td>
                <td>
                  <span className="mr-badge mr-badge-tipo">
                    {TipoResidenciaLabel[r.residenceType]}
                  </span>
                </td>
                <td className="mr-td-number">{r.residenceNumber}</td>
                <td className="mr-th-center">{r.capacity}</td>
                <td>
                  <span className={`mr-badge mr-badge-regime-${r.regime.toLowerCase()}`}>
                    {RegimeLabel[r.regime]}
                  </span>
                </td>
                <td className="mr-td-actions">
                  <button
                    className="mr-btn mr-btn-ghost mr-btn-sm"
                    onClick={() => openEdit(r)}
                    aria-label={`Editar residência ${r.residenceNumber}`}
                  >
                    Editar
                  </button>
                  <button
                    className="mr-btn mr-btn-danger mr-btn-sm"
                    onClick={() => setDeleteTarget(r)}
                    aria-label={`Excluir residência ${r.residenceNumber}`}
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
  // Render — Modal de criação/edição
  // ---------------------------------------------------------------------------

  function renderModal() {
    if (!isModalOpen) return null;
    return (
      <div className="mr-overlay" role="dialog" aria-modal="true" aria-label={editingId ? 'Editar Residência' : 'Nova Residência'}>
        <div className="mr-modal">
          <div className="mr-modal-header">
            <h2 className="mr-modal-title">{editingId ? 'Editar Residência' : 'Nova Residência'}</h2>
            <button className="mr-modal-close" onClick={closeModal} aria-label="Fechar modal">&times;</button>
          </div>

          <form className="mr-modal-form" onSubmit={handleSubmit} noValidate>
            <div className="mr-form-grid">

              {/* Ala */}
              <Field label="Ala *" error={formErrors.ala}>
                <select
                  id="mr-f-ala"
                  className="mr-select"
                  value={form.ala}
                  onChange={e => setForm(f => ({ ...f, ala: e.target.value as Ala }))}
                  required
                >
                  {Object.values(Ala).map(v => (
                    <option key={v} value={v}>{AlaLabel[v]}</option>
                  ))}
                </select>
              </Field>

              {/* Pavilhão */}
              <Field label="Pavilhão *" error={formErrors.pavilion}>
                <input
                  id="mr-f-pavilion"
                  className={`mr-input ${formErrors.pavilion ? 'mr-input-error' : ''}`}
                  value={form.pavilion}
                  onChange={e => setForm(f => ({ ...f, pavilion: e.target.value }))}
                  placeholder="Ex.: A, B, C1"
                  maxLength={20}
                />
              </Field>

              {/* Galeria */}
              <Field label="Galeria *" error={formErrors.gallery}>
                <input
                  id="mr-f-gallery"
                  className={`mr-input ${formErrors.gallery ? 'mr-input-error' : ''}`}
                  value={form.gallery}
                  onChange={e => setForm(f => ({ ...f, gallery: e.target.value }))}
                  placeholder="Ex.: 1, 2, Norte"
                  maxLength={20}
                />
              </Field>

              {/* Piso */}
              <Field label="Piso *" error={formErrors.floor}>
                <input
                  id="mr-f-floor"
                  className={`mr-input ${formErrors.floor ? 'mr-input-error' : ''}`}
                  value={form.floor}
                  onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                  placeholder="Ex.: T, 1, 2"
                  maxLength={10}
                />
              </Field>

              {/* Tipo de Residência */}
              <Field label="Tipo de Residência *" error={formErrors.residenceType}>
                <select
                  id="mr-f-tipo"
                  className="mr-select"
                  value={form.residenceType}
                  onChange={e => setForm(f => ({ ...f, residenceType: e.target.value as TipoResidencia }))}
                  required
                >
                  {Object.values(TipoResidencia).map(v => (
                    <option key={v} value={v}>{TipoResidenciaLabel[v]}</option>
                  ))}
                </select>
              </Field>

              {/* Número da Residência */}
              <Field label="Número da Residência *" error={formErrors.residenceNumber}>
                <input
                  id="mr-f-number"
                  className={`mr-input ${formErrors.residenceNumber ? 'mr-input-error' : ''}`}
                  value={form.residenceNumber}
                  onChange={e => setForm(f => ({ ...f, residenceNumber: e.target.value }))}
                  placeholder="Ex.: 01, 12, A01"
                  maxLength={10}
                />
              </Field>

              {/* Capacidade */}
              <Field label="Capacidade *" error={formErrors.capacity}>
                <input
                  id="mr-f-capacity"
                  className={`mr-input ${formErrors.capacity ? 'mr-input-error' : ''}`}
                  type="number"
                  min={0}
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="0"
                />
              </Field>

              {/* Regime */}
              <Field label="Regime *" error={formErrors.regime}>
                <select
                  id="mr-f-regime"
                  className="mr-select"
                  value={form.regime}
                  onChange={e => setForm(f => ({ ...f, regime: e.target.value as Regime }))}
                  required
                >
                  {Object.values(Regime).map(v => (
                    <option key={v} value={v}>{RegimeLabel[v]}</option>
                  ))}
                </select>
              </Field>

            </div>

            <div className="mr-modal-footer">
              <button type="button" className="mr-btn mr-btn-ghost" onClick={closeModal} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="mr-btn mr-btn-primary" disabled={submitting}>
                {submitting ? <span className="mr-spinner-sm" /> : null}
                {submitting ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar residência'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — Confirmação de exclusão
  // ---------------------------------------------------------------------------

  function renderDeleteConfirm() {
    if (!deleteTarget) return null;
    return (
      <div className="mr-overlay" role="dialog" aria-modal="true" aria-label="Confirmar exclusão">
        <div className="mr-modal mr-modal-sm">
          <div className="mr-modal-header">
            <h2 className="mr-modal-title">Confirmar exclusão</h2>
            <button className="mr-modal-close" onClick={() => setDeleteTarget(null)} aria-label="Fechar">
              &times;
            </button>
          </div>
          <div className="mr-delete-body">
            <p>
              Deseja excluir a residência <strong>{deleteTarget.displayLabel}</strong>?
            </p>
            <p className="mr-delete-hint">
              O registro será inativado e mantido para fins de rastreabilidade. Esta ação não pode ser desfeita facilmente.
            </p>
          </div>
          <div className="mr-modal-footer">
            <button
              className="mr-btn mr-btn-ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </button>
            <button
              className="mr-btn mr-btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <span className="mr-spinner-sm" /> : null}
              {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render principal
  // ---------------------------------------------------------------------------

  return (
    <div className="mr-page">
      {/* Cabeçalho */}
      <div className="mr-page-header">
        <div className="mr-page-header-text">
          <h1 className="mr-page-title">Mapa de Residências</h1>
          <p className="mr-page-subtitle">
            Cadastro e organização física das residências internas.
            {!loading && (
              <span className="mr-count">
                {' '}{filtered.length} {filtered.length === 1 ? 'residência' : 'residências'}{residences.length !== filtered.length ? ` de ${residences.length}` : ''}
              </span>
            )}
          </p>
        </div>
        <div className="mr-page-actions">
          <button
            id="btn-nova-residencia"
            className="mr-btn mr-btn-primary"
            onClick={openCreate}
          >
            + Nova Residência
          </button>
        </div>
      </div>

      {/* Filtros */}
      {renderFilters()}

      {/* Tabela */}
      {renderTable()}

      {/* Modal criação/edição */}
      {renderModal()}

      {/* Modal confirmação de exclusão */}
      {renderDeleteConfirm()}
    </div>
  );
};
