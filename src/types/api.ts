// ============ Base Types ============

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// ============ Auth ============

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  auth_provider?: 'email' | 'google'
  email_verified?: boolean
  timezone: string | null
  locale: string | null
  transcription_credits_used_cents?: number
  transcription_credits_limit_cents?: number
  created_at: string
  updated_at?: string
  last_login_at?: string | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface Session {
  id: string
  device_name: string | null
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  created_at: string
  is_current: boolean
}

// ============ Projects ============

export interface Project {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ProjectDetail extends Project {
  meeting_count: number
}

export interface ProjectCreate {
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string
  color?: string
  icon?: string
  is_archived?: boolean
}

// ============ Meetings ============

export type MeetingStatus = 'draft' | 'processing' | 'completed' | 'failed'
export type MeetingSourceType = 'audio' | 'text' | 'import'

export interface Meeting {
  id: string
  project_id: string
  audio_upload_id: string | null
  title: string
  status: MeetingStatus
  source_type: MeetingSourceType
  summary: string | null
  key_topics: string[] | null
  action_items: Array<{ point: string; context?: string; outcome?: string; type?: string }> | string | null
  tags: string[] | null
  user_notes: string | null
  scheduled_at: string | null
  ai_processed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface MeetingCreate {
  title: string
  source_type?: MeetingSourceType
  tags?: string[]
  scheduled_at?: string
  user_notes?: string
  audio_upload_id?: string
}

export interface MeetingUpdate {
  title?: string
  tags?: string[]
  user_notes?: string
  summary_edited?: string
}

// ============ Decisions ============

export interface Decision {
  id: string
  meeting_context_id: string
  content: string
  context: string | null
  made_by: string | null
  position: number
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface DecisionCreate {
  content: string
  context?: string
  made_by?: string
}

export interface DecisionUpdate {
  content?: string
  context?: string
  made_by?: string
}

// ============ Audio Uploads ============

export type AudioStatus = 'uploading' | 'uploaded' | 'processing' | 'transcribed' | 'failed'
export type AudioSource = 'upload' | 'zoom' | 'google_meet' | 'microsoft_teams' | 'other'

export interface AudioUpload {
  id: string
  original_filename: string
  file_extension: string
  file_size_bytes: number
  status: AudioStatus
  source: AudioSource
  duration_seconds: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface AudioUploadPresigned {
  upload_id: string
  upload_url: string
  storage_key: string
  expires_in: number
}

export interface AudioUploadCreate {
  original_filename: string
  file_extension: string
  file_size_bytes: number
  content_type?: string
}

// ============ Transcriptions ============

export interface SpeakerSegment {
  speaker: string
  start: number
  end: number
  text: string
}

export interface Transcription {
  id: string
  audio_upload_id: string
  content: string
  language: string | null
  confidence_score: number | null
  word_count: number | null
  model_version: string | null
  processing_time_seconds: number | null
  detected_language: string | null
  speaker_segments: SpeakerSegment[] | null
  speaker_map: Record<string, string> | null
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface TranscriptionJobResponse {
  job_id: string
  status: string
  audio_upload_id: string
}

export interface TranscriptionStartRequest {
  audio_upload_id: string
  project_id: string
  language?: string
  meeting_context_id?: string
  enable_diarization?: boolean
}

// ============ Documents ============

export type DocumentType = 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'md'
export type DocumentStatus = 'generating' | 'ready' | 'failed'

export interface ProjectDocument {
  id: string
  original_filename: string
  file_extension: string
  file_size_bytes: number
  content_type: string | null
  status: 'uploading' | 'uploaded' | 'failed'
  created_at: string
  updated_at: string
}

// ============ Dashboard ============

export interface DashboardStats {
  meetings_this_month: number
  transcribed_hours: number
  decisions_count: number
}

// ============ Analytics ============

export interface MeetingAnalytics {
  total_duration_seconds: number
  total_speakers: number
  total_segments: number
  speaker_stats: Record<string, unknown> | null
  avg_segment_duration_seconds: number | null
  longest_monologue_seconds: number | null
  longest_monologue_speaker: string | null
  silence_percentage: number | null
  meeting_date: string | null
}
