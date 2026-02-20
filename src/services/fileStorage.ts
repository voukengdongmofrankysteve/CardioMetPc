import { invoke } from '@tauri-apps/api/core';

export class FileStorageService {
    static async saveFile(file: File, fileType: 'ECG' | 'ETT'): Promise<string> {
        try {
            const buffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            const dataArray = Array.from(uint8Array);

            const filePath = await invoke<string>('save_medical_file', {
                fileData: dataArray,
                filename: file.name,
                fileType: fileType
            });

            return filePath;
        } catch (error) {
            console.error('Error saving file:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Échec de la sauvegarde du fichier ${file.name}: ${errorMsg}`);
        }
    }

    static async saveFiles(files: File[], fileType: 'ECG' | 'ETT'): Promise<string[]> {
        const filePaths: string[] = [];
        const errors: string[] = [];
        
        for (const file of files) {
            try {
                const path = await this.saveFile(file, fileType);
                filePaths.push(path);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error(`Failed to save ${file.name}:`, errorMsg);
                errors.push(`${file.name}: ${errorMsg}`);
            }
        }
        
        if (errors.length > 0 && filePaths.length === 0) {
            throw new Error(`Tous les fichiers ont échoué:\n${errors.join('\n')}`);
        }
        
        return filePaths;
    }

    static async readFile(filePath: string): Promise<Uint8Array> {
        try {
            const dataArray = await invoke<number[]>('read_medical_file', {
                filePath: filePath
            });

            return new Uint8Array(dataArray);
        } catch (error) {
            console.error('Error reading file:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Échec de la lecture du fichier: ${errorMsg}`);
        }
    }

    static async deleteFile(filePath: string): Promise<void> {
        try {
            await invoke('delete_medical_file', {
                filePath: filePath
            });
        } catch (error) {
            console.error('Error deleting file:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Échec de la suppression du fichier: ${errorMsg}`);
        }
    }

    static async deleteFiles(filePaths: string[]): Promise<void> {
        for (const path of filePaths) {
            try {
                await this.deleteFile(path);
            } catch (error) {
                console.error(`Failed to delete ${path}:`, error);
            }
        }
    }

    static getFileUrl(filePath: string): string {
        return `file://${filePath}`;
    }
}
