/* eslint-disable @typescript-eslint/no-explicit-any */
export function UsersSection(props: any) {
  const {
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
  } = props;

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="ui-card rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-3 text-lg font-semibold">Usuarios</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Usuario</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Rol</th>
                <th className="pb-2">Sucursal</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Accion</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => {
                const canManageThisUser = canManageTargetUser(user);
                return (
                  <tr key={user.id} className="border-t border-slate-800">
                    <td className="py-2">{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.branch?.name ?? '-'}</td>
                    <td>{user.isActive ? 'Activo' : 'Inactivo'}</td>
                    <td className="flex gap-2 py-2">
                      <button
                        type="button"
                        className="rounded-lg border border-cyan-500/40 px-3 py-1 text-xs text-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => startUserEdit(user)}
                        disabled={!canManageThisUser}
                        title={!canManageThisUser ? 'Solo OWNER puede editar OWNER' : undefined}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => void toggleUserStatus(user)}
                        disabled={!canManageThisUser}
                        title={
                          !canManageThisUser
                            ? 'Solo OWNER puede activar/desactivar OWNER'
                            : undefined
                        }
                      >
                        {user.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-4">
        <form
          className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
          onSubmit={(event) => void onCreateUser(event)}
        >
          <h3 className="text-lg font-semibold">Crear usuario</h3>
          <input
            value={userForm.username}
            onChange={(event) =>
              setUserForm((prev: any) => ({ ...prev, username: event.target.value }))
            }
            placeholder="Username"
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            required
          />
          <input
            value={userForm.email}
            onChange={(event) =>
              setUserForm((prev: any) => ({ ...prev, email: event.target.value }))
            }
            type="email"
            placeholder="Email"
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            required
          />
          <input
            value={userForm.password}
            onChange={(event) =>
              setUserForm((prev: any) => ({ ...prev, password: event.target.value }))
            }
            type="password"
            placeholder="Password"
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            required
          />
          <select
            value={userForm.role}
            onChange={(event) =>
              setUserForm((prev: any) => ({ ...prev, role: event.target.value }))
            }
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            {isOwner ? <option value="OWNER">OWNER</option> : null}
            <option value="ADMIN">ADMIN</option>
            <option value="REGISTRADOR">REGISTRADOR</option>
          </select>
          {userForm.role === 'REGISTRADOR' ? (
            <select
              value={userForm.branchId}
              onChange={(event) =>
                setUserForm((prev: any) => ({ ...prev, branchId: event.target.value }))
              }
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            >
              <option value="">Sucursal</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="submit"
            className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Crear usuario
          </button>
        </form>

        <form
          className="ui-card ui-form-card space-y-3 rounded-3xl border border-slate-800 bg-slate-900 p-5"
          onSubmit={(event) => void onUpdateUser(event)}
        >
          <h3 className="text-lg font-semibold">Editar usuario</h3>
          <select
            value={userEditForm.id}
            onChange={(event) => {
              const selected = users.find((item: any) => item.id === event.target.value);
              if (!selected) {
                return;
              }

              startUserEdit(selected);
            }}
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            required
          >
            <option value="">Selecciona usuario</option>
            {users
              .filter((item: any) => canManageTargetUser(item))
              .map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.username} ({item.role})
                </option>
              ))}
          </select>
          <input
            value={userEditForm.username}
            onChange={(event) =>
              setUserEditForm((prev: any) => ({ ...prev, username: event.target.value }))
            }
            placeholder="Username"
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            required
          />
          <input
            value={userEditForm.email}
            onChange={(event) =>
              setUserEditForm((prev: any) => ({ ...prev, email: event.target.value }))
            }
            type="email"
            placeholder="Email"
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            required
          />
          <input
            value={userEditForm.password}
            onChange={(event) =>
              setUserEditForm((prev: any) => ({ ...prev, password: event.target.value }))
            }
            type="password"
            placeholder="Nuevo password (opcional)"
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <select
            value={userEditForm.role}
            onChange={(event) =>
              setUserEditForm((prev: any) => ({ ...prev, role: event.target.value }))
            }
            className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            {isOwner ? <option value="OWNER">OWNER</option> : null}
            <option value="ADMIN">ADMIN</option>
            <option value="REGISTRADOR">REGISTRADOR</option>
          </select>
          {userEditForm.role === 'REGISTRADOR' ? (
            <select
              value={userEditForm.branchId}
              onChange={(event) =>
                setUserEditForm((prev: any) => ({ ...prev, branchId: event.target.value }))
              }
              className="w-full ui-control rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              required
            >
              <option value="">Sucursal</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="submit"
            className="ui-primary-btn rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </section>
  );
}
