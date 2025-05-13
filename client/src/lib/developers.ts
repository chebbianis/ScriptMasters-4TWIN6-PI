import API from "./axios-client";

export const getDevelopersQueryFn = async (): Promise<{ developers: any[] }> => {
  try {
    console.log("Fetching developers...");
    const response = await API.get("/user/developers");
    console.log("Developers response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching developers:", error);
    return { developers: [] };
  }
}; 