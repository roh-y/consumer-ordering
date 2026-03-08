import { create } from 'zustand'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatState {
  messages: ChatMessage[]
  sessionId: string | null
  isOpen: boolean
  isLoading: boolean
  addMessage: (role: 'user' | 'assistant', content: string) => void
  setSessionId: (id: string) => void
  setOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: null,
  isOpen: false,
  isLoading: false,

  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { id: `${Date.now()}-${Math.random()}`, role, content, timestamp: Date.now() },
      ],
    })),

  setSessionId: (id) => set({ sessionId: id }),
  setOpen: (open) => set({ isOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearChat: () => set({ messages: [], sessionId: null, isLoading: false }),
}))
