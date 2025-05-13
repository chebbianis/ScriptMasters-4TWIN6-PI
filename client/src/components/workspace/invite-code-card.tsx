import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/auth-provider";

export default function InviteCodeCard() {
    const { workspace } = useAuthContext();
    const [copied, setCopied] = useState(false);

    // Générer le lien d'invitation
    const inviteLink = workspace
        ? `${window.location.origin}/invite/workspace/${workspace.inviteCode}/join`
        : '';

    const copyToClipboard = () => {
        if (!inviteLink) return;

        navigator.clipboard.writeText(inviteLink)
            .then(() => {
                setCopied(true);
                toast({
                    title: "Link copied!",
                    description: "The invitation link has been copied to clipboard",
                });

                // Reset state after 2 seconds
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {
                toast({
                    title: "Error",
                    description: "Unable to copy link",
                    variant: "destructive",
                });
            });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invitation Code</CardTitle>
                <CardDescription>
                    Share this link to invite people to join your workspace
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Input
                        readOnly
                        value={inviteLink}
                        className="font-mono text-sm"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={copyToClipboard}
                        className="flex-shrink-0"
                    >
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}