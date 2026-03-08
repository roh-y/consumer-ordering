import api from './api'

interface ChatResponse {
  message: string
  sessionId: string
}

export const chatService = {
  sendMessage: (message: string, sessionId?: string) =>
    api.post<ChatResponse>('/agent/chat', { message, sessionId }).then((r) => r.data),
}
