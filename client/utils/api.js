const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export const chatAPI = {
    parsePrompt: async (prompt) => {
        try {
            console.log("Calling API with prompt:", prompt);
            console.log("API URL:", `${API_BASE_URL}/chat/parse`);

            const response = await fetch(`${API_BASE_URL}/chat/parse`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt }),
                mode: "cors",
                credentials: "include",
            });

            console.log("API Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("API Response data:", data);
            return data;
        } catch (error) {
            console.error("Error parsing prompt:", error);

            // Check if it's a network error
            if (
                error.message.includes("Failed to fetch") ||
                error.message.includes("Network request failed")
            ) {
                throw new Error(
                    "Unable to connect to server. Please make sure the backend is running on http://localhost:5000"
                );
            }

            throw error;
        }
    },

    getExamples: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/examples`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                mode: "cors",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching examples:", error);
            throw error;
        }
    },

    getContracts: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/contracts`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                mode: "cors",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching contracts:", error);
            throw error;
        }
    },

    // Health check function to test connection
    healthCheck: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: "GET",
                mode: "cors",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Health check failed:", error);
            throw error;
        }
    },
};
