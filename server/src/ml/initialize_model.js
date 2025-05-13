import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin absolu du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin des fichiers source
const sourcePath = path.join(__dirname, 'reccomandation_skills');
const engineersSkillsPath = path.join(sourcePath, 'engineers_skills.csv');
const taskCategoriesPath = path.join(sourcePath, 'Task_catagories.csv');

// Chemin de destination
const destPath = __dirname;
const destEngineersPath = path.join(destPath, 'engineers_skills.csv');
const destTaskPath = path.join(destPath, 'Task_catagories.csv');

// Fonction pour copier les fichiers
export const initializeModelFiles = async () => {
    try {
        console.log('Initialisation des fichiers du modèle de recommandation...');

        // Vérifier si les fichiers source existent
        if (!fs.existsSync(engineersSkillsPath)) {
            console.error(`Fichier non trouvé: ${engineersSkillsPath}`);
            return false;
        }

        if (!fs.existsSync(taskCategoriesPath)) {
            console.error(`Fichier non trouvé: ${taskCategoriesPath}`);
            return false;
        }

        // Copier les fichiers
        fs.copyFileSync(engineersSkillsPath, destEngineersPath);
        console.log(`Fichier copié: ${destEngineersPath}`);

        fs.copyFileSync(taskCategoriesPath, destTaskPath);
        console.log(`Fichier copié: ${destTaskPath}`);

        console.log('Initialisation des fichiers du modèle terminée avec succès.');
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des fichiers du modèle:', error);
        return false;
    }
};

// Exécuter si ce fichier est appelé directement
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    initializeModelFiles().then(success => {
        if (success) {
            console.log('✅ Fichiers du modèle initialisés avec succès.');
        } else {
            console.error('❌ Échec de l\'initialisation des fichiers du modèle.');
        }
    });
}

export default initializeModelFiles; 