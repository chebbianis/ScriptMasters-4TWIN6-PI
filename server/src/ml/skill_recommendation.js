import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import natural from 'natural';
import { spawn } from 'child_process';
import path from 'path';

const tokenizer = new natural.WordTokenizer();

// Fonction pour calculer le score de correspondance des compétences
const calculateSkillMatch = (requiredSkills, developerSkills) => {
    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) return 0;
    if (!Array.isArray(developerSkills) || developerSkills.length === 0) return 0;

    // Normaliser les compétences (minuscules, sans espaces superflus)
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());
    const normalizedDeveloperSkills = developerSkills.map(s => s.toLowerCase().trim());

    // Convertir en ensembles pour éliminer les doublons
    const requiredSet = new Set(normalizedRequiredSkills);
    const developerSet = new Set(normalizedDeveloperSkills);

    // Calculer l'intersection (compétences communes)
    const matchingSkills = [...requiredSet].filter(skill => developerSet.has(skill));
    const matchCount = matchingSkills.length;

    // Calculer le pourcentage de correspondance
    const matchPercentage = requiredSet.size > 0 ? (matchCount / requiredSet.size) : 0;

    console.log(`Compétences requises: [${[...requiredSet].join(', ')}]`);
    console.log(`Compétences du développeur: [${[...developerSet].join(', ')}]`);
    console.log(`Compétences correspondantes: [${matchingSkills.join(', ')}]`);
    console.log(`Score de correspondance: ${Math.round(matchPercentage * 100)}%`);

    return matchPercentage;
};

// Fonction pour exécuter le modèle Python
const runPythonModel = async (inputData) => {
    return new Promise((resolve, reject) => {
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

        // S'assurer que les données d'entrée sont valides
        const sanitizedInput = {
            skillMatch: isNaN(inputData.skillMatch) || inputData.skillMatch == null ? 0 : inputData.skillMatch,
            yearsExperience: isNaN(inputData.yearsExperience) ? 0 : inputData.yearsExperience,
            currentWorkload: isNaN(inputData.currentWorkload) ? 0 : inputData.currentWorkload,
            performanceRating: isNaN(inputData.performanceRating) ? 3.0 : inputData.performanceRating
        };

        console.log('Données envoyées au modèle Python:', sanitizedInput);

        // Si le score de compétences est 0, on peut retourner directement un score très bas
        // pour éviter de recommander des développeurs sans les compétences requises
        if (sanitizedInput.skillMatch === 0) {
            const baseScore = (sanitizedInput.yearsExperience / 10) * 0.2 + (sanitizedInput.performanceRating / 5) * 0.2;
            const normalizedScore = Math.min(0.3, baseScore); // Maximum 30% sans correspondance de compétences
            console.log('Score calculé sans modèle Python:', Math.round(normalizedScore * 100));
            return resolve({ prediction: normalizedScore });
        }

        // Si le score est très faible, limiter également le score final
        if (sanitizedInput.skillMatch < 0.3) {
            const baseScore = (sanitizedInput.skillMatch * 0.5) +
                (sanitizedInput.yearsExperience / 10) * 0.2 +
                (sanitizedInput.performanceRating / 5) * 0.2;
            const normalizedScore = Math.min(0.5, baseScore); // Maximum 50% avec correspondance faible
            console.log('Score calculé sans modèle Python (faible correspondance):', Math.round(normalizedScore * 100));
            return resolve({ prediction: normalizedScore });
        }

        const pythonProcess = spawn(pythonCommand, [
            path.join(process.cwd(), 'src/ml/recommendation_model.py'),
            JSON.stringify(sanitizedInput)
        ]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            console.error('Erreur Python:', data.toString());
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Erreur du processus Python (code ' + code + '):', errorData);

                // Calcul de secours en cas d'échec du modèle Python
                const baseScore =
                    (sanitizedInput.skillMatch * 0.6) +
                    (sanitizedInput.yearsExperience / 10) * 0.2 +
                    (sanitizedInput.performanceRating / 5) * 0.2;
                const normalizedScore = Math.max(0, Math.min(1, baseScore));

                console.log('Score de secours calculé:', Math.round(normalizedScore * 100));
                return resolve({ prediction: normalizedScore });
            }

            try {
                console.log('Sortie Python brute:', outputData);
                const result = JSON.parse(outputData);
                console.log('Prédiction Python analysée:', result);
                return resolve(result);
            } catch (error) {
                console.error('Erreur de parsing de la sortie Python:', error);

                // Calcul de secours en cas d'erreur de parsing
                const baseScore =
                    (sanitizedInput.skillMatch * 0.6) +
                    (sanitizedInput.yearsExperience / 10) * 0.2 +
                    (sanitizedInput.performanceRating / 5) * 0.2;
                const normalizedScore = Math.max(0, Math.min(1, baseScore));

                console.log('Score de secours calculé après erreur de parsing:', Math.round(normalizedScore * 100));
                return resolve({ prediction: normalizedScore });
            }
        });
    });
};

// Fonction principale de recommandation
export const recommendDevelopers = async (projectId) => {
    try {
        console.log('Starting recommendation process for project:', projectId);

        // Récupérer le projet
        const project = await Project.findById(projectId)
            .populate('users', 'name skills experience performanceRating currentWorkload')
            .populate('projectManager', 'name skills');

        if (!project) {
            console.error('Project not found:', projectId);
            throw new Error('Project not found');
        }

        console.log('Project found:', {
            id: project._id,
            name: project.name,
            languages: project.languages || []
        });

        // Récupérer tous les développeurs
        const allDevelopers = await User.find({ role: 'DEVELOPER' });
        console.log('Found developers:', allDevelopers.length);

        if (allDevelopers.length === 0) {
            console.log('No developers found in the system');
            return {
                success: true,
                recommendations: [],
                projectLanguages: project.languages || []
            };
        }

        // Vérifier si le projet a des langages définis
        const projectLanguages = project.languages || [];
        if (projectLanguages.length === 0) {
            console.log('Project has no languages defined');
            return {
                success: true,
                recommendations: [],
                projectLanguages: []
            };
        }

        // Préparer les données pour le modèle et calculer les scores
        const recommendations = await Promise.all(allDevelopers.map(async (developer) => {
            try {
                // Calculer le score de correspondance des compétences
                const skillMatch = calculateSkillMatch(
                    projectLanguages,
                    developer.skills || []
                );

                // Préparer les données pour le modèle Python
                const inputData = {
                    skillMatch,
                    yearsExperience: developer.experience || 0,
                    currentWorkload: developer.currentWorkload || 0,
                    performanceRating: developer.performanceRating || 3.0
                };

                // Obtenir la prédiction du modèle
                const result = await runPythonModel(inputData);

                // Calculer le score final
                // Si la correspondance des compétences est très faible, limiter le score final
                const rawScore = result.prediction;
                let finalScore = rawScore;

                // Appliquer des pénalités pour les développeurs sans compétences requises
                if (skillMatch === 0) {
                    finalScore = Math.min(0.3, rawScore); // Maximum 30% si aucune compétence correspondante
                } else if (skillMatch < 0.5) {
                    finalScore = Math.min(0.6, rawScore); // Maximum 60% si moins de la moitié des compétences
                }

                console.log(`Score final pour ${developer.name}: ${Math.round(finalScore * 100)}%`);

                return {
                    developer,
                    score: Math.round(finalScore * 100),
                    skillMatch: Math.round(skillMatch * 100),
                    experience: developer.experience || 0,
                    performanceRating: developer.performanceRating || 3.0
                };
            } catch (error) {
                console.error(`Error processing developer ${developer.name}:`, error);
                return {
                    developer,
                    score: 0,
                    skillMatch: 0,
                    experience: 0,
                    performanceRating: 0
                };
            }
        }));

        // Trier les recommandations en favorisant les développeurs avec des compétences correspondantes
        const sortedRecommendations = recommendations
            .filter(rec => rec.score > 0) // Filtrer les développeurs avec un score de 0
            .sort((a, b) => {
                // Si l'un a un match de compétences de 0 et l'autre non, prioriser celui qui a des compétences
                if (a.skillMatch === 0 && b.skillMatch > 0) return 1;
                if (a.skillMatch > 0 && b.skillMatch === 0) return -1;

                // Sinon, trier par score global
                return b.score - a.score;
            })
            .slice(0, 5)
            .map(rec => ({
                id: rec.developer._id,
                name: rec.developer.name,
                skills: rec.developer.skills || [],
                score: rec.score,
                skillMatch: rec.skillMatch,
                experience: rec.experience,
                performanceRating: rec.performanceRating
            }));

        console.log('Final recommendations:', sortedRecommendations.length);

        return {
            success: true,
            recommendations: sortedRecommendations,
            projectLanguages: projectLanguages
        };
    } catch (error) {
        console.error('Error in recommendDevelopers:', error);
        throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
}; 