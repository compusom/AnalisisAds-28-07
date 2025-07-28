

import React from 'react';
import { Recommendations } from './Recommendations';
import { AdPreview } from './AdPreview';
import { AnalysisResult, CreativeSet, FormatGroup, OverallConclusion, ChecklistItem, Placement, PlacementId, Client } from '../types';

const severityIcons: Record<ChecklistItem['severity'], JSX.Element> = {
    CRITICAL: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
    ACTIONABLE: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>,
    POSITIVE: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
};


const ConclusionCard: React.FC<{ conclusion: OverallConclusion }> = ({ conclusion }) => {
    return (
        <div className="bg-brand-surface rounded-lg shadow-lg p-6">
            <h2 className="text-xl md:text-2xl font-bold text-brand-text mb-4">{conclusion.headline}</h2>
            <ul className="space-y-3">
                {conclusion.checklist.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                        {severityIcons[item.severity]}
                        <span className="text-brand-text-secondary">{item.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const AnalysisHeader: React.FC<{
    currentClient: Client | undefined;
    formatGroup: FormatGroup;
    creativeSet: CreativeSet;
}> = ({ currentClient, formatGroup, creativeSet }) => {
     const masterSafeZone = { top: '14%', bottom: '20%' };
     const representativePlacementForMasterView: Placement = {
        id: PlacementId.MASTER_VIEW,
        platform: 'Facebook', 
        name: "Vista Consolidada",
        uiType: formatGroup === 'VERTICAL' ? 'STORIES' : 'FEED',
        group: formatGroup,
        aspectRatios: [formatGroup === 'VERTICAL' ? '9:16' : '1:1'],
        recommendedResolution: 'N/A',
        safeZone: masterSafeZone,
    };
    
    if (!currentClient) return <div className="h-48 bg-brand-surface rounded-lg animate-pulse"></div>;

    return (
        <div className="bg-brand-surface rounded-lg shadow-lg p-6 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4">
                    <img src={currentClient.logo} alt={`Logo de ${currentClient.name}`} className="h-16 w-16 rounded-full object-cover bg-brand-border" />
                    <div>
                        <p className="text-sm text-brand-text-secondary">Cliente</p>
                        <h2 className="text-3xl font-bold text-brand-text">{currentClient.name}</h2>
                    </div>
                </div>
                <div className="mt-4 bg-brand-border/50 text-brand-primary font-semibold py-2 px-4 rounded-full inline-block">
                    Análisis para Formatos {formatGroup === 'SQUARE_LIKE' ? 'Cuadrados (1:1)' : 'Verticales (9:16)'}
                </div>
            </div>
            <div className="flex-shrink-0">
                <AdPreview
                    creativeSet={creativeSet}
                    placement={representativePlacementForMasterView}
                    size="large"
                    showUnsafeZones={true}
                />
            </div>
        </div>
    )
}

const LoadingSkeleton: React.FC = () => (
     <div className="space-y-8 animate-pulse">
        <div className="bg-brand-surface rounded-lg p-6 flex flex-col md:flex-row gap-8 items-center justify-between">
             <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-brand-border"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-brand-border rounded w-24"></div>
                        <div className="h-8 bg-brand-border rounded w-48"></div>
                    </div>
                </div>
                <div className="h-8 bg-brand-border/50 rounded-full w-64"></div>
             </div>
             <div className="w-[300px] sm:w-[350px]">
                <div className="relative mx-auto bg-gray-900 border-gray-700 shadow-xl border-[6px] rounded-[1.5rem]">
                    <div className="w-full overflow-hidden bg-brand-bg rounded-[1.2rem] aspect-[1/1] bg-brand-border/50"></div>
                </div>
             </div>
        </div>

        <Recommendations analysisResult={null} isLoading={true} />

        <div className="bg-brand-surface rounded-lg shadow-lg p-6 mt-8">
            <div className="h-6 bg-brand-border rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
                <div className="flex gap-3 items-start"><div className="w-5 h-5 rounded-full bg-brand-border/50 flex-shrink-0"></div><div className="h-4 bg-brand-border rounded w-full"></div></div>
                <div className="flex gap-3 items-start"><div className="w-5 h-5 rounded-full bg-brand-border/50 flex-shrink-0"></div><div className="h-4 bg-brand-border rounded w-5/6"></div></div>
            </div>
        </div>
    </div>
);

interface PlatformAnalysisViewProps {
    formatGroup: FormatGroup;
    analysisResult: AnalysisResult | null;
    isLoading: boolean;
    onGoBack: () => void;
    creativeSet: CreativeSet;
    currentClient: Client | undefined;
}

export const PlatformAnalysisView: React.FC<PlatformAnalysisViewProps> = ({ formatGroup, analysisResult, isLoading, onGoBack, creativeSet, currentClient }) => {

    if (isLoading) {
        return <LoadingSkeleton />;
    }
    
    return (
        <div className="flex flex-col gap-8 animate-fade-in">
             <button 
                onClick={onGoBack} 
                className="self-start -mb-2 bg-brand-border/50 text-brand-text-secondary hover:bg-brand-border px-4 py-2 rounded-md transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Seleccionar otro formato
            </button>

            <AnalysisHeader 
                currentClient={currentClient}
                formatGroup={formatGroup}
                creativeSet={creativeSet}
            />

            <Recommendations analysisResult={analysisResult} isLoading={isLoading} />
            
            {analysisResult && <ConclusionCard conclusion={analysisResult.overallConclusion} />}
        </div>
    );
};
