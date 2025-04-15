import EditWorkspaceForm from "@/components/workspace/edit-workspace-form";

const GeneralSettings = () => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Paramètres généraux</h3>
                <p className="text-sm text-muted-foreground">
                    Modifiez les informations de base de votre workspace.
                </p>
            </div>
            <div className="pt-2">
                <EditWorkspaceForm />
            </div>
        </div>
    );
};

export default GeneralSettings; 