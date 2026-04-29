import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { Pencil, Power, UserPlus } from 'lucide-react';

import type { Branch, User, UserRole } from '../../../lib/types';
import { Badge, Button, DataTable, EmptyState, Field, Input, Panel, SectionTitle, Select } from '../ui';

interface UserFormState {
  branchId: string;
  email: string;
  password: string;
  role: UserRole;
  username: string;
}

interface UserEditFormState extends UserFormState {
  id: string;
}

interface UsersSectionProps {
  branches: Branch[];
  canManageTargetUser: (user: User | null | undefined) => boolean;
  isOwner: boolean;
  onCreateUser: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onUpdateUser: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setUserEditForm: Dispatch<SetStateAction<UserEditFormState>>;
  setUserForm: Dispatch<SetStateAction<UserFormState>>;
  startUserEdit: (user: User) => void;
  toggleUserStatus: (user: User) => Promise<void>;
  userEditForm: UserEditFormState;
  userForm: UserFormState;
  users: User[];
}

function roleTone(role: UserRole): 'blue' | 'green' | 'neutral' {
  if (role === 'OWNER') {
    return 'blue';
  }

  if (role === 'ADMIN') {
    return 'green';
  }

  return 'neutral';
}

export function UsersSection({
  branches,
  canManageTargetUser,
  isOwner,
  onCreateUser,
  onUpdateUser,
  setUserEditForm,
  setUserForm,
  startUserEdit,
  toggleUserStatus,
  userEditForm,
  userForm,
  users,
}: UsersSectionProps) {
  const editableUsers = users.filter((user) => canManageTargetUser(user));

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_420px]">
      <Panel className="p-5">
        <SectionTitle eyebrow="Accesos" title="Usuarios" />
        <div className="mt-4">
          {users.length ? (
            <DataTable>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const canManageThisUser = canManageTargetUser(user);

                  return (
                    <tr key={user.id}>
                      <td className="font-bold text-[color:var(--text-strong)]">{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                      </td>
                      <td>{user.branch?.name ?? '-'}</td>
                      <td>
                        <Badge tone={user.isActive ? 'green' : 'red'}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={!canManageThisUser}
                            icon={<Pencil />}
                            onClick={() => startUserEdit(user)}
                          >
                            Editar
                          </Button>
                          <Button
                            disabled={!canManageThisUser}
                            icon={<Power />}
                            onClick={() => void toggleUserStatus(user)}
                            variant={user.isActive ? 'secondary' : 'primary'}
                          >
                            {user.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          ) : (
            <EmptyState>No hay usuarios registrados.</EmptyState>
          )}
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel className="p-5">
          <SectionTitle eyebrow="Alta" title="Crear usuario" />
          <form className="mt-4 grid gap-3" onSubmit={(event) => void onCreateUser(event)}>
            <Field label="Usuario">
              <Input
                onChange={(event) => setUserForm((prev) => ({ ...prev, username: event.target.value }))}
                required
                value={userForm.username}
              />
            </Field>
            <Field label="Email">
              <Input
                onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                type="email"
                value={userForm.email}
              />
            </Field>
            <Field label="Password">
              <Input
                onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                type="password"
                value={userForm.password}
              />
            </Field>
            <Field label="Rol">
              <Select
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
                }
                value={userForm.role}
              >
                {isOwner ? <option value="OWNER">OWNER</option> : null}
                {isOwner ? <option value="ADMIN">ADMIN</option> : null}
                <option value="REGISTRADOR">REGISTRADOR</option>
              </Select>
            </Field>
            {userForm.role !== 'OWNER' ? (
              <Field label="Sucursal">
                <Select
                  onChange={(event) => setUserForm((prev) => ({ ...prev, branchId: event.target.value }))}
                  required={userForm.role === 'REGISTRADOR'}
                  value={userForm.branchId}
                >
                  <option value="">
                    {userForm.role === 'ADMIN' ? 'Sin sucursal asignada' : 'Seleccionar'}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Button icon={<UserPlus />} type="submit" variant="primary">
              Crear usuario
            </Button>
          </form>
        </Panel>

        <Panel className="p-5">
          <SectionTitle eyebrow="Edicion" title="Editar usuario" />
          <form className="mt-4 grid gap-3" onSubmit={(event) => void onUpdateUser(event)}>
            <Field label="Usuario">
              <Select
                onChange={(event) => {
                  const selected = editableUsers.find((user) => user.id === event.target.value);
                  if (selected) {
                    startUserEdit(selected);
                  }
                }}
                required
                value={userEditForm.id}
              >
                <option value="">Seleccionar</option>
                {editableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Usuario">
              <Input
                onChange={(event) =>
                  setUserEditForm((prev) => ({ ...prev, username: event.target.value }))
                }
                required
                value={userEditForm.username}
              />
            </Field>
            <Field label="Email">
              <Input
                onChange={(event) => setUserEditForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                type="email"
                value={userEditForm.email}
              />
            </Field>
            <Field label="Nuevo password">
              <Input
                onChange={(event) =>
                  setUserEditForm((prev) => ({ ...prev, password: event.target.value }))
                }
                type="password"
                value={userEditForm.password}
              />
            </Field>
            <Field label="Rol">
              <Select
                onChange={(event) =>
                  setUserEditForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
                }
                value={userEditForm.role}
              >
                {isOwner ? <option value="OWNER">OWNER</option> : null}
                {isOwner ? <option value="ADMIN">ADMIN</option> : null}
                <option value="REGISTRADOR">REGISTRADOR</option>
              </Select>
            </Field>
            {userEditForm.role !== 'OWNER' ? (
              <Field label="Sucursal">
                <Select
                  onChange={(event) =>
                    setUserEditForm((prev) => ({ ...prev, branchId: event.target.value }))
                  }
                  required={userEditForm.role === 'REGISTRADOR'}
                  value={userEditForm.branchId}
                >
                  <option value="">
                    {userEditForm.role === 'ADMIN' ? 'Sin sucursal asignada' : 'Seleccionar'}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Button icon={<Pencil />} type="submit" variant="primary">
              Guardar cambios
            </Button>
          </form>
        </Panel>
      </div>
    </section>
  );
}
