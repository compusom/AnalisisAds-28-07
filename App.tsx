import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Placement, Creative, AnalysisResult, FormatGroup, Language, CreativeSet, Client, AnalysisHistoryEntry } from './types';
import { PLACEMENTS, META_ADS_GUIDELINES } from './constants';
import { FileUpload } from './components/FileUpload';
import { PlatformSelector } from './components/PlatformSelector';
import { PlatformAnalysisView } from './components/PlatformAnalysisView';
import { LanguageSelector } from './components/LanguageSelector';
import { Navbar } from './components/Navbar';
import { SettingsView } from './components/SettingsView';
import { ControlPanelView } from './components/ControlPanelView';
import { ClientManager } from './components/ClientManager';
import { ClientSelectorModal } from './components/ClientSelectorModal';
import { PerformanceView } from './components/PerformanceView';

type View = 'upload' | 'format_selection' | 'format_analysis';
type AppView = 'main' | 'clients' | 'control_panel' | 'settings' | 'performance';
type User = 'admin' | 'user';

const CACHE_KEY_PREFIX = 'metaAdCreativeAnalysis_';
const DB_CONFIG_KEY = 'db_config';
const DB_STATUS_KEY = 'db_status';
const CLIENTS_KEY = 'db_clients';
const ANALYSIS_HISTORY_KEY = 'analysis_history';
const CURRENT_CLIENT_KEY = 'current_client_id';

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

const getFormatAnalysis = async (creativeSet: CreativeSet, formatGroup: FormatGroup, language: Language, context: string): Promise<AnalysisResult | null> => {
    const isSpanish = language === 'es';

    if (!process.env.API_KEY) {
        return { 
            creativeDescription: isSpanish ? "Error: API Key no configurada." : "Error: API Key not set.",
            effectivenessScore: 0,
            effectivenessJustification: isSpanish ? "API Key no configurada." : "API Key not set.",
            clarityScore: 0,
            clarityJustification: isSpanish ? "API Key no configurada." : "API Key not set.",
            textToImageRatio: 0,
            textToImageRatioJustification: isSpanish ? "API Key no configurada." : "API Key not set.",
            funnelStage: "N/A",
            funnelStageJustification: isSpanish ? "API Key no configurada." : "API Key not set.",
            recommendations: [],
            advantagePlusAnalysis: [],
            placementSummaries: [],
            overallConclusion: { 
                headline: isSpanish ? "Error de Configuración" : "Configuration Error",
                checklist: [{ 
                    severity: 'CRITICAL', 
                    text: isSpanish 
                        ? "La API Key de Gemini no está configurada. Por favor, asegúrate de que la variable de entorno API_KEY esté disponible."
                        : "The Gemini API Key is not configured. Please ensure the API_KEY environment variable is available."
                }] 
            },
        };
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const placementsForFormat = PLACEMENTS.filter(p => p.group === formatGroup);
    const placementListForPrompt = placementsForFormat.map(p => `- ${p.name} (ID: ${p.id})`).join('\n');
    const languageInstruction = isSpanish ? 'ESPAÑOL' : 'ENGLISH';

    const prompt = `
      **Instrucción Maestra:**
      Actúas como un director de arte y estratega de marketing para Meta Ads, con un ojo extremadamente crítico, amigable y detallista. Tu tarea es realizar un análisis HOLÍSTICO del creativo proporcionado para el grupo de formatos '${formatGroup}'. Tu análisis debe ser específico, accionable y basarse en el creativo y las especificaciones. TODO el texto de tu respuesta debe estar exclusivamente en ${languageInstruction}.

      **Contexto Adicional:**
      ${context}

      **Paso 0: Comprensión del Objetivo del Creativo (ACCIÓN FUNDAMENTAL):**
      Antes de CUALQUIER otra cosa, tu primera acción es entender a fondo qué está vendiendo o qué oferta clave está comunicando el creativo. Identifica el producto, servicio, o mensaje principal. TODO tu análisis posterior (puntuaciones, justificaciones, recomendaciones) debe estar rigurosamente fundamentado en este objetivo central que has identificado. Esta comprensión inicial es la base de un feedback útil y relevante.

      **Ubicaciones a Considerar en tu Análisis para '${formatGroup}':**
      ${placementListForPrompt}

      **TAREAS DE ANÁLISIS OBLIGATORIAS (Basadas en el Paso 0):**
      
      **1. DESCRIPCIÓN DETALLADA DEL CREATIVO (NUEVO Y CRÍTICO):**
      - **creativeDescription**: Describe la imagen o video de forma precisa y detallada. Menciona los elementos clave (productos, personas, texto principal, ambiente, colores dominantes). Esta descripción es fundamental, ya que se usará como contexto para futuros análisis. Sé específico.

      **2. ANÁLISIS ESTRATÉGICO GLOBAL:**
      - **effectivenessJustification**: Para la justificación de efectividad, sé coherente. Si el puntaje es BAJO (<50), la justificación DEBE explicar por qué el creativo falla en comunicar su objetivo principal. Si es ALTO (>=50), debe resaltar cómo logra exitosamente comunicar dicho objetivo.
      - **textToImageRatio**: Al calcular este porcentaje, ignora por completo los subtítulos generados o incrustados que transcriben el audio. Céntrate únicamente en texto gráfico superpuesto, logos o llamadas a la acción que formen parte del diseño.
      - **recommendations**: Proporciona recomendaciones generales para mejorar cómo el creativo comunica su objetivo.

      **3. ANÁLISIS DE ZONAS DE SEGURIDAD (LA TAREA MÁS IMPORTANTE):**
      - **placementSummaries**: Tu MÁXIMA PRIORIDAD. Analiza el creativo visualmente, frame a frame si es un video. Debes detectar si cualquier elemento (texto, logos, disclaimers, elementos de producto) queda tapado, cortado o resulta ilegible por la interfaz de Meta (botones, perfiles, etc.) EN CUALQUIER MOMENTO. Clasifica estos problemas como CRÍTICOS si afectan el CTA, la oferta o la marca (elementos clave para el objetivo del creativo). Si no hay problemas, indícalo positivamente.

      **4. ANÁLISIS DE MEJORAS ADVANTAGE+:**
      - **advantagePlusAnalysis**: Utiliza el documento "Mejoras automáticas de Meta Advantage+" que se te proporciona más abajo para analizar CADA una de las mejoras listadas en el documento. Indica si se recomienda 'ACTIVATE' o si se debe usar con 'CAUTION', y justifica tu respuesta basándote en cómo la mejora potenciaría (o perjudicaría) el objetivo principal del creativo.

      **5. CONCLUSIÓN FINAL:**
      - **overallConclusion**: Un objeto con un 'headline' conciso y un 'checklist' accionable y priorizado, enfocado en el objetivo del creativo.

      **Formato de Salida Obligatorio (JSON ÚNICAMENTE):**
      Debes responder con un único objeto JSON. TODO el texto debe estar en ${languageInstruction}.

      --- DOCUMENTO DE ESPECIFICACIONES (META ADS Y ADVANTAGE+) ---
      ${META_ADS_GUIDELINES}
      --- FIN DEL DOCUMENTO ---
    `;
    
    const analysisSchema = {
        type: Type.OBJECT,
        properties: {
            creativeDescription: { 
                type: Type.STRING,
                description: 'Una descripción detallada del contenido visual del creativo. Menciona elementos clave como productos, personas, texto, ambiente y colores. Esto se usará como contexto para análisis futuros.'
            },
            effectivenessScore: { type: Type.NUMBER },
            effectivenessJustification: { type: Type.STRING },
            clarityScore: { type: Type.NUMBER },
            clarityJustification: { type: Type.STRING },
            textToImageRatio: { type: Type.NUMBER },
            textToImageRatioJustification: { type: Type.STRING },
            funnelStage: { type: Type.STRING, enum: ['TOFU', 'MOFU', 'BOFU'] },
            funnelStageJustification: { type: Type.STRING },
            recommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        points: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['headline', 'points'],
                },
            },
            advantagePlusAnalysis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        enhancement: { type: Type.STRING },
                        applicable: { type: Type.STRING, enum: ['ACTIVATE', 'CAUTION'] },
                        justification: { type: Type.STRING },
                    },
                    required: ['enhancement', 'applicable', 'justification'],
                },
            },
            placementSummaries: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        placementId: { type: Type.STRING },
                        summary: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['placementId', 'summary'],
                }
            },
            overallConclusion: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING },
                    checklist: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT,
                            properties: {
                                severity: { type: Type.STRING, enum: ['CRITICAL', 'ACTIONABLE', 'POSITIVE'] },
                                text: { type: Type.STRING },
                            },
                            required: ['severity', 'text'],
                        } 
                    },
                },
                required: ['headline', 'checklist'],
            }
        },
        required: [
            'creativeDescription',
            'effectivenessScore', 'effectivenessJustification', 
            'clarityScore', 'clarityJustification',
            'textToImageRatio', 'textToImageRatioJustification',
            'funnelStage', 'funnelStageJustification',
            'recommendations', 'advantagePlusAnalysis', 'placementSummaries', 'overallConclusion'
        ],
    };

    try {
        const parts: ({ text: string; } | { inlineData: { data: string; mimeType: string; }; })[] = [{ text: prompt }];
        const relevantCreative = formatGroup === 'SQUARE_LIKE' ? creativeSet.square : creativeSet.vertical;
        if(relevantCreative) {
            parts.push(await fileToGenerativePart(relevantCreative.file));
        } else if (formatGroup === 'SQUARE_LIKE' && creativeSet.vertical) {
             parts.push(await fileToGenerativePart(creativeSet.vertical.file));
        } else if (formatGroup === 'VERTICAL' && creativeSet.square) {
            parts.push(await fileToGenerativePart(creativeSet.square.file));
        }

        if (parts.length === 1) { 
             return {
                creativeDescription: isSpanish ? "Error: No se proporcionaron creativos." : "Error: No creatives provided.",
                effectivenessScore: 0, effectivenessJustification: "", clarityScore: 0, clarityJustification: "", textToImageRatio: 0, textToImageRatioJustification: "", funnelStage: "N/A", funnelStageJustification: "", recommendations: [], advantagePlusAnalysis: [], placementSummaries: [],
                overallConclusion: { 
                    headline: isSpanish ? "Error" : "Error", 
                    checklist: [{ 
                        severity: 'CRITICAL', 
                        text: isSpanish ? "No se proporcionaron creativos para el análisis." : "No creatives were provided for analysis." 
                    }]
                },
            };
        }
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        if (!response.text) {
             if (response.candidates && response.candidates[0]) {
                const finishReason = response.candidates[0].finishReason;
                let headline, errorMessage;
                switch (finishReason) {
                    case 'SAFETY':
                        headline = isSpanish ? "Respuesta Bloqueada por Seguridad" : "Response Blocked for Safety";
                        errorMessage = isSpanish 
                            ? 'El contenido del creativo puede haber sido identificado como sensible.' 
                            : 'The creative content may have been identified as sensitive.';
                        break;
                    case 'RECITATION':
                         headline = isSpanish ? "Respuesta Bloqueada por Recitación" : "Response Blocked for Recitation";
                         errorMessage = isSpanish 
                            ? 'El contenido es demasiado similar a material protegido por derechos de autor.' 
                            : 'The content is too similar to copyrighted material.';
                        break;
                    case 'MAX_TOKENS':
                         headline = isSpanish ? "Límite de Tokens Alcanzado" : "Token Limit Reached";
                         errorMessage = isSpanish 
                            ? 'Se alcanzó el límite máximo de tokens. Intenta con un creativo más simple.' 
                            : 'The maximum token limit was reached. Try with a simpler creative.';
                        break;
                    default:
                        headline = isSpanish ? "Fallo de Generación" : "Generation Failed";
                        errorMessage = isSpanish 
                            ? `La respuesta de la IA está vacía. Esto puede ocurrir si el modelo no puede procesar el archivo o si la respuesta fue bloqueada por otras razones.`
                            : 'The AI response is empty. This can occur if the model cannot process the file or if the response was blocked for other reasons.';
                }
                return {
                    creativeDescription: "Error", effectivenessScore: 0, effectivenessJustification: "Error", clarityScore: 0, clarityJustification: "Error", textToImageRatio: 0, textToImageRatioJustification: "Error", funnelStage: "Error", funnelStageJustification: "Error", recommendations: [], advantagePlusAnalysis: [], placementSummaries: [],
                    overallConclusion: { headline, checklist: [{ severity: 'CRITICAL', text: errorMessage }] },
                };
            }
            throw new Error(isSpanish 
                ? 'La respuesta de la IA está vacía. Esto puede deberse a que el formato del archivo es inválido (prueba con MP4), el contenido no es claro, o hubo un problema al generar la respuesta estructurada.' 
                : 'The AI response is empty. This might be because the file format is invalid (try MP4), the content is unclear, or there was an issue generating the structured response.');
        }

        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^```json\n?/, '').replace(/```$/, '');
        return JSON.parse(cleanedJson);

    } catch (error) {
        console.error("Error fetching or parsing Gemini recommendations:", error);
        
        let headline = isSpanish ? "Error de Análisis" : "Analysis Error";
        let errorMessage = isSpanish 
            ? "Hubo un error al generar las recomendaciones."
            : "There was an error generating the recommendations.";

        if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        return {
            creativeDescription: "Error", effectivenessScore: 0, effectivenessJustification: "Error", clarityScore: 0, clarityJustification: "Error", textToImageRatio: 0, textToImageRatioJustification: "Error", funnelStage: "Error", funnelStageJustification: "Error", recommendations: [], advantagePlusAnalysis: [], placementSummaries: [],
            overallConclusion: { headline, checklist: [{ severity: 'CRITICAL', text: errorMessage }] },
        };
    }
};

const getFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};


const App: React.FC = () => {
    const [mainView, setMainView] = useState<AppView>('main');
    const [analysisView, setAnalysisView] = useState<View>('upload');
    const [creativeSet, setCreativeSet] = useState<CreativeSet>({ square: null, vertical: null });
    const [selectedFormatGroup, setSelectedFormatGroup] = useState<FormatGroup | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [language, setLanguage] = useState<Language>('es');
    const [currentUser, setCurrentUser] = useState<User>('user');

    const [dbConfig, setDbConfig] = useState(() => {
        const saved = localStorage.getItem(DB_CONFIG_KEY);
        if (saved) return JSON.parse(saved);
        return {
            host: process.env.DB_HOST || '',
            port: process.env.DB_PORT || '',
            user: process.env.DB_USER || '',
            pass: process.env.DB_PASS || '',
            database: process.env.DB_NAME || ''
        };
    });
    const [dbStatus, setDbStatus] = useState<boolean>(false);
    
    const [clients, setClients] = useState<Client[]>(() => {
        try {
            const saved = localStorage.getItem(CLIENTS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse clients from localStorage", e);
            return [];
        }
    });
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryEntry[]>(() => {
        try {
            const saved = localStorage.getItem(ANALYSIS_HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse analysis history from localStorage", e);
            return [];
        }
    });

    const isAdmin = currentUser === 'admin';

    const visibleClients = useMemo(() => {
        if (isAdmin) return clients;
        return clients.filter(c => c.userId === 'user'); // Simple simulation
    }, [clients, isAdmin]);

    const analysisCounts = useMemo(() => {
        const counts: { [clientId: string]: number } = {};
        for (const client of clients) {
            counts[client.id] = 0;
        }
        for (const entry of analysisHistory) {
            if (counts[entry.clientId] !== undefined) {
                counts[entry.clientId]++;
            }
        }
        return counts;
    }, [clients, analysisHistory]);

    useEffect(() => {
        const squareUrl = creativeSet.square?.url;
        const verticalUrl = creativeSet.vertical?.url;
        return () => {
            if (squareUrl) URL.revokeObjectURL(squareUrl);
            if (verticalUrl) URL.revokeObjectURL(verticalUrl);
        };
    }, [creativeSet]);
    
    const handleTestConnection = useCallback(async (config: any): Promise<boolean> => {
        setTesting(true);
        // Simulate API call to test connection
        await new Promise(res => setTimeout(res, 500));
        // Simple validation for simulation
        if (config.host && config.user && config.pass && config.database && config.port) {
            setDbConfig(config);
            setDbStatus(true);
            localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(config));
            localStorage.setItem(DB_STATUS_KEY, 'true');
            setTesting(false);
            return true;
        }
        setDbStatus(false);
        localStorage.removeItem(DB_STATUS_KEY);
        setTesting(false);
        return false;
    }, []);
    
    const [testing, setTesting] = useState(true);
    useEffect(() => {
        // Test connection on initial load
        handleTestConnection(dbConfig);
    }, [handleTestConnection, dbConfig]);


    const processPendingFile = useCallback(async (file: File, clientId: string) => {
        setIsLoading(true);
        localStorage.setItem(CURRENT_CLIENT_KEY, clientId);
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        const element = type === 'image' ? new Image() : document.createElement('video');
        const hash = await getFileHash(file);
        
        element.onload = element.onloadedmetadata = () => {
            const width = type === 'image' ? (element as HTMLImageElement).naturalWidth : (element as HTMLVideoElement).videoWidth;
            const height = type === 'image' ? (element as HTMLImageElement).naturalHeight : (element as HTMLVideoElement).videoHeight;
            const aspectRatio = width / height;

            const newCreative: Creative = { file, url, type, width, height, format: aspectRatio > 0.9 ? 'square' : 'vertical', hash };
            
            setCreativeSet(prev => {
                if(prev.square?.url) URL.revokeObjectURL(prev.square.url);
                if(prev.vertical?.url) URL.revokeObjectURL(prev.vertical.url);
                return { square: newCreative.format === 'square' ? newCreative : null, vertical: newCreative.format === 'vertical' ? newCreative : null };
            });
            setAnalysisView('format_selection');
            setIsLoading(false);
        };

        element.onerror = () => {
            alert(language === 'es' ? 'Error al cargar el archivo. Puede estar corrupto o en un formato no soportado.' : 'Error loading file. It may be corrupt or in an unsupported format.');
            URL.revokeObjectURL(url);
            setIsLoading(false);
        };
        element.src = url;

    }, [language]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!dbStatus) {
            alert(language === 'es' ? 'Por favor, configura y prueba la conexión a la base de datos en la pestaña de Configuración antes de subir un archivo.' : 'Please configure and test the database connection in the Settings tab before uploading a file.');
            setMainView('settings');
            return;
        }
         if (visibleClients.length === 0) {
            alert(language === 'es' ? 'No hay clientes creados. Por favor, crea un cliente en la pestaña de Clientes antes de subir un archivo.' : 'No clients found. Please create a client in the Clients tab before uploading a file.');
            setMainView('clients');
            return;
        }

        setIsLoading(true);
        const hash = await getFileHash(file);
        const { name, size } = file;
        
        const existingEntry = analysisHistory.find(entry => entry.hash === hash && entry.filename === name && entry.size === size);
        setIsLoading(false);

        if (existingEntry) {
            const clientName = clients.find(c => c.id === existingEntry.clientId)?.name || 'un cliente';
            alert(`Este creativo ya fue analizado previamente para ${clientName}. Asignando automáticamente.`);
            processPendingFile(file, existingEntry.clientId);
        } else {
            setPendingFile(file);
            setIsClientModalOpen(true);
        }
    }, [dbStatus, language, clients, visibleClients, analysisHistory, processPendingFile]);


    const handleClientSelected = (clientId: string) => {
        if (pendingFile) {
            processPendingFile(pendingFile, clientId);
        }
        setIsClientModalOpen(false);
        setPendingFile(null);
    };

    const handleFormatSelect = useCallback(async (format: FormatGroup) => {
        if (!creativeSet.square && !creativeSet.vertical) return;
        
        setSelectedFormatGroup(format);
        setAnalysisView('format_analysis');
        setIsLoading(true);
        setAnalysisResult(null);

        const creativeToAnalyze = format === 'SQUARE_LIKE' ? (creativeSet.square || creativeSet.vertical) : (creativeSet.vertical || creativeSet.square);
        if (!creativeToAnalyze) {
            setIsLoading(false); return;
        }
        
        const clientId = localStorage.getItem(CURRENT_CLIENT_KEY);
        const cacheKey = `${CACHE_KEY_PREFIX}${creativeToAnalyze.hash}-${clientId}-${language}-${format}`;
        
        try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const { result, timestamp } = JSON.parse(cachedData);
                const isExpired = Date.now() - timestamp > 48 * 60 * 60 * 1000;
                
                if (!isExpired) {
                    alert(language === 'es' ? 'Se encontró un análisis reciente en caché para este creativo (< 48hs). Mostrando resultados guardados.' : 'A recent analysis for this creative (< 48hs) was found in cache. Displaying saved results.');
                    setAnalysisResult(result);
                    setIsLoading(false);
                    return;
                }
            }
        } catch(e) { console.error("Error reading from cache", e); }


        const clientHistory = analysisHistory.filter((h) => h.clientId === clientId).slice(-15);
        const historyContext = clientHistory.map((h) => `File: ${h.filename}\nDate: ${h.date}\nDescription: ${h.description}`).join('\n\n');
        
        const currentClient = clients.find(c => c.id === clientId);
        const clientContext = currentClient ? `Analizando para el cliente: ${currentClient.name} (Moneda: ${currentClient.currency})` : '';

        const fullContext = `
            ${clientContext}

            A continuación se muestran los datos de los últimos creativos analizados para este cliente. Utiliza esta información para identificar patrones, estilos recurrentes o campañas y adaptar tus recomendaciones para que sean más coherentes y estratégicas con el historial de la cuenta.
            ${historyContext || 'No hay historial previo.'}
        `;
        
        const result = await getFormatAnalysis(creativeSet, format, language, fullContext.trim());

        if (result && !result.overallConclusion.headline.toLowerCase().includes('error')) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify({ result, timestamp: Date.now() }));
                
                const newHistoryEntry: AnalysisHistoryEntry = { 
                    clientId: clientId!,
                    filename: creativeToAnalyze.file.name,
                    hash: creativeToAnalyze.hash,
                    size: creativeToAnalyze.file.size,
                    date: new Date().toISOString(),
                    description: result.creativeDescription 
                };
                const updatedHistory = [...analysisHistory, newHistoryEntry].slice(-100); // Keep history from growing indefinitely
                setAnalysisHistory(updatedHistory);
                localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
            } catch (error) {
                 console.error("Failed to save cache or history to localStorage:", error);
            }
        }
        
        setAnalysisResult(result);
        setIsLoading(false);
    }, [creativeSet, language, clients, analysisHistory]);
    
    const handleReset = () => {
        setCreativeSet({ square: null, vertical: null });
        setSelectedFormatGroup(null);
        setAnalysisResult(null);
        setIsLoading(false);
        setAnalysisView('upload');
    };
    
    const handleDeleteClient = (clientId: string) => {
        if (!window.confirm('¿Seguro que quieres eliminar este cliente?')) return;
        
        if (!window.confirm('CONFIRMACIÓN FINAL: Esta acción es irreversible y eliminará el cliente, todo su historial de análisis y todos sus datos de rendimiento. ¿Continuar?')) return;

        // Update clients
        const updatedClients = clients.filter(c => c.id !== clientId);
        setClients(updatedClients);
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));

        // Update analysis history
        const updatedHistory = analysisHistory.filter(h => h.clientId !== clientId);
        setAnalysisHistory(updatedHistory);
        localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(updatedHistory));

        // Clear performance data from localStorage
        try {
            const perfDataKey = 'ads_performance_data';
            const performanceData = JSON.parse(localStorage.getItem(perfDataKey) || '{}');
            delete performanceData[clientId];
            localStorage.setItem(perfDataKey, JSON.stringify(performanceData));

            const processedReportsKey = 'processed_reports_hashes';
            const processedHashes = JSON.parse(localStorage.getItem(processedReportsKey) || '{}');
            delete processedHashes[clientId];
            localStorage.setItem(processedReportsKey, JSON.stringify(processedHashes));

        } catch (e) {
            console.error("Error cleaning up client data from localStorage", e);
        }
        
        alert('Cliente y todos sus datos asociados han sido eliminados.');
    };

    const renderMainView = () => {
        const hasAnyCreative = creativeSet.square || creativeSet.vertical;

        const headerTextConfig = {
            es: {
                upload: 'Sube tu creativo para empezar.',
                format_selection: 'Tu creativo está listo. Elige un grupo de formatos para analizar.',
                format_analysis: `Análisis para Cliente`
            },
            en: {
                upload: 'Upload your creative to get started.',
                format_selection: 'Your creative is ready. Choose a format group to analyze.',
                format_analysis: `Analysis for Client`
            }
        };

        const currentClientId = localStorage.getItem(CURRENT_CLIENT_KEY);
        const currentClient = clients.find(c => c.id === currentClientId);

        return (
            <>
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-brand-text sm:text-5xl">Meta Ads Creative Assistant</h1>
                    <p className="mt-4 text-lg text-brand-text-secondary">
                        {analysisView === 'format_analysis' ? `${headerTextConfig[language][analysisView]} ${currentClient?.name || ''}` : headerTextConfig[language][analysisView]}
                    </p>
                    {hasAnyCreative && (
                        <div className="mt-6">
                            <button
                                onClick={handleReset}
                                className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2 mx-auto"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566z" clipRule="evenodd" />
                                </svg>
                                {language === 'es' ? 'Cargar Nuevo Creativo' : 'Upload New Creative'}
                            </button>
                        </div>
                    )}
                </header>
                <main>
                    {analysisView === 'upload' && (
                        <div className="max-w-4xl mx-auto">
                            <LanguageSelector language={language} onLanguageChange={setLanguage} />
                            <FileUpload onFileUpload={handleFileUpload} />
                        </div>
                    )}
                    
                    {analysisView === 'format_selection' && hasAnyCreative && (
                        <PlatformSelector onSelectFormat={handleFormatSelect} />
                    )}

                    {analysisView === 'format_analysis' && selectedFormatGroup && (
                        <PlatformAnalysisView
                            formatGroup={selectedFormatGroup}
                            analysisResult={analysisResult}
                            isLoading={isLoading}
                            onGoBack={() => setAnalysisView('format_selection')}
                            creativeSet={creativeSet}
                            currentClient={currentClient}
                        />
                    )}
                </main>
            </>
        )
    }

    return (
        <div className="min-h-screen text-brand-text p-4 sm:p-6 lg:p-8">
            <Navbar 
                currentView={mainView}
                onNavigate={setMainView}
                dbStatus={dbStatus}
                currentUser={currentUser}
                onSwitchUser={setCurrentUser}
                isAdmin={isAdmin}
            />

            {(isLoading || testing) && (
                <div className="fixed inset-0 bg-brand-bg/80 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4">
                         <svg className="animate-spin h-10 w-10 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-lg font-semibold text-brand-text">{testing ? (language === 'es' ? 'Verificando...' : 'Verifying...') : (language === 'es' ? 'Analizando...' : 'Analyzing...')}</p>
                    </div>
                </div>
            )}
            
            {mainView === 'main' && renderMainView()}
            {mainView === 'performance' && <PerformanceView clients={visibleClients} analysisHistory={analysisHistory} />}
            {mainView === 'settings' && <SettingsView initialConfig={dbConfig} onTestConnection={handleTestConnection} dbStatus={dbStatus} />}
            {mainView === 'control_panel' && isAdmin && <ControlPanelView />}
            {mainView === 'clients' && <ClientManager clients={clients} setClients={setClients} currentUser={currentUser} analysisCounts={analysisCounts} onDeleteClient={handleDeleteClient} />}

            <ClientSelectorModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                clients={visibleClients}
                onClientSelect={handleClientSelected}
            />
        </div>
    );
};

export default App;