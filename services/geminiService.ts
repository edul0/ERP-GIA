import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

/**
 * Analyzes an image using a multimodal prompt with the Gemini API.
 * @param prompt The text prompt to guide the analysis.
 * @param base64Image The base64-encoded image data.
 * @param imageType The MIME type of the image (e.g., 'image/jpeg').
 * @returns The text response from the model.
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeImage = async (prompt: string, base64Image: string, imageType: string, retries = 2): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: imageType,
                        },
                    },
                ],
            },
        });
        
        return response.text || "Sem resposta.";
    } catch (error: any) {
        if ((error?.status === 429 || error?.message?.toLowerCase().includes('rate')) && retries > 0) {
            console.warn(`Atingiu o rate limit. Tentando novamente em 3 segundos... (Restam ${retries} tentativas)`);
            await delay(3000);
            return analyzeImage(prompt, base64Image, imageType, retries - 1);
        }
        console.error('Error analyzing image with Gemini API:', error);
        if (error?.status === 429 || error?.message?.toLowerCase().includes('rate')) {
             throw new Error('Limite de uso da Inteligência Artificial excedido (Muitas requisições por minuto). Por favor, aguarde de 1 a 2 minutos e tente novamente.');
        }
        throw new Error('Não foi possível obter uma análise da imagem. Verifique o console para mais detalhes.');
    }
};

/**
 * Optimizes cargo delivery sequence using Gemini API.
 */
export const optimizeLogistics = async (driverName: string, currentLocation: any, cargos: any[], retries = 2): Promise<string> => {
    try {
        const prompt = `
            Você é um assistente de logística inteligente para o sistema "ERP GIA".
            O motorista ${driverName} está atualmente em: Lat ${currentLocation.lat}, Lng ${currentLocation.lng}.
            Ele tem as seguintes cargas pendentes:
            ${JSON.stringify(cargos, null, 2)}

            Sua tarefa:
            1. Analise qual carga ele deve focar em entregar AGORA.
            2. Justifique baseando-se em Prioridade (high > medium > low), Prazo (mais próximo primeiro), e Valor da Carga (maior valor tem mais risco/importância).
            3. Dê uma dica de rota baseada na localização atual.
            
            Responda de forma curta, direta e motivadora em Português do Brasil. Use emojis.
            Formate a resposta com:
            **A Melhor Encomenda para Focar:** [Nome da Carga]
            **Por que:** [Justificativa]
            **Dica de Rota:** [Dica curta]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [{ text: prompt }],
            },
        });
        
        return response.text || "Desculpe, não consegui gerar uma sugestão.";
    } catch (error: any) {
        if ((error?.status === 429 || error?.message?.toLowerCase().includes('rate')) && retries > 0) {
            console.warn(`Atingiu o rate limit. Tentando novamente em 3 segundos... (Restam ${retries} tentativas)`);
            await delay(3000);
            return optimizeLogistics(driverName, currentLocation, cargos, retries - 1);
        }
        console.error('Error optimizing logistics with Gemini API:', error);
        if (error?.status === 429 || error?.message?.toLowerCase().includes('rate')) {
            return "Limite de uso da IA atingido. Por favor, aguarde de 1 a 2 minutos antes de gerar novas rotas.";
        }
        return "Desculpe, não consegui otimizar a rota no momento. Tente novamente em alguns instantes.";
    }
};
