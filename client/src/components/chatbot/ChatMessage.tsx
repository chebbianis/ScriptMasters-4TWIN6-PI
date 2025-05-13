import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage as ChatMessageType } from "@/lib/store/chatbot-store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatMessageProps {
    message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
    const isUser = message.role === "user";

    return (
        <div
            className={cn(
                "flex w-full items-start gap-2 p-2",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {!isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src="/images/bot-avatar.svg" alt="Assistant" />
                    <AvatarFallback>AI</AvatarFallback>
                </Avatar>
            )}

            <div
                className={cn(
                    "rounded-lg p-3 max-w-[80%]",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                )}
            >
                <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                <div className="mt-1 text-xs opacity-60">
                    {format(new Date(message.timestamp), "HH:mm")}
                </div>
            </div>

            {isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src="/images/user-avatar.svg" alt="User" />
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}; 