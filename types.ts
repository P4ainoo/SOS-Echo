
export type UserRole = 'declarant' | 'analyst' | 'governance';
export type IncidentCategory = 'health' | 'behavior' | 'violence' | 'abuse' | 'other';
export type IncidentStatus = 'pending' | 'processing' | 'false-report' | 'closed';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  userId: string;
  action: string;
  timestamp: number;
  role: UserRole;
}

export interface IncidentReport {
  id: string;
  timestamp: number;
  declarantId: string;
  category: IncidentCategory;
  description: string;
  isAnonymous: boolean;
  programme: string;
  abuserName?: string;
  childName?: string;
  urgency: UrgencyLevel;
  status: IncidentStatus;
  attachments: string[];
  
  // Niveau 2 - Analyst fields
  evaluationSummary?: string;
  actionPlan?: string;
  expertId?: string;
  
  // Niveau 3 - Governance fields
  decisionNote?: string;
  archivedDate?: number;
  governanceId?: string;
  
  auditTrail: AuditLogEntry[];
  
  // AI Metadata
  isAIDetected?: boolean;
  aggressionScore?: number;
  escalationProbability?: number;
  thumbnail?: string;
  observedBehaviors?: string[];
  detectedFaces?: Array<{
    box_2d: [number, number, number, number];
    label: string;
  }>;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface AIResponse {
  aggression_score: number;
  escalation_probability: number;
  risk_level: UrgencyLevel;
  escalation_trend: string;
  observed_behaviors: string[];
  possible_distress_detected: boolean;
  alert_recommended: boolean;
  admin_alert_message: string;
  confidence_score: number;
  incident_summary: string;
  detected_faces?: Array<{
    box_2d: [number, number, number, number];
    label: string;
  }>;
}

export interface AlertLogEntry extends AIResponse {
  id: string;
  timestamp: string;
  imageThumbnail?: string;
}

export interface SystemStats {
  activeCameras: number;
  alertsToday: number;
  avgConfidence: number;
  uptime: string;
}
