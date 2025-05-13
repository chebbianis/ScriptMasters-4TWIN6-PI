// src/pages/Classification.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { fetchSummaryWithNames, SummaryWithNames } from '@/lib/api';

const Classification: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery<SummaryWithNames, Error>({
    queryKey: ['classificationWithNames'],
    queryFn: fetchSummaryWithNames,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-red-500 p-6">
        Erreur : {error?.message ?? 'Impossible de récupérer les données'}
      </div>
    );
  }

  return (
<div className="p-6 max-w-5xl mx-auto space-y-10">
  <h1 className="text-3xl font-bold text-primary mb-8 text-center">
    Users Classifications
  </h1>

  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
    {Object.entries(data.summary).map(([category, count]) => (
      <div
        key={category}
        className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-muted"
      >
        <h2 className="text-xl font-semibold mb-4">
          <span className="capitalize">{category}</span>
          <span className="ml-2 text-primary font-bold text-2xl">({count})</span>
        </h2>

        {data.names[category]?.length ? (
          <ul className="mt-2 space-y-2 text-muted-foreground max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/30">
            {data.names[category].map((name, idx) => (
              <li 
                key={idx}
                className="flex items-center before:content-['•'] before:text-primary before:mr-2 before:text-lg"
              >
                <span className="truncate">{name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground/70 italic">
            Aucun utilisateur dans cette catégorie
          </p>
        )}
      </div>
    ))}
  </section>
</div>
  );
};

export default Classification;
