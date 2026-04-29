import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Building2, Pencil, Plus } from 'lucide-react';

import type { Branch } from '../../../lib/types';
import { Badge, Button, DataTable, EmptyState, Field, Input, Panel, SectionTitle, Select } from '../ui';

interface BranchFormState {
  name: string;
}

interface BranchEditState {
  id: string;
  isActive: boolean;
  name: string;
}

interface BranchesSectionProps {
  branchEdit: BranchEditState;
  branchForm: BranchFormState;
  branches: Branch[];
  formatDate: (value: string) => string;
  onCreateBranch: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onEditBranch: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setBranchEdit: Dispatch<SetStateAction<BranchEditState>>;
  setBranchForm: Dispatch<SetStateAction<BranchFormState>>;
}

export function BranchesSection({
  branchEdit,
  branchForm,
  branches,
  formatDate,
  onCreateBranch,
  onEditBranch,
  setBranchEdit,
  setBranchForm,
}: BranchesSectionProps) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_420px]">
      <Panel className="p-5">
        <SectionTitle eyebrow="Operacion" title="Sucursales" />
        <div className="mt-4">
          {branches.length ? (
            <DataTable>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Actualizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="font-bold text-[color:var(--text-strong)]">{branch.name}</td>
                    <td>
                      <Badge tone={branch.isActive ? 'green' : 'red'}>
                        {branch.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td>{formatDate(branch.updatedAt)}</td>
                    <td>
                      <Button
                        icon={<Pencil />}
                        onClick={() =>
                          setBranchEdit({
                            id: branch.id,
                            isActive: branch.isActive,
                            name: branch.name,
                          })
                        }
                      >
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <EmptyState>No hay sucursales registradas.</EmptyState>
          )}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle eyebrow="Alta" title="Nueva sucursal" />
          <form className="mt-4 grid gap-3" onSubmit={(event) => void onCreateBranch(event)}>
            <Field label="Nombre">
              <Input
                onChange={(event) => setBranchForm((prev) => ({ ...prev, name: event.target.value }))}
                required
                value={branchForm.name}
              />
            </Field>
            <Button icon={<Plus />} type="submit" variant="primary">
              Crear sucursal
            </Button>
          </form>
        </Panel>

        <Panel className="p-5">
          <SectionTitle eyebrow="Edicion" title="Configurar sucursal" />
          <form className="mt-4 grid gap-3" onSubmit={(event) => void onEditBranch(event)}>
            <Field label="Sucursal">
              <Select
                onChange={(event) => {
                  const selected = branches.find((branch) => branch.id === event.target.value);
                  setBranchEdit({
                    id: selected?.id ?? '',
                    isActive: selected?.isActive ?? true,
                    name: selected?.name ?? '',
                  });
                }}
                value={branchEdit.id}
              >
                <option value="">Seleccionar</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre">
              <Input
                onChange={(event) => setBranchEdit((prev) => ({ ...prev, name: event.target.value }))}
                value={branchEdit.name}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-bold text-[color:var(--text)]">
              <input
                checked={branchEdit.isActive}
                onChange={(event) =>
                  setBranchEdit((prev) => ({ ...prev, isActive: event.target.checked }))
                }
                type="checkbox"
              />
              Sucursal activa
            </label>
            <Button icon={<Building2 />} type="submit" variant="primary">
              Guardar cambios
            </Button>
          </form>
        </Panel>
      </div>
    </section>
  );
}
