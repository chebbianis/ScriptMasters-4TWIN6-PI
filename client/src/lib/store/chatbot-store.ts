import { create } from 'zustand';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initGemini, generateChatResponse } from '../gemini';

export type ChatMessage = {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
};

type ChatbotState = {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    geminiApi: GoogleGenerativeAI | null;
    apiKey: string;
    isOpen: boolean;
};

type ChatbotActions = {
    setApiKey: (apiKey: string) => void;
    initializeApi: () => void;
    sendMessage: (message: string) => Promise<void>;
    clearChat: () => void;
    toggleChatbot: () => void;
};

export const useChatbotStore = create<ChatbotState & ChatbotActions>((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,
    geminiApi: null,
    apiKey: '',
    isOpen: false,

    setApiKey: (apiKey) => set({ apiKey }),

    initializeApi: () => {
        const { apiKey } = get();
        if (!apiKey) {
            set({ error: "La clé API n'est pas définie." });
            return;
        }

        try {
            const geminiApi = initGemini(apiKey);
            set({ geminiApi, error: geminiApi ? null : "Erreur d'initialisation de l'API Gemini" });
        } catch (error) {
            console.error("Erreur d'initialisation de l'API:", error);
            set({ error: "Erreur d'initialisation de l'API Gemini. Veuillez vérifier votre clé API." });
        }
    },

    sendMessage: async (text) => {
        const { geminiApi, messages } = get();

        if (!geminiApi) {
            set({ error: "L'API Gemini n'est pas initialisée." });
            return;
        }

        // Ajouter le message de l'utilisateur
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: new Date(),
        };

        set({
            messages: [...messages, userMessage],
            isLoading: true,
            error: null
        });

        try {
            // Préparer l'historique pour l'API
            const history = messages.map(msg => ({
                role: msg.role,
                text: msg.text
            }));

            // Générer une réponse
            const response = await generateChatResponse(geminiApi, history, text);

            if (response.success) {
                // Ajouter la réponse du modèle
                const botMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: response.text,
                    timestamp: new Date(),
                };

                set(state => ({
                    messages: [...state.messages, botMessage],
                    isLoading: false
                }));
            } else {
                set({
                    error: "Erreur lors de la génération de la réponse",
                    isLoading: false
                });
            }
        } catch (error) {
            console.error("Erreur détaillée:", error);
            set({
                error: error instanceof Error ? error.message : "Une erreur est survenue",
                isLoading: false
            });
        }
    },

    clearChat: () => set({ messages: [] }),

    toggleChatbot: () => set(state => ({ isOpen: !state.isOpen }))
})); 