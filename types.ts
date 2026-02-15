
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
  
  // Niveau 2 - Analyst fields (Clinical Dossier)
  dpeReport?: string;
  fullEvaluation?: string;
  actionPlan?: string;
  followUpReport?: string;
  finalReport?: string;
  closingNotice?: string;
  currentStep: number; // 1 to 5
  
  // Niveau 3 - Governance fields
  decisionNote?: string;
  archivedDate?: number;
  governanceId?: string;
  
  auditTrail: AuditLogEntry[];
  
  // AI Metadata
  isAIDetected?: boolean;
  aggressionScore?: number;
  escalationProbability?: number;
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
  observed_behaviors: string[];
  alert_recommended: boolean;
  admin_alert_message: string;
  incident_summary: string;
}

export interface AlertLogEntry extends AIResponse {
  id: string;
  timestamp: string;
  imageThumbnail?: string;
}
