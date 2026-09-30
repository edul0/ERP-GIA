/**
 * Inicia o download de um arquivo no navegador como fallback.
 * @param {Blob} blob O conteúdo do arquivo.
 * @param {string} filename O nome do arquivo a ser salvo.
 */
const browserDownload = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


/**
 * Função unificada para download de arquivos que funciona tanto no navegador quanto no Tauri.
 * Ela verifica a disponibilidade das APIs do Tauri e fornece feedback detalhado se não estiverem configuradas.
 * @param {Blob | Uint8Array} data O conteúdo do arquivo como Blob ou Uint8Array.
 * @param {string} filename O nome do arquivo para download.
 */
export const downloadFile = async (data: Blob | Uint8Array, filename: string): Promise<void> => {
  // Acessa as APIs do Tauri a partir do objeto window
  const tauri = (window as any).__TAURI__;
  const tauriDialog = tauri?.dialog;
  const tauriFs = tauri?.fs;

  // Verifica se estamos em um ambiente Tauri com as APIs necessárias habilitadas
  if (tauri && typeof tauriDialog?.save === 'function' && typeof tauriFs?.writeBinaryFile === 'function') {
    try {
      // Abre a caixa de diálogo nativa para "Salvar Como..."
      const filePath = await tauriDialog.save({
        defaultPath: filename,
      });

      // Se o usuário selecionou um caminho (não cancelou), salva o arquivo
      if (filePath) {
        const buffer = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data;
        await tauriFs.writeBinaryFile(filePath, buffer);
      }
    } catch (error) {
      console.error('Falha ao salvar o arquivo via Tauri:', error);
      alert(`Ocorreu um erro ao salvar o arquivo: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    // Se não for Tauri ou as APIs estiverem faltando, usa o download do navegador e informa o usuário.
    let errorMessage = "O download será feito pelo navegador. Para usar a janela de salvamento nativa, ";
    
    if (!tauri) {
      errorMessage += "o ambiente Tauri não foi detectado. Certifique-se de que está executando o aplicativo de desktop.";
    } else if (typeof tauriDialog?.save !== 'function') {
      errorMessage += "habilite a API de diálogo no seu arquivo `tauri.conf.json`: `tauri > allowlist > dialog > save` deve ser `true`.";
    } else if (typeof tauriFs?.writeBinaryFile !== 'function') {
      errorMessage += "habilite a API de sistema de arquivos (fs) no seu `tauri.conf.json`: `tauri > allowlist > fs > writeBinaryFile` deve ser `true`.";
    }
    
    console.warn(errorMessage);
    alert(errorMessage);
    
    const blob = data instanceof Uint8Array ? new Blob([data as any]) : data;
    browserDownload(blob, filename);
  }
};
