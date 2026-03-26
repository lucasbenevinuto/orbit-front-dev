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
  created_at: string
  updated_at?: string
  last_login_at?: string | null
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

// ============ Spaces ============

export interface Space {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  summary: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface SpaceDetail extends Space {
  collection_count: number
  material_count: number
}

export interface SpaceCreate {
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface SpaceUpdate {
  name?: string
  description?: string
  color?: string
  icon?: string
  is_archived?: boolean
}

// ============ Collections ============

export interface Collection {
  id: string
  space_id: string
  user_id: string
  name: string
  description: string | null
  color: string | null
  position: number
  summary: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface CollectionDetail extends Collection {
  material_count: number
}

export interface CollectionCreate {
  name: string
  description?: string
  color?: string
  position?: number
}

export interface CollectionUpdate {
  name?: string
  description?: string
  color?: string
  position?: number
  is_archived?: boolean
}

// ============ Materials ============

export type MaterialType = 'text' | 'pdf' | 'docx' | 'pptx' | 'youtube' | 'url' | 'audio'
export type MaterialStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface Material {
  id: string
  collection_id: string
  user_id: string
  title: string
  material_type: MaterialType
  status: MaterialStatus
  source_url: string | null
  original_filename: string | null
  file_size_bytes: number | null
  summary: string | null
  concepts: string[] | null
  error_message: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export interface MaterialDetail extends Material {
  content_text: string | null
  metadata_extra: Record<string, unknown> | null
  flashcard_count: number
}

export interface MaterialCreateText {
  title: string
  content_text: string
}

export interface MaterialImportYouTube {
  title: string
  source_url: string
}

export interface MaterialUpdate {
  title?: string
}

// ============ Flashcards ============

export type FlashcardStatus = 'new' | 'learning' | 'review'

export interface Flashcard {
  id: string
  material_id: string
  user_id: string
  front: string
  back: string
  status: FlashcardStatus
  easiness_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string | null
  last_reviewed_at: string | null
  review_count: number
  is_ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface FlashcardCreate {
  front: string
  back: string
}

export interface FlashcardReviewResponse {
  flashcard_id: string
  quality: number
  new_easiness_factor: number
  new_interval_days: number
  next_review_at: string
}

export interface FlashcardStudySession {
  cards: Flashcard[]
  total_due: number
}

export interface FlashcardStats {
  total: number
  new: number
  learning: number
  review: number
  due_today: number
  streak_days: number
}

// ============ Chat ============

export interface ChatSession {
  id: string
  user_id: string
  title: string
  space_id: string | null
  collection_id: string | null
  material_id: string | null
  message_count: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  sources: Array<{ material_id: string; title: string; snippet: string }> | null
  token_count: number | null
  created_at: string
}

export interface ChatSessionCreate {
  title?: string
  space_id?: string
  collection_id?: string
  material_id?: string
}

export interface ChatMessageSend {
  content: string
}

// ============ Dashboard ============

export interface KnowledgeDashboardStats {
  total_spaces: number
  total_collections: number
  total_materials: number
  materials_ready: number
  total_flashcards: number
  flashcards_due_today: number
}

// ============ Sessions (auth) ============

export interface Session {
  id: string
  device_name: string | null
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  created_at: string
  is_current: boolean
}
