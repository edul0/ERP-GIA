import React, { useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { SaveIcon } from './icons/SaveIcon';

interface SettingsProps {
    currentLogo: string | null;
    onLogoChange: (newLogo: string | null) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentLogo, onLogoChange }) => {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveLogo = () => {
        if (logoPreview) {
            onLogoChange(logoPreview);
        }
    };
    
    const handleResetLogo = () => {
        const confirmReset = window.confirm("Tem certeza que deseja redefinir o logotipo para o padrão?");
        if (confirmReset) {
            setLogoPreview(null);
            onLogoChange(null);
        }
    };

    const displayLogo = logoPreview || currentLogo;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
                    Configurações do Sistema
                </h2>
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700">Logotipo da Empresa</h3>
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border">
                            {displayLogo ? (
                                <img src={displayLogo} alt="Logotipo" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <span className="text-gray-400 text-sm p-2 text-center">Logotipo Padrão</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <UploadIcon className="h-5 w-5 mr-2" />
                                Carregar nova imagem
                            </label>
                            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            <p className="text-xs text-gray-500 mt-2">Use PNG, JPG ou SVG. Recomendado: 256x256px.</p>
                        </div>
                    </div>
                     {logoPreview && (
                        <p className="text-sm text-brand-600 bg-brand-50 p-3 rounded-md">
                            Pré-visualização: O novo logotipo está pronto para ser salvo.
                        </p>
                    )}
                    <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                         <button onClick={handleResetLogo} className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors">
                            Redefinir Padrão
                        </button>
                        <button onClick={handleSaveLogo} disabled={!logoPreview} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center transition-colors">
                            <SaveIcon className="h-5 w-5 mr-2" />
                            Salvar Logotipo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;