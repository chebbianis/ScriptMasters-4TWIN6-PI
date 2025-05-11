import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";
import { useChatbotStore } from "@/lib/store/chatbot-store";
import { X, RefreshCw, MessageCircle } from "lucide-react";
import { useAuthContext } from "@/context/auth-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Chatbot = () => {
    const { user } = useAuthContext();
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        isLoading,
        error,
        isOpen,
        toggleChatbot,
        sendMessage,
        clearChat,
        setApiKey,
        initializeApi,
    } = useChatbotStore();

    // Initialisation avec la clé API fournie directement dans le code
    useEffect(() => {
        console.log("Initialisation de l'API Gemini...");
        // Clé API codée en dur
        const apiKey = "AIzaSyBKc5AicDSt0Y-1ytc8RTIPmmoWgaBy1jU";
        setApiKey(apiKey);
        initializeApi();
    }, [setApiKey, initializeApi]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        console.log("Envoi du message:", inputValue);
        await sendMessage(inputValue);
        setInputValue("");
    };

    const handleRetryInitialization = () => {
        console.log("Tentative de réinitialisation de l'API...");
        const apiKey = "AIzaSyBKc5AicDSt0Y-1ytc8RTIPmmoWgaBy1jU";
        setApiKey(apiKey);
        initializeApi();
    };

    // Scroll vers le bas à chaque nouveau message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Si l'utilisateur n'est pas connecté, ne pas afficher le chatbot
    if (!user) return null;

    if (!isOpen) {
        return (
            <Button
                onClick={toggleChatbot}
                className="fixed bottom-4 right-4 rounded-full h-12 w-12 p-2 bg-primary hover:bg-primary/90"
                aria-label="Open chat"
            >
                <MessageCircle className="h-6 w-6" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-4 right-4 w-[350px] h-[500px] shadow-lg flex flex-col z-10">
            <CardHeader className="border-b px-4 py-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        💬 Assistant Virtuel
                    </CardTitle>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="h-8 w-8 p-0"
                            title="Effacer le chat"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleChatbot}
                            className="h-8 w-8 p-0"
                            title="Fermer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-3">
                    {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-muted-foreground p-4 text-center">
                            Comment puis-je vous aider aujourd'hui ?
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {messages.map((message) => (
                                <ChatMessage key={message.id} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 text-xs bg-red-50 text-red-500 rounded-md mt-2">
                            <div className="font-semibold mb-1">Erreur:</div>
                            <div>{error}</div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetryInitialization}
                                className="mt-2 text-xs h-7"
                            >
                                Réessayer la connexion
                            </Button>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-2 border-t">
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                    <Input
                        autoFocus
                        placeholder="Tapez votre message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !inputValue.trim()}
                    >
                        {isLoading ? "⏳" : "➤"}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}; 