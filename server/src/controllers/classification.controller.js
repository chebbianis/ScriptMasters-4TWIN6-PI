// src/controllers/classification.controller.js
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPythonCommand = () => {
  if (process.platform === "win32") {
    return { cmd: "py", args: ["-3"] };
  } else {
    return { cmd: "python3", args: [] };
  }
};

export const classifyUsersSummary = async (req, res) => {
  try {
    // 1. Récupération du workspaceId en query param (ex: /api/summary?workspaceId=...)
    const { workspaceId } = req.query;
    const filter = workspaceId ? { workspace: workspaceId } : {};

    // 2. Chargement des utilisateurs depuis MongoDB (name + skills + metrics)
    const users = await User.find(
      filter,
      "name skills experience currentWorkload performanceRating"
    ).lean();

    // 3. Préparation du payload pour le script Python
    const payload = users.map((u) => ({
      id: u._id.toString(),
      skills: u.skills,
      numbers: {
        "Years Experience": u.experience,
        "Current Workload": u.currentWorkload,
        "Performance Rating": u.performanceRating,
      },
    }));

    // 4. Détermination de la commande Python
    const { cmd, args: baseArgs } = getPythonCommand();
    const scriptPath = path.join(__dirname, "../ml/classification/model.py");
    const pyProcess = spawn(cmd, [...baseArgs, scriptPath]);

    let stdoutData = "";
    let stderrData = "";

    pyProcess.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });
    pyProcess.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    // 5. On envoie les données JSON au script Python
    pyProcess.stdin.write(JSON.stringify(payload));
    pyProcess.stdin.end();

    // 6. À la fin de l'exécution Python, on traite la sortie
    pyProcess.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({
          error: "Erreur Python",
          details: stderrData.trim(),
          code,
        });
      }

      let predictions;
      try {
        predictions = JSON.parse(stdoutData);
      } catch (err) {
        return res.status(500).json({
          error: "Erreur de parsing des résultats Python",
          details: err.message,
        });
      }

      // 7. On mappe les noms des users par ID
      const nameById = {};
      users.forEach((u) => {
        nameById[u._id.toString()] = u.name;
      });

      // 8. Construction des objets summary et names
      const summary = {};
      const names = {};

      predictions.forEach(({ id, category }) => {
        // compteur par catégorie
        summary[category] = (summary[category] || 0) + 1;
        // noms par catégorie
        if (!names[category]) {
          names[category] = [];
        }
        names[category].push(nameById[id] || "Unknown");
      });

      // 9. Envoi de la réponse JSON au client
      res.json({
        total: predictions.length,
        summary,
        names,
      });
    });
  } catch (err) {
    res.status(500).json({
      error: "Erreur serveur",
      details: err.message,
    });
  }
};
