import React from "react";
import { cn } from "@/lib/utils"; // Fonction utilitaire pour combiner les classes Tailwind

interface ProgressProps {
    value: number; // Valeur de progression (entre 0 et 100)
    className?: string; // Classes Tailwind personnalisées
    ariaLabel?: string; // Label pour l'accessibilité
}

const Progress: React.FC<ProgressProps> = ({ value, className, ariaLabel = "Progression" }) => {
    // Limiter la valeur entre 0 et 100
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
        <div
            className={cn("relative w-full h-2 bg-gray-200 rounded-full overflow-hidden", className)}
            role="progressbar"
            aria-valuenow={clampedValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={ariaLabel}
        >
            <div
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${clampedValue}%` }}
            />
        </div>
    );
};

export default Progress;