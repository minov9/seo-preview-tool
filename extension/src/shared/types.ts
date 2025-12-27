export type Severity = 'critical' | 'warning' | 'info';

export interface Issue {
    id: string;
    level: Severity;
    title: string;
    detail: string;
    suggestion: string; // Action-oriented advice
}

export interface MetricData {
    value: string;
    pxWidth?: number; // For title/desc
    recommendation?: string;
    status?: 'good' | 'warning' | 'bad';
}

export interface OgData {
    title?: string;
    description?: string;
    image?: string;
    imageWidth?: number;
    imageHeight?: number;
    siteName?: string;
}

export interface TwitterData {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
}

export interface HeaderData {
    count: number;
    text?: string; // Content of the first H1
}

export interface ScanResult {
    url: string;
    title: MetricData;
    description: MetricData;
    canonical: string | null;
    robots: string | null;
    h1: HeaderData;
    og: OgData;
    twitter: TwitterData;
    issues: Issue[];
    metaGeneratedAt: number; // Timestamp
}

export interface ScanMessageResponse {
    success: boolean;
    data?: ScanResult;
    error?: string;
}
