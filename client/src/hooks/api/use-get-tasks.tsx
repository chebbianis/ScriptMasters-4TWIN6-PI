import { useQuery } from "@tanstack/react-query";
// import { testApiConnection } from "@/lib/api";

const useGetTasks = (workspaceId?: string) => {
    // Utilisation de l'API réelle
    // return useQuery({
    //     queryKey: ["test-api"],
    //     queryFn: testApiConnection,
    //     retry: 1,
    //     onError: (error) => {
    //         console.error("Erreur de connexion à l'API:", error);
    //     }
    // });

    const mockData = {
        data: {
            tasks: [],
            pagination: {
                totalCount: 0,
                pageNumber: 1,
                pageSize: 10
            }
        },
        error: null,
        isLoading: false,
        isFetching: false,
        refetch: () => Promise.resolve(mockData)
    };

    return mockData;

};

export default useGetTasks; 