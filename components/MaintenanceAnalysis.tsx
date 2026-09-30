
import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';

const MaintenanceAnalysis: React.FC = () => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Qual o problema com esta peça de caminhão? É um pneu furado, um vazamento, desgaste ou outro problema mecânico? Forneça um diagnóstico e possíveis soluções.');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult('');
        }
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleAnalyze = async () => {
        if (!image || !prompt) {
            alert('Por favor, envie uma imagem e descreva o problema.');
            return;
        }
        setIsLoading(true);
        setResult('');
        
        try {
            const base64Image = await fileToBase64(image);
            const analysisResult = await analyzeImage(prompt, base64Image, image.type);
            setResult(analysisResult);
        } catch (error: any) {
            console.error(error);
            setResult(error.message || 'Falha ao analisar a imagem.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-bold text-gray-800 mb-4">1. Enviar Foto da Peça</h2>
                     <label htmlFor="image-upload" className="cursor-pointer block w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 hover:bg-green-50">
                        {preview ? (
                             <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-md" />
                        ) : (
                            <div className="flex flex-col items-center text-gray-500">
                                <UploadIcon className="h-12 w-12 mb-2" />
                                <span>Clique para enviar uma imagem</span>
                                <span className="text-xs mt-1">PNG, JPG, WEBP</span>
                            </div>
                        )}
                     </label>
                    <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">2. Descreva o Problema</h2>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Que tipo de desgaste é esse no pneu?"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 h-28"
                    />
                </div>
                <button onClick={handleAnalyze} disabled={!image || isLoading} className="w-full flex items-center justify-center px-6 py-4 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200">
                    <SparklesIcon className="h-6 w-6 mr-2" />
                    {isLoading ? 'Analisando...' : 'Diagnosticar com IA'}
                </button>
            </div>
            
             <div className="bg-white p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Diagnóstico Preliminar (IA)</h2>
                 <div className="h-full min-h-[300px] bg-gray-50 rounded-md p-4 overflow-y-auto">
                    {isLoading ? (
                         <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                        </div>
                    ) : (
                         <p className="text-gray-700 whitespace-pre-wrap">{result || 'O resultado do diagnóstico aparecerá aqui.'}</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default MaintenanceAnalysis;