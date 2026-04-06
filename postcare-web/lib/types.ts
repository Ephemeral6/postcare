export interface Indicator {
  name: string;
  value: number;
  unit: string;
  reference_low?: number;
  reference_high?: number;
  status: 'normal' | 'mild' | 'high' | 'low' | 'critical';
  direction?: 'high' | 'low';
  explanation: string;
  suggestion: string;
}

export interface ReportResult {
  summary: string;
  indicators: Indicator[];
  attention_items: string[];
  emotion_trigger: 'none' | 'mild' | 'moderate' | 'severe';
}

export interface EmotionResult {
  comfort_message: string;
  action_items: string[];
  emotion_assessment?: {
    intensity: string;
  };
  rational_analysis?: string;
  encouragement?: string;
}

export interface DrugInfo {
  name: string;
  is_tcm?: boolean;
  function_simple?: string;
  dosage: string;
  timing: string;
  relation_to_meal?: string;
  contraindications: string[];
  food_warnings?: string[];
}

export interface MedicationResult {
  drugs: DrugInfo[];
  interactions: {
    drug_a: string;
    drug_b: string;
    severity: string;
    warning: string;
  }[];
  tcm_western_warnings: string[];
  schedule: {
    morning: string[];
    noon: string[];
    evening: string[];
  };
}

export interface PreVisitResult {
  structured_symptoms: {
    main_complaint: string;
    symptom_details: {
      symptom: string;
      duration: string;
      severity: string;
      frequency: string;
    }[];
    suggested_department: string;
    questions_for_doctor: string[];
  };
  pre_visit_tips: string;
}

export interface ChecklistResult {
  checklist: {
    documents: string[];
    preparation: { item: string; detail?: string; importance: 'high' | 'medium' | 'low' }[];
    common_tests: string[];
    estimated_time: string;
    cost_estimate: string;
  };
}

export interface FollowupResult {
  next_checkup: {
    recommended_date: string;
  };
  checkup_items: { item: string; reason: string }[];
  preparation: { instruction: string; time_before: string }[];
  emergency_signs: string[];
}

export interface LifestyleResult {
  diet: {
    should_eat: string[];
    should_avoid: string[];
  };
  exercise: {
    recommended?: string;
    frequency?: string;
    avoid?: string;
    tip?: string;
  };
  habits: {
    must_do: string[];
    avoid: string[];
  };
}

export interface TrendResult {
  trend_direction: string;
  trend_label: string;
  analysis: string;
  next_target: string;
  chart_data: { date: string; value: number }[];
  reference_line: {
    low: number;
    high: number;
  };
}

export interface AlertItem {
  indicator: string;
  value: number;
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
  message: string;
  action: string;
}

export interface AlertResult {
  alert_level: string;
  alerts: AlertItem[];
}

export interface RevisitResult {
  revisit_summary: {
    improvements: {
      indicator: string;
      before: string;
      after: string;
      change: string;
      assessment: string;
    }[];
    concerns: {
      indicator: string;
      before: string;
      after: string;
      change: string;
      assessment: string;
    }[];
    stable: {
      indicator: string;
      before: string;
      after: string;
      change: string;
      assessment: string;
    }[];
    suggested_questions_for_doctor: string[];
  };
  doctor_view: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
