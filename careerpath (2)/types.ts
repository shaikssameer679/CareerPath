
export enum AppState {
  LOGIN = 'LOGIN',
  PROFILE_SETUP = 'PROFILE_SETUP',
  DASHBOARD = 'DASHBOARD',
  CAREER_EXPLORER = 'CAREER_EXPLORER',
  ROADMAP_CATALOG = 'ROADMAP_CATALOG',
  SURVEY_QUALIFICATIONS = 'SURVEY_QUALIFICATIONS',
  SURVEY_CATEGORY = 'SURVEY_CATEGORY',
  SURVEY_INTERESTS = 'SURVEY_INTERESTS',
  CAREER_SURVEY = 'CAREER_SURVEY',
  RESULTS = 'RESULTS',
  SAVED_ROADMAPS = 'SAVED_ROADMAPS',
  AI_CHAT = 'AI_CHAT',
  RESET_PASSWORD = 'RESET_PASSWORD'
}

export type Qualification = string;

export interface User {
  id?: string;
  numericId?: number; // 5-digit numeric ID
  email: string;
  name?: string;
  avatar?: string;
  description?: string;
  qualification?: string;
}

export interface SurveyData {
  qualification: Qualification;
  preferredIndustry?: string;
  preferredRole?: string;
  interests: string;
  hobbies: string;
  knowledge: string;
  surveyResponses?: {
    mcqs: { question: string, answer: string }[];
    openEnded: { question: string, answer: string }[];
  };
}

export interface CareerRoadmapStep {
  title: string;
  description: string;
  duration: string;
}

export interface CareerSuggestion {
  careerName: string;
  confidenceScore: number;
  reasoning: string;
  requirements: string[];
  coreConcepts: string[];
  roadmap: CareerRoadmapStep[];
  schoolingPathAdvice?: string;
  isMeaningless?: boolean;
}

export interface SavedRoadmap {
  id: number; // 12-digit numeric ID
  user_id: number; // 5-digit numeric ID
  full_name?: string;
  date: string;
  suggestion: CareerSuggestion;
  surveyData: SurveyData;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: number; // 12-digit numeric ID
  user_id?: number; // 5-digit numeric ID
  full_name?: string;
  title: string;
  timestamp: string;
  messages: Message[];
}
