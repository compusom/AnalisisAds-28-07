export type Language = 'es' | 'en';

export enum Severity {
    CRITICAL = 'CRITICAL',
    RECOMMENDED = 'RECOMMENDED',
    GOOD_TO_KNOW = 'GOOD_TO_KNOW',
}

export interface RecommendationItem {
    headline: string;
    points: string[];
}

export interface AdvantagePlusRecommendation {
    enhancement: string;
    applicable: 'ACTIVATE' | 'CAUTION';
    justification: string;
}

export interface PlacementSpecificSummary {
    placementId: string;
    summary: string[];
}

export type ChecklistItemSeverity = 'CRITICAL' | 'ACTIONABLE' | 'POSITIVE';

export interface ChecklistItem {
    severity: ChecklistItemSeverity;
    text: string;
}

export interface OverallConclusion {
    headline: string;
    checklist: ChecklistItem[];
}

export interface AnalysisResult {
    creativeDescription: string;
    effectivenessScore: number;
    effectivenessJustification: string;
    clarityScore: number;
    clarityJustification: string;
    textToImageRatio: number;
    textToImageRatioJustification: string;
    funnelStage: 'TOFU' | 'MOFU' | 'BOFU' | 'Error' | 'N/A';
    funnelStageJustification: string;
    recommendations: RecommendationItem[];
    advantagePlusAnalysis: AdvantagePlusRecommendation[];
    placementSummaries: PlacementSpecificSummary[];
    overallConclusion: OverallConclusion;
}

export enum PlacementId {
    FB_FEED,
    FB_VIDEO_FEED,
    FB_STORIES,
    FB_MARKETPLACE,
    FB_REELS,
    IG_FEED,
    IG_STORIES,
    IG_REELS,
    IG_EXPLORE,
    MESSENGER_INBOX,
    MESSENGER_STORIES,
    AUDIENCE_NETWORK,
    MASTER_VIEW,
}

export type UiType = 'FEED' | 'STORIES' | 'REELS' | 'MARKETPLACE' | 'MESSENGER_INBOX' | 'GENERIC';
export type FormatGroup = 'SQUARE_LIKE' | 'VERTICAL';


export interface Placement {
    id: PlacementId;
    platform: 'Facebook' | 'Instagram' | 'Messenger' | 'Audience Network';
    name: string;
    uiType: UiType;
    group: FormatGroup;
    aspectRatios: string[];
    recommendedResolution: string;
    safeZone: {
        top: string;
        bottom: string;
        left?: string;
        right?: string;
    };
}

export interface Creative {
    file: File;
    url: string;
    type: 'image' | 'video';
    width: number;
    height: number;
    format: 'square' | 'vertical';
    hash: string;
}

export type CreativeSet = {
    square: Creative | null;
    vertical: Creative | null;
};

export interface Client {
  id: string;
  name: string;
  logo: string;
  currency: string;
  userId: string;
}

export interface UserAccount {
  id: string;
  name: string;
}

export interface AnalysisHistoryEntry {
  clientId: string;
  filename: string;
  hash: string;
  size: number;
  date: string;
  description: string;
}

export interface PerformanceRecord {
  clientId: string;
  uniqueId: string; // Composite key for deduplication: campaign_adset_ad_day
  fileHash: string; // Hash of the source file for undo functionality
  'Nombre de la campaña': string;
  'Nombre del conjunto de anuncios': string;
  'Nombre del anuncio': string;
  'Día': string;
  'Imagen, video y presentación': string;
  'Importe gastado (EUR)': number;
  'Entrega de la campaña': string;
  'Entrega del conjunto de anuncios': string;
  'Entrega del anuncio': string;
  'Impresiones': number;
  'Clics en el enlace': number;
  'CPC (Coste por clic)': number;
  'CTR (todos)': number;
  'Alcance': number;
  'Frecuencia': number;
  'Compras': number;
  'Valor de conversión de compras': number;
  'Estado de la entrega': string;
  'Nivel de la entrega': string;
  'Objetivo': string;
  'Tipo de compra': string;
  'Inicio del informe': string;
  'Fin del informe': string;
  'Atencion': number;
  'Interes': number;
  'Deseo': number;
}

export interface MatchedPerformanceRecord extends PerformanceRecord {
  isMatched: boolean;
  creativeDescription?: string;
}

export type LastUploadInfo = {
  clientId: string;
  fileHash: string;
  recordsAdded: number;
};