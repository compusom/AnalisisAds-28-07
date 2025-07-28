import React, { useState, useEffect, useCallback } from 'react';

const DB_TABLES_STATUS_KEY = 'db_tables_status';
const DB_KEYS_TO_CLEAR = [
    'db_config',
    'db_status',
    'db_clients',
    'analysis_history',
    'current_client_id',
    'ads_performance_data',
    'processed_reports_hashes',
    'db_tables_status'
];


type TableStatus = {
    clients: boolean;
    creatives: boolean;
    users: boolean;
};

export const ControlPanelView: React.FC = () => {
    const [status, setStatus] = useState<TableStatus>({ clients: false, creatives: false, users: false });
    const [loading, setLoading] = useState<Partial<Record<keyof TableStatus, boolean>>>({});
    const [isChecking, setIsChecking] = useState(false);
    const [logs, setLogs] = useState<string[]>(['> Log de producción inicializado. Esperando comandos...']);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-100), `[${timestamp}] ${message}`]);
    }

    const checkTableStatus = useCallback(async () => {
        setIsChecking(true);
        addLog('> Ejecutando: CHECK DATABASE STATUS...');
        await new Promise(res => setTimeout(res, 500));
        try {
            const storedStatus = localStorage.getItem(DB_TABLES_STATUS_KEY);
            if (storedStatus) {
                const parsedStatus = JSON.parse(storedStatus);
                setStatus(parsedStatus);
                 addLog('✅ Status de tablas cargado desde la persistencia.');
            } else {
                 addLog('⚠️ No se encontró estado previo. Se requiere inicialización de tablas.');
                setStatus({ clients: false, creatives: false, users: false });
            }
        } catch (e) {
            console.error("Failed to parse table status from localStorage", e);
            addLog('❌ Error crítico al leer el estado de las tablas desde localStorage.');
            setStatus({ clients: false, creatives: false, users: false });
        }
        setIsChecking(false);
    }, []);

    useEffect(() => {
        checkTableStatus();
    }, [checkTableStatus]);

    const handleCreateTable = async (tableName: keyof TableStatus) => {
        setLoading(prev => ({...prev, [tableName]: true}));
        addLog(`> Executing SQL Command: CREATE TABLE IF NOT EXISTS "${tableName}"...`);
        await new Promise(res => setTimeout(res, 700));
        const newStatus = { ...status, [tableName]: true };
        setStatus(newStatus);
        localStorage.setItem(DB_TABLES_STATUS_KEY, JSON.stringify(newStatus));
        setLoading(prev => ({...prev, [tableName]: false}));
        addLog(`✅ Comando completado. Tabla "${tableName}" lista para operar.`);
    };
    
    const handleClearDatabase = () => {
        if (!window.confirm('¿ESTÁS SEGURO? Esta acción eliminará TODA la información de la aplicación (clientes, historial, reportes, configuraciones) de forma permanente. Esta acción no se puede deshacer.')) {
            return;
        }

        if (!window.confirm('CONFIRMACIÓN FINAL: ¿Realmente quieres borrar toda la base de datos?')) {
            return;
        }

        try {
            addLog('☢️ Iniciando protocolo de limpieza completa de la base de datos...');
            DB_KEYS_TO_CLEAR.forEach(key => localStorage.removeItem(key));
            addLog('✅ Base de datos limpiada con éxito. La aplicación se reiniciará.');
            alert('Base de datos limpiada. La aplicación se recargará.');
            window.location.reload();
        } catch (e) {
            console.error('Error al limpiar la base de datos:', e);
            addLog(`❌ Error durante la limpieza: ${e}`);
            alert('Ocurrió un error al intentar limpiar la base de datos.');
        }
    };


    const tables: { key: keyof TableStatus; name: string; description: string }[] = [
        { key: 'clients', name: 'Tabla de Clientes', description: 'Almacena nombre, logo y moneda de cada cliente.' },
        { key: 'creatives', name: 'Tabla de Historial de Análisis', description: 'Almacena hash, metadatos y el resultado del análisis de la IA.' },
        { key: 'users', name: 'Tabla de Usuarios', description: 'Almacena usuarios y sus roles (admin/user).' },
    ];

    return (
        <div className="max-w-4xl mx-auto bg-brand-surface rounded-lg p-8 shadow-lg animate-fade-in space-y-8">
            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text mb-2">Panel de Control de la Base de Datos</h2>
                        <p className="text-brand-text-secondary">
                            Inicializa y gestiona las tablas de la base de datos de la aplicación.
                        </p>
                    </div>
                     <button
                        onClick={checkTableStatus}
                        disabled={isChecking}
                        className="bg-brand-border hover:bg-brand-border/70 text-brand-text font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sm:justify-start gap-2"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isChecking ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                        <span>{isChecking ? 'Verificando...' : 'Refrescar Estado'}</span>
                    </button>
                </div>
                 <div className="space-y-4">
                    {tables.map(table => (
                        <div key={table.key} className="bg-brand-border/50 p-4 rounded-md flex justify-between items-center transition-colors">
                            <div>
                                <h3 className="font-semibold text-brand-text">{table.name}</h3>
                                <p className="text-sm text-brand-text-secondary">{table.description}</p>
                            </div>
                            {status[table.key] ? (
                                <div className="flex items-center gap-2 text-green-400 font-bold bg-green-500/20 px-3 py-1 rounded-full text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    ONLINE
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleCreateTable(table.key)} 
                                    disabled={loading[table.key]}
                                    className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading[table.key] ? 'Creando...' : 'Crear Tabla'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">LOG DE OPERACIONES DE PRODUCCIÓN</h3>
                    <pre className="bg-brand-bg p-4 rounded-md font-mono text-xs text-brand-text-secondary h-40 overflow-y-auto w-full">
                        {logs.map((log, i) => (
                           <p key={i} className={`whitespace-pre-wrap ${log.includes('✅') ? 'text-green-400' : log.includes('⚠️') ? 'text-yellow-400' : log.includes('❌') || log.includes('☢️') ? 'text-red-400' : ''}`}>{log}</p>
                        ))}
                    </pre>
                </div>
            </div>
            
            <div className="border-t-2 border-red-500/30 pt-6">
                <h3 className="text-xl font-bold text-red-400 mb-2">Zona de Peligro</h3>
                <div className="bg-red-600/10 p-4 rounded-md flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h4 className="font-semibold text-brand-text">Limpiar toda la Base de Datos</h4>
                        <p className="text-sm text-brand-text-secondary mt-1">
                            Esto eliminará permanentemente todos los clientes, análisis, historiales y datos de rendimiento. Úsalo si quieres empezar de cero.
                        </p>
                    </div>
                    <button
                        onClick={handleClearDatabase}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex-shrink-0"
                    >
                        Limpiar Base de Datos
                    </button>
                </div>
            </div>
        </div>
    );
};