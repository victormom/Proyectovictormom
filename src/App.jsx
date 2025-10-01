import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Users, Settings, FileText, Download, Trash2, Edit, Plus, Lock, Clock, Printer, LogOut, X } from 'lucide-react';

const initialData = {
  users: [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      status: 'activo',
      startTime: '08:00',
      endTime: '18:00',
      permissions: ['usuarios', 'permisos', 'impresiones', 'registros']
    },
    {
      id: 2,
      username: 'usuario1',
      password: 'pass123',
      status: 'cambiar_contraseña',
      startTime: '09:00',
      endTime: '17:00',
      permissions: ['registros']
    }
  ],
  printConfig: {
    pageSize: 'A4',
    fontSize: 12,
    fontFamily: 'Arial',
    backgroundImage: ''
  },
  records: [
    {
      id: 1,
      nombre: 'Juan Pérez',
      contrato: 'CONT-001',
      saldo: 15000,
      fecha: '2025-10-01',
      telefono: '5551234567'
    }
  ]
};

const App = () => {
  const [data, setData] = useState(initialData);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentModule, setCurrentModule] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [changePasswordForm, setChangePasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [needPasswordChange, setNeedPasswordChange] = useState(false);
  const [userToChange, setUserToChange] = useState(null);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const isInWorkingHours = (user) => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    return currentTime >= user.startTime && currentTime <= user.endTime;
  };

  const handleLogin = () => {
    setError('');
    const user = data.users.find(
      u => u.username === loginForm.username && u.password === loginForm.password
    );

    if (!user) {
      setError('Usuario o contraseña incorrectos');
      return;
    }

    if (user.status === 'baja') {
      setError('Usuario dado de baja. No se permite el acceso');
      return;
    }

    if (!isInWorkingHours(user)) {
      setError('Fuera de horario laboral. No se permite el acceso');
      return;
    }

    if (user.status === 'cambiar_contraseña') {
      setNeedPasswordChange(true);
      setUserToChange(user);
      return;
    }

    setCurrentUser(user);
    setCurrentModule('registros');
  };

  const handleChangePassword = () => {
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!changePasswordForm.newPassword) {
      setError('Debe ingresar una nueva contraseña');
      return;
    }

    const updatedUsers = data.users.map(u =>
      u.id === userToChange.id
        ? { ...u, password: changePasswordForm.newPassword, status: 'activo' }
        : u
    );

    setData({ ...data, users: updatedUsers });
    setCurrentUser({ ...userToChange, password: changePasswordForm.newPassword, status: 'activo' });
    setCurrentModule('registros');
    setChangePasswordForm({ newPassword: '', confirmPassword: '' });
    setNeedPasswordChange(false);
    setUserToChange(null);
    setError('');
  };

  const handleCancelPasswordChange = () => {
    setNeedPasswordChange(false);
    setUserToChange(null);
    setForgotPasswordMode(false);
    setChangePasswordForm({ newPassword: '', confirmPassword: '' });
    setLoginForm({ username: '', password: '' });
    setError('');
  };

  const handleForgotPassword = () => {
    setError('');
    if (!loginForm.username) {
      setError('Debe ingresar su nombre de usuario');
      return;
    }

    const user = data.users.find(u => u.username === loginForm.username);
    if (!user) {
      setError('Usuario no encontrado');
      return;
    }

    setUserToChange(user);
    setForgotPasswordMode(true);
    setNeedPasswordChange(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentModule('login');
    setLoginForm({ username: '', password: '' });
    setError('');
  };

  const generatePDFHTML = (record) => {
    const { pageSize, fontSize, fontFamily } = data.printConfig;
    
    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page { size: ' + pageSize + '; margin: 2cm; }body { font-family: ' + fontFamily + ', sans-serif; font-size: ' + fontSize + 'px; line-height: 1.6; }.header { text-align: center; font-size: ' + (fontSize + 4) + 'px; font-weight: bold; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }.field { margin: 15px 0; padding: 10px; background: #f5f5f5; border-left: 4px solid #2563eb; }.label { font-weight: bold; color: #1e40af; }</style></head><body><div class="header">INFORMACIÓN DEL REGISTRO</div><div class="field"><span class="label">Nombre:</span> ' + record.nombre + '</div><div class="field"><span class="label">Contrato:</span> ' + record.contrato + '</div><div class="field"><span class="label">Saldo:</span> $' + record.saldo.toLocaleString() + '</div><div class="field"><span class="label">Fecha:</span> ' + record.fecha + '</div><div class="field"><span class="label">Teléfono:</span> ' + record.telefono + '</div></body></html>';
    
    return html;
  };

  const downloadSinglePDF = (record) => {
    const html = generatePDFHTML(record);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registro_' + record.contrato + '.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMultiplePDFs = () => {
    let delay = 0;
    selectedRecords.forEach(recordId => {
      const record = data.records.find(r => r.id === recordId);
      if (record) {
        setTimeout(function() {
          downloadSinglePDF(record);
        }, delay);
        delay = delay + 200;
      }
    });
    setSelectedRecords([]);
  };

  const hasPermission = (module) => {
    return currentUser && currentUser.permissions.includes(module);
  };

  const handleSaveUser = () => {
    if (editingUser.id) {
      setData({
        ...data,
        users: data.users.map(u => u.id === editingUser.id ? editingUser : u)
      });
    } else {
      setData({
        ...data,
        users: [...data.users, { ...editingUser, id: Date.now() }]
      });
    }
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleSaveRecord = () => {
    if (editingRecord.id) {
      setData({
        ...data,
        records: data.records.map(r => r.id === editingRecord.id ? editingRecord : r)
      });
    } else {
      setData({
        ...data,
        records: [...data.records, { ...editingRecord, id: Date.now() }]
      });
    }
    setShowRecordModal(false);
    setEditingRecord(null);
  };

  if (currentModule === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Sistema de Gestión</h1>
            <p className="text-gray-600 mt-2">
              {needPasswordChange ? 'Cambiar Contraseña Requerido' : 'Iniciar Sesión'}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {needPasswordChange && !forgotPasswordMode && (
            <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-4">
              Es necesario cambiar su contraseña antes de continuar
            </div>
          )}

          {forgotPasswordMode && userToChange && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              Ingrese una nueva contraseña para el usuario: <strong>{userToChange.username}</strong>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                disabled={needPasswordChange && !forgotPasswordMode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Ingrese su usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  disabled={needPasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Ingrese su contraseña"
                />
                {!needPasswordChange && (
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                )}
              </div>
            </div>

            {needPasswordChange && (
              <>
                <div className="border-t pt-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={changePasswordForm.newPassword}
                        onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ingrese nueva contraseña"
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={changePasswordForm.confirmPassword}
                        onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirme la nueva contraseña"
                      />
                      <button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!needPasswordChange ? (
              <>
                <button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Ingresar
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
                >
                  ¿Olvidó su contraseña?
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Cambiar y Continuar
                </button>
                <button
                  onClick={handleCancelPasswordChange}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>


        </div>
      </div>
    );
  }

  if (currentModule === 'change_password') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Gestión</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Bienvenido, {currentUser.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              <LogOut size={20} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        <aside className="w-64 bg-white rounded-lg shadow-md p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentModule('registros')}
              className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ' + (currentModule === 'registros' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100')}
            >
              <FileText size={20} />
              Registros
            </button>

            {hasPermission('usuarios') && (
              <button
                onClick={() => setCurrentModule('usuarios')}
                className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ' + (currentModule === 'usuarios' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100')}
              >
                <Users size={20} />
                Usuarios
              </button>
            )}

            {hasPermission('impresiones') && (
              <button
                onClick={() => setCurrentModule('impresiones')}
                className={'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ' + (currentModule === 'impresiones' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100')}
              >
                <Printer size={20} />
                Impresiones
              </button>
            )}
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-lg shadow-md p-6">
          {currentModule === 'registros' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Registros</h2>
                <div className="flex gap-2">
                  {selectedRecords.length > 1 && (
                    <button
                      onClick={downloadMultiplePDFs}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Download size={20} />
                      Descargar Seleccionados ({selectedRecords.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingRecord({ nombre: '', contrato: '', saldo: 0, fecha: '', telefono: '' });
                      setShowRecordModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={20} />
                    Nuevo Registro
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecords(data.records.map(r => r.id));
                            } else {
                              setSelectedRecords([]);
                            }
                          }}
                          checked={selectedRecords.length === data.records.length}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contrato</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Saldo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecords([...selectedRecords, record.id]);
                              } else {
                                setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.nombre}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.contrato}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">${record.saldo.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.fecha}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.telefono}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadSinglePDF(record)}
                              className="text-green-600 hover:text-green-800"
                              title="Descargar Documento"
                            >
                              <Download size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRecord(record);
                                setShowRecordModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setData({
                                  ...data,
                                  records: data.records.filter(r => r.id !== record.id)
                                });
                              }}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentModule === 'usuarios' && hasPermission('usuarios') && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
                <button
                  onClick={() => {
                    setEditingUser({
                      username: '',
                      password: '',
                      status: 'activo',
                      startTime: '08:00',
                      endTime: '18:00',
                      permissions: []
                    });
                    setShowUserModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Nuevo Usuario
                </button>
              </div>

              <div className="space-y-4">
                {data.users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{user.username}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                          <p>Estado: <span className={'font-semibold ' + (user.status === 'activo' ? 'text-green-600' : user.status === 'baja' ? 'text-red-600' : 'text-orange-600')}>{user.status}</span></p>
                          <p>Horario: {user.startTime} - {user.endTime}</p>
                          <p className="col-span-2">Permisos: {user.permissions.join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setData({
                              ...data,
                              users: data.users.filter(u => u.id !== user.id)
                            });
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentModule === 'impresiones' && hasPermission('impresiones') && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de Impresiones</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño de Página</label>
                  <select
                    value={data.printConfig.pageSize}
                    onChange={(e) => setData({
                      ...data,
                      printConfig: { ...data.printConfig, pageSize: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño de Letra</label>
                  <input
                    type="number"
                    value={data.printConfig.fontSize}
                    onChange={(e) => setData({
                      ...data,
                      printConfig: { ...data.printConfig, fontSize: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="8"
                    max="24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Letra</label>
                  <select
                    value={data.printConfig.fontFamily}
                    onChange={(e) => setData({
                      ...data,
                      printConfig: { ...data.printConfig, fontFamily: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times">Times New Roman</option>
                    <option value="Courier">Courier</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    La configuración se aplicará automáticamente a todos los documentos generados
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingUser.id ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={() => setShowUserModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="activo">Activo</option>
                  <option value="baja">Baja</option>
                  <option value="cambiar_contraseña">Cambiar Contraseña</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora Inicio</label>
                  <input
                    type="time"
                    value={editingUser.startTime}
                    onChange={(e) => setEditingUser({ ...editingUser, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora Fin</label>
                  <input
                    type="time"
                    value={editingUser.endTime}
                    onChange={(e) => setEditingUser({ ...editingUser, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
                <div className="space-y-2">
                  {['usuarios', 'permisos', 'impresiones', 'registros'].map(perm => (
                    <label key={perm} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingUser.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingUser({
                              ...editingUser,
                              permissions: [...editingUser.permissions, perm]
                            });
                          } else {
                            setEditingUser({
                              ...editingUser,
                              permissions: editingUser.permissions.filter(p => p !== perm)
                            });
                          }
                        }}
                      />
                      <span className="capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveUser}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                {editingRecord.id ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button onClick={() => setShowRecordModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={editingRecord.nombre}
                  onChange={(e) => setEditingRecord({ ...editingRecord, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contrato</label>
                <input
                  type="text"
                  value={editingRecord.contrato}
                  onChange={(e) => setEditingRecord({ ...editingRecord, contrato: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Saldo</label>
                <input
                  type="number"
                  value={editingRecord.saldo}
                  onChange={(e) => setEditingRecord({ ...editingRecord, saldo: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={editingRecord.fecha}
                  onChange={(e) => setEditingRecord({ ...editingRecord, fecha: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={editingRecord.telefono}
                  onChange={(e) => setEditingRecord({ ...editingRecord, telefono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <button
                onClick={handleSaveRecord}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
