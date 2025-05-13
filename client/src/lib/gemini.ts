import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialiser l'API avec votre clé API
export const initGemini = (apiKey: string) => {
    try {
        // Utilisation de la version stable de l'API (au lieu de v1beta)
        return new GoogleGenerativeAI(apiKey);
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'API Gemini:', error);
        return null;
    }
};

// Fonction pour générer une réponse du chatbot
export const generateChatResponse = async (
    genAI: GoogleGenerativeAI,
    history: Array<{ role: 'user' | 'model'; text: string }>,
    userMessage: string
) => {
    try {
        // Utiliser le modèle gemini-1.5-flash qui est disponible dans la version actuelle de l'API
        // S'il ne fonctionne pas, essayez gemini-1.5-pro, gemini-1.0-pro ou gemini-pro-latest
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Créer un chat
        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            })),
        });

        // Envoyer le message et recevoir une réponse
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        return { success: true, text };
    } catch (error) {
        console.error('Erreur lors de la génération de réponse Gemini:', error);
        return {
            success: false,
            text: "Désolé, je n'ai pas pu générer une réponse. Veuillez réessayer plus tard."
        };
    }
}; 