pipeline {
    agent any
    environment {
        PATH = "/opt/homebrew/bin:$PATH"  // Ajoute le chemin de npm (basé sur ton `which npm`)
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies') {
            steps {
                // Installer les dépendances pour le back-end
                dir('server') {  // Remplace 'server' par le nom réel du dossier back-end si différent
                    sh 'npm install'
                }
                // Installer les dépendances pour le front-end
                dir('client') {  // Remplace 'client' par le nom réel du dossier front-end si différent
                    sh 'npm install'
                }
            }
        }
        stage('Build Frontend') {
            steps {
                dir('client') {
                    sh 'npm run build'  // Construit le front-end avec Vite
                }
            }
        }
        stage('Build Backend') {
            steps {
                dir('server') {
                    // Pas de build nécessaire ici
                    echo 'Backend ready - no build step required'
                }
            }
        }
        stage('SonarQube Analysis') {
          steps {
            script {
                def scannerHome = tool 'sonarQube'
                withSonarQubeEnv {
                    sh "${scannerHome}/bin/sonar-scanner -Dsonar.branch.name=anis-jenkins"
                }
        }
    }
}
    }
}
