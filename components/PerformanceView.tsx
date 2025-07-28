import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';
import { Client, PerformanceRecord, AnalysisHistoryEntry, MatchedPerformanceRecord, LastUploadInfo } from '../types';

const PERFORMANCE_DATA_KEY = 'ads_performance_data';
const PROCESSED_REPORTS_KEY = 'processed_reports_hashes';

type View = 'list' | 'detail';
type Feedback = { type: 'info' | 'success' | 'error', message: string };


const getFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const ReportUploader: React.FC<{ onFileUpload: (file: File) => void, disabled: boolean }> = ({ onFileUpload, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) onFileUpload(file);
    };

    const handleClick = () => {
        if (!disabled) fileInputRef.current?.click();
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileUpload(e.dataTransfer.files[0]);
        }
    }, [onFileUpload, disabled]);
    
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(isEntering);
    };

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-6 sm:p-10 text-center transition-colors ${isDragging ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border'} ${disabled ? 'cursor-not-allowed bg-brand-bg/50' : 'cursor-pointer hover:border-brand-primary bg-brand-bg'}`}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                disabled={disabled} 
            />
            <svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-12 w-12 ${disabled ? 'text-brand-border' : 'text-brand-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className={`mt-4 text-base sm:text-lg font-semibold ${disabled ? 'text-brand-text-secondary' : 'text-brand-text'}`}>Arrastra tu reporte (.xlsx) o haz clic</p>
            <p className="mt-1 text-xs sm:text-sm text-brand-text-secondary">Sube el reporte de rendimiento para este cliente.</p>
        </div>
    );
};

const PerformanceTable: React.FC<{ data: MatchedPerformanceRecord[], showMatchedOnly: boolean }> = ({ data, showMatchedOnly }) => {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const filteredData = useMemo(() => showMatchedOnly ? data.filter(d => d.isMatched) : data, [data, showMatchedOnly]);

    if (filteredData.length === 0) {
        return <p className="text-brand-text-secondary text-center py-8">{showMatchedOnly ? "No se encontraron anuncios que coincidan con los creativos analizados." : "No hay datos de rendimiento para este cliente."}</p>;
    }
    
    const headers = ['Día', 'Campaña', 'Anuncio', 'Gasto', 'Compras', 'Impresiones', 'Clics', 'CTR', 'ROAS'];

    return (
        <div className="overflow-x-auto bg-brand-bg rounded-lg">
            <table className="w-full text-sm text-left text-brand-text-secondary">
                <thead className="text-xs text-brand-text uppercase bg-brand-surface">
                    <tr>
                        <th scope="col" className="px-4 py-3 w-8"></th>
                        {headers.map(h => <th key={h} scope="col" className="px-4 py-3 whitespace-nowrap">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((row) => {
                        const gasto = row['Importe gastado (EUR)'] || 0;
                        const compras = row['Compras'] || 0;
                        const valorCompras = row['Valor de conversión de compras'] || 0;
                        const roas = gasto > 0 ? (valorCompras / gasto).toFixed(2) : '0.00';
                        const isExpanded = expandedRow === row.uniqueId;

                        return (
                            <React.Fragment key={row.uniqueId}>
                                <tr className="bg-brand-surface border-b border-brand-border hover:bg-brand-border/50">
                                    <td className="px-4 py-3 text-center">
                                        {row.isMatched ? (
                                             <button onClick={() => setExpandedRow(isExpanded ? null : row.uniqueId)} className="text-brand-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-border" viewBox="0 0 20 20" fill="currentColor"><path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{row['Día']}</td>
                                    <td className="px-4 py-3 truncate max-w-xs">{row['Nombre de la campaña']}</td>
                                    <td className="px-4 py-3 truncate max-w-xs font-medium text-brand-text">{row['Nombre del anuncio']}</td>
                                    <td className="px-4 py-3">{gasto.toFixed(2)}</td>
                                    <td className="px-4 py-3">{compras}</td>
                                    <td className="px-4 py-3">{row['Impresiones']}</td>
                                    <td className="px-4 py-3">{row['Clics en el enlace']}</td>
                                    <td className="px-4 py-3">{row['CTR (todos)']}</td>
                                    <td className="px-4 py-3 font-semibold text-brand-text">{roas}</td>
                                </tr>
                                {isExpanded && (
                                    <tr className="bg-brand-border/30">
                                        <td colSpan={10} className="p-4">
                                            <div className="bg-brand-surface/50 p-4 rounded-md">
                                                <h4 className="text-sm font-bold text-brand-primary mb-2">Análisis de IA Vinculado</h4>
                                                <p className="text-sm text-brand-text-secondary whitespace-pre-wrap">{row.creativeDescription}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export const PerformanceView: React.FC<{ clients: Client[]; analysisHistory: AnalysisHistoryEntry[] }> = ({ clients, analysisHistory }) => {
    const [view, setView] = useState<View>('list');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientData, setClientData] = useState<PerformanceRecord[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [lastUploadInfo, setLastUploadInfo] = useState<LastUploadInfo | null>(null);
    const [showMatchedOnly, setShowMatchedOnly] = useState(false);
    const [insights, setInsights] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0,10);
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0,10));

    const allPerformanceData = useMemo(() => {
        try {
            const saved = localStorage.getItem(PERFORMANCE_DATA_KEY);
            return saved ? JSON.parse(saved) as { [key: string]: PerformanceRecord[] } : {};
        } catch {
            return {};
        }
    }, [clientData]);

    const clientSummaries = useMemo(() => {
        return clients.map(client => {
            const data = allPerformanceData[client.id] || [];
            const gastoTotal = data.reduce((acc, row) => acc + (row['Importe gastado (EUR)'] || 0), 0);
            const comprasTotales = data.reduce((acc, row) => acc + (row['Compras'] || 0), 0);
            const valorTotal = data.reduce((acc, row) => acc + (row['Valor de conversión de compras'] || 0), 0);
            const roas = gastoTotal > 0 ? valorTotal / gastoTotal : 0;
            const matchedCount = data.filter(d => 
                analysisHistory.some(h => 
                    h.clientId === client.id && d['Imagen, video y presentación']?.includes(h.filename)
                )
            ).length;

            return {
                ...client,
                gastoTotal,
                comprasTotales,
                roas,
                totalAds: data.length,
                matchedCount
            };
        });
    }, [clients, allPerformanceData, analysisHistory]);

    const matchedClientData = useMemo<MatchedPerformanceRecord[]>(() => {
        if (!selectedClient) return [];
        const data = allPerformanceData[selectedClient.id] || [];
        return data.map(record => {
            const match = analysisHistory.find(h => h.clientId === selectedClient.id && record['Imagen, video y presentación']?.includes(h.filename));
            return {
                ...record,
                isMatched: !!match,
                creativeDescription: match?.description
            };
        }).sort((a,b) => new Date(b.Día).getTime() - new Date(a.Día).getTime());
    }, [selectedClient, allPerformanceData, analysisHistory]);

    const filteredByDate = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return matchedClientData.filter(d => {
            const day = new Date(d['Día']);
            return day >= start && day <= end;
        });
    }, [matchedClientData, startDate, endDate]);

    const summaryMetrics = useMemo(() => {
        const spend = filteredByDate.reduce((acc, r) => acc + (r['Importe gastado (EUR)'] || 0), 0);
        const purchases = filteredByDate.reduce((acc, r) => acc + (r['Compras'] || 0), 0);
        const value = filteredByDate.reduce((acc, r) => acc + (r['Valor de conversión de compras'] || 0), 0);
        const impressions = filteredByDate.reduce((acc, r) => acc + (r['Impresiones'] || 0), 0);
        const clicks = filteredByDate.reduce((acc, r) => acc + (r['Clics en el enlace'] || 0), 0);
        const roas = spend > 0 ? value / spend : 0;
        const cpa = purchases > 0 ? spend / purchases : 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
        return { spend, roas, cpa, ctr, cpm };
    }, [filteredByDate]);

    const topCreatives = useMemo(() => {
        const map = new Map<string, { spend: number; value: number; record: MatchedPerformanceRecord }>();
        filteredByDate.forEach(row => {
            const key = row['Imagen, video y presentación'];
            const entry = map.get(key) || { spend: 0, value: 0, record: row };
            entry.spend += row['Importe gastado (EUR)'] || 0;
            entry.value += row['Valor de conversión de compras'] || 0;
            entry.record = row;
            map.set(key, entry);
        });
        const arr = Array.from(map.values()).map(e => ({
            ...e,
            roas: e.spend > 0 ? e.value / e.spend : 0,
            image: analysisHistory.find(h => selectedClient && h.clientId === selectedClient.id && e.record['Imagen, video y presentación']?.includes(h.filename))?.dataUrl,
            description: analysisHistory.find(h => selectedClient && h.clientId === selectedClient.id && e.record['Imagen, video y presentación']?.includes(h.filename))?.description
        }));
        return arr.sort((a,b) => b.roas - a.roas).slice(0,6);
    }, [filteredByDate, analysisHistory, selectedClient]);

    const handleClientSelect = (client: Client) => {
        setSelectedClient(client);
        setFeedback(null);
        setLastUploadInfo(null);
        setView('detail');
    };

    const handleFileUpload = async (file: File) => {
        if (!selectedClient) return;

        setIsProcessing(true);
        setFeedback({ type: 'info', message: "Procesando reporte..." });
        setLastUploadInfo(null);

        try {
            const fileHash = await getFileHash(file);
            const processedHashes: { [key: string]: string[] } = JSON.parse(localStorage.getItem(PROCESSED_REPORTS_KEY) || '{}');
            if (processedHashes[selectedClient.id]?.includes(fileHash)) {
                throw new Error("Este archivo ya ha sido procesado para este cliente.");
            }

            const workbook = XLSX.read(await file.arrayBuffer(), { type: 'buffer' });
            const parsedData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
            if (parsedData.length === 0) throw new Error("El archivo Excel está vacío o no se pudo leer.");

            const currentClientData = allPerformanceData[selectedClient.id] || [];
            const existingUniqueIds = new Set(currentClientData.map(d => d.uniqueId));
            const recordsToAdd: PerformanceRecord[] = [];
            let duplicateRecords = 0;

            for (const row of parsedData) {
                const uniqueId = `${row['Nombre de la campaña']}_${row['Nombre del conjunto de anuncios']}_${row['Nombre del anuncio']}_${row['Día']}`;
                if (existingUniqueIds.has(uniqueId)) {
                    duplicateRecords++;
                } else {
                    const record: PerformanceRecord = {
                        clientId: selectedClient.id,
                        uniqueId,
                        fileHash,
                        'Nombre de la campaña': row['Nombre de la campaña'],
                        'Nombre del conjunto de anuncios': row['Nombre del conjunto de anuncios'],
                        'Nombre del anuncio': row['Nombre del anuncio'],
                        'Día': row['Día'],
                        'Imagen, video y presentación': row['Imagen, video y presentación'],
                        'Importe gastado (EUR)': parseFloat(row['Importe gastado (EUR)']) || 0,
                        'Entrega de la campaña': row['Entrega de la campaña'],
                        'Entrega del conjunto de anuncios': row['Entrega del conjunto de anuncios'],
                        'Entrega del anuncio': row['Entrega del anuncio'],
                        'Impresiones': parseInt(row['Impresiones']) || 0,
                        'Clics en el enlace': parseInt(row['Clics en el enlace']) || 0,
                        'CPC (Coste por clic)': parseFloat(row['CPC (Coste por clic)']) || 0,
                        'CTR (todos)': parseFloat(row['CTR (todos)']) || 0,
                        'Alcance': parseInt(row['Alcance']) || 0,
                        'Frecuencia': parseFloat(row['Frecuencia']) || 0,
                        'Compras': parseInt(row['Compras']) || 0,
                        'Valor de conversión de compras': parseFloat(row['Valor de conversión de compras']) || 0,
                        'Estado de la entrega': row['Estado de la entrega'],
                        'Nivel de la entrega': row['Nivel de la entrega'],
                        'Objetivo': row['Objetivo'],
                        'Tipo de compra': row['Tipo de compra'],
                        'Inicio del informe': row['Inicio del informe'],
                        'Fin del informe': row['Fin del informe'],
                        'Atencion': parseInt(row['Atencion']) || 0,
                        'Interes': parseInt(row['Interes']) || 0,
                        'Deseo': parseInt(row['Deseo']) || 0,
                    };
                    recordsToAdd.push(record);
                    existingUniqueIds.add(uniqueId);
                }
            }
            
            if (recordsToAdd.length > 0) {
                const newPerformanceData = { ...allPerformanceData, [selectedClient.id]: [...currentClientData, ...recordsToAdd] };
                localStorage.setItem(PERFORMANCE_DATA_KEY, JSON.stringify(newPerformanceData));
                
                const newProcessedHashes = { ...processedHashes, [selectedClient.id]: [...(processedHashes[selectedClient.id] || []), fileHash] };
                localStorage.setItem(PROCESSED_REPORTS_KEY, JSON.stringify(newProcessedHashes));
                
                setClientData(newPerformanceData[selectedClient.id]);
            }
            
            setFeedback({ type: 'success', message: `Proceso completado. ${recordsToAdd.length} registros nuevos añadidos, ${duplicateRecords} duplicados ignorados.` });
            if (recordsToAdd.length > 0) {
                setLastUploadInfo({ clientId: selectedClient.id, fileHash, recordsAdded: recordsToAdd.length });
            }

        } catch (error) {
            console.error("Error processing report:", error);
            const message = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
            setFeedback({ type: 'error', message });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleUndoUpload = () => {
        if (!lastUploadInfo || !selectedClient) return;

        if (!window.confirm(`¿Seguro que quieres deshacer la última subida de ${lastUploadInfo.recordsAdded} registros?`)) return;

        setIsProcessing(true);
        setFeedback({ type: 'info', message: 'Deshaciendo la última subida...' });
        
        // Filter out records from the undone file
        const clientData = allPerformanceData[selectedClient.id] || [];
        const restoredData = clientData.filter(d => d.fileHash !== lastUploadInfo.fileHash);
        const newPerformanceData = { ...allPerformanceData, [selectedClient.id]: restoredData };
        localStorage.setItem(PERFORMANCE_DATA_KEY, JSON.stringify(newPerformanceData));
        setClientData(restoredData);

        // Remove the hash from processed files
        const processedHashes: { [key: string]: string[] } = JSON.parse(localStorage.getItem(PROCESSED_REPORTS_KEY) || '{}');
        const clientHashes = processedHashes[selectedClient.id] || [];
        const restoredHashes = clientHashes.filter(h => h !== lastUploadInfo.fileHash);
        const newProcessedHashes = { ...processedHashes, [selectedClient.id]: restoredHashes };
        localStorage.setItem(PROCESSED_REPORTS_KEY, JSON.stringify(newProcessedHashes));
        
        setFeedback({ type: 'success', message: 'La última subida se ha deshecho correctamente.' });
        setLastUploadInfo(null);
        setIsProcessing(false);
    }
    
    const handleClearClientData = () => {
        if (!selectedClient) return;
        if (!window.confirm(`¿Seguro que quieres eliminar TODOS los datos de rendimiento para ${selectedClient.name}?`)) return;

        setIsProcessing(true);
        const newPerformanceData = { ...allPerformanceData };
        delete newPerformanceData[selectedClient.id];
        localStorage.setItem(PERFORMANCE_DATA_KEY, JSON.stringify(newPerformanceData));

        const processedHashes: { [key: string]: string[] } = JSON.parse(localStorage.getItem(PROCESSED_REPORTS_KEY) || '{}');
        delete processedHashes[selectedClient.id];
        localStorage.setItem(PROCESSED_REPORTS_KEY, JSON.stringify(processedHashes));

        setClientData([]);
        setFeedback({ type: 'success', message: `Datos de ${selectedClient.name} eliminados.` });
        setIsProcessing(false);
    };

    const handleGenerateInsights = async () => {
        if (topCreatives.length === 0 || isGenerating) return;
        setIsGenerating(true);
        try {
            const descriptions = topCreatives.map(c => c.description).filter(Boolean).join('\n');
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const model = ai.getGenerativeModel({ model: 'gemini-pro' });
            const prompt = `Analiza por qué estos creativos funcionaron bien y sugiere próximos pasos:\n${descriptions}`;
            const result = await model.generateContent(prompt);
            const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            setInsights(text);
        } catch (e) {
            console.error('Insights error', e);
            setInsights('Error generando insights');
        } finally {
            setIsGenerating(false);
        }
    };

    if (view === 'list') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                <header className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-brand-text sm:text-5xl">Rendimiento por Cliente</h1>
                    <p className="mt-4 text-lg text-brand-text-secondary">Selecciona un cliente para ver el detalle de sus anuncios y subir nuevos reportes.</p>
                </header>
                <div className="space-y-4">
                    {clientSummaries.map(client => (
                        <button key={client.id} onClick={() => handleClientSelect(client)} className="w-full text-left bg-brand-surface hover:bg-brand-border/50 p-4 rounded-lg shadow-md transition-colors flex items-center gap-4">
                            <img src={client.logo} alt={client.name} className="h-12 w-12 rounded-full object-cover bg-brand-border flex-shrink-0" />
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                <p className="font-bold text-lg text-brand-text col-span-2 md:col-span-1">{client.name}</p>
                                <div className="text-center">
                                    <p className="text-xs text-brand-text-secondary">Gasto</p>
                                    <p className="font-semibold text-brand-text">{client.gastoTotal.toLocaleString('es-ES', { style: 'currency', currency: client.currency })}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-brand-text-secondary">Compras</p>
                                    <p className="font-semibold text-brand-text">{client.comprasTotales}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-brand-text-secondary">ROAS</p>
                                    <p className="font-semibold text-brand-text">{client.roas.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                <span className="text-sm font-bold">{client.matchedCount}/{client.totalAds} Vinculados</span>
                            </div>
                        </button>
                    ))}
                    {clients.length === 0 && <p className="text-center text-brand-text-secondary py-8">No hay clientes. Crea uno en la pestaña de 'Clientes'.</p>}
                </div>
            </div>
        );
    }
    
    if (view === 'detail' && selectedClient) {
        return (
             <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                <button onClick={() => setView('list')} className="self-start -mb-2 bg-brand-border/50 text-brand-text-secondary hover:bg-brand-border px-4 py-2 rounded-md transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Volver a la lista de clientes
                </button>

                <div className="bg-brand-surface rounded-lg p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <img src={selectedClient.logo} alt={selectedClient.name} className="h-16 w-16 rounded-full object-cover bg-brand-border" />
                            <div>
                                <h1 className="text-3xl font-bold text-brand-text">{selectedClient.name}</h1>
                                <p className="text-brand-text-secondary">Análisis de rendimiento de anuncios</p>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto">
                           <ReportUploader onFileUpload={handleFileUpload} disabled={isProcessing} />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row justify-between gap-4 items-center">
                        <div className="flex gap-2 text-sm">
                            <label>
                                Inicio:
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="ml-1 bg-brand-bg border border-brand-border rounded" />
                            </label>
                            <label>
                                Fin:
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="ml-1 bg-brand-bg border border-brand-border rounded" />
                            </label>
                        </div>
                        <button onClick={handleGenerateInsights} disabled={isGenerating} className="bg-brand-primary text-white px-3 py-1 rounded-md text-sm">
                            {isGenerating ? 'Generando...' : 'Analizar ganadores'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4 text-center">
                        <div>
                            <p className="text-xs text-brand-text-secondary">ROAS</p>
                            <p className="font-semibold text-brand-text">{summaryMetrics.roas.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-text-secondary">CPA</p>
                            <p className="font-semibold text-brand-text">{summaryMetrics.cpa.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-text-secondary">CTR</p>
                            <p className="font-semibold text-brand-text">{summaryMetrics.ctr.toFixed(2)}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-text-secondary">CPM</p>
                            <p className="font-semibold text-brand-text">{summaryMetrics.cpm.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-text-secondary">SPEND</p>
                            <p className="font-semibold text-brand-text">{summaryMetrics.spend.toFixed(2)}</p>
                        </div>
                    </div>
                    {topCreatives.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {topCreatives.map((c, i) => (
                                <div key={i} className="text-center">
                                    {c.image ? <img src={c.image} alt="creative" className="w-full rounded-md" /> : <div className="w-full h-32 bg-brand-border rounded-md" />}
                                    <p className="text-xs mt-1">ROAS: {c.roas.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {insights && (
                        <div className="mt-6 bg-brand-border/30 p-4 rounded-md whitespace-pre-wrap text-sm">
                            {insights}
                        </div>
                    )}
                    {feedback && (
                        <div className="mt-4 text-center p-3 rounded-md text-sm font-semibold"
                            style={{
                                backgroundColor: feedback.type === 'info' ? '#3B82F620' : feedback.type === 'success' ? '#22C55E20' : '#EF444420',
                                color: feedback.type === 'info' ? '#60A5FA' : feedback.type === 'success' ? '#4ADE80' : '#F87171'
                            }}>
                               {isProcessing ? 'Procesando...' : feedback.message}
                        </div>
                    )}
                    {lastUploadInfo && lastUploadInfo.clientId === selectedClient.id && !isProcessing && (
                         <div className="mt-4 flex justify-center">
                            <button onClick={handleUndoUpload} className="text-sm text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                                Deshacer Última Subida ({lastUploadInfo.recordsAdded} registros)
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-brand-surface rounded-lg p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-brand-text">Datos de Anuncios</h3>
                            <div className="flex items-center gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-text-secondary">
                                    <input type="checkbox" checked={showMatchedOnly} onChange={(e) => setShowMatchedOnly(e.target.checked)} className="form-checkbox h-4 w-4 bg-brand-bg border-brand-border rounded text-brand-primary focus:ring-brand-primary" />
                                    Mostrar solo anuncios vinculados
                                </label>
                            </div>
                        </div>
                        <button onClick={handleClearClientData} disabled={matchedClientData.length === 0 || isProcessing} className="bg-red-600/20 text-red-400 hover:bg-red-500 hover:text-white disabled:bg-brand-border disabled:text-brand-text-secondary disabled:cursor-not-allowed font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            Limpiar datos del cliente
                        </button>
                    </div>
                    <PerformanceTable data={filteredByDate} showMatchedOnly={showMatchedOnly} />
                </div>
            </div>
        );
    }
    
    return null;
};