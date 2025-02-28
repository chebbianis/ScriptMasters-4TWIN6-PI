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
                dir('server') {  
                    sh 'npm install'
                }
                // Installer les dépendances pour le front-end
                dir('client') {  
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
                    echo 'Backend prêt - aucune compilation requise'
                }
            }
        }
        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonarQube'
                    withSonarQubeEnv {
                        sh "${scannerHome}/bin/sonar-scanner "
                    }
                }
            }
        }
    }
}