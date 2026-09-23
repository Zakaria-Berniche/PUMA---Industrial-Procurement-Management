# Guide d'Installation de A à Z

Ce guide va vous permettre de préparer votre ordinateur pour pouvoir lire et faire fonctionner le code du logiciel Puma. Nous allons procéder étape par étape.

---

## Étape 1 : Installer le moteur "Node.js"

Le logiciel nécessite un environnement appelé **Node.js** pour pouvoir transformer son code en une véritable application utilisable. Pensez à Node.js comme au moteur indispensable pour faire démarrer votre voiture (le logiciel).

1. Ouvrez votre navigateur internet et allez sur le site officiel : [https://nodejs.org](https://nodejs.org)
2. Vous verrez deux gros boutons verts. Cliquez sur celui qui porte la mention **"LTS"** (Long Term Support). Il s'agit de la version la plus stable et recommandée pour tout le monde.
3. Un fichier d'installation se télécharge. Une fois terminé, cliquez dessus pour le lancer.
4. Suivez l'assistant d'installation en cliquant sur **"Suivant"** ("Next" en anglais), acceptez les conditions générales, et laissez tous les paramètres cochés par défaut. Vous n'avez rien à modifier.
5. À la fin, cliquez sur **"Terminer"** ("Finish"). Node.js est maintenant installé sur votre machine !

---

## Étape 2 : Installer un éditeur de texte (Optionnel mais recommandé)

Si vous souhaitez un jour lire le code source, le modifier, ou si vous devez ouvrir un programme appelé "Terminal" (la boîte de commande noire des informaticiens), le plus simple est d'installer **Visual Studio Code** (gratuit, édité par Microsoft).

1. Allez sur le site officiel : [https://code.visualstudio.com](https://code.visualstudio.com)
2. Cliquez sur le bouton bleu **"Download for Windows"** (Ou Mac si vous êtes sur Apple).
3. Installez le logiciel en faisant toujours **"Suivant"** avec les options par défaut.

---

## Étape 3 : Récupérer le dossier du projet

Maintenant que votre ordinateur est équipé, vous devez posséder le dossier de code du projet sur votre disque dur.

1. Prenez le dossier `puma---industrial-task-management` (Fourni par le développeur, ou téléchargé via un fichier ZIP).
2. Rangez-le dans un endroit facile d'accès sur votre ordinateur (Exemple : `Téléchargements` ou `Documents`).
3. Décompressez le fichier zip si c'en est un.

---

## Étape 4 : Télécharger les "morceaux" de l'application (Modules)

Le dossier que vous possédez ne contient que la "recette" du projet. Il lui manque les ingrédients concrets (les librairies de code partagées) que l'on appelle ici les `node_modules`.

1. Ouvrez l'application **Visual Studio Code** que nous avons installée à l'étape 2.
2. En haut à gauche, cliquez sur `Fichier` > `Ouvrir le dossier...` (Ou `File > Open Folder...`).
3. Choisissez le dossier du projet Puma que vous venez d'enregistrer à l'étape 3 et validez.
4. Dans le menu tout en haut de l'écran, cliquez sur **`Terminal`** puis sur **`Nouveau Terminal`**.
5. Un encart "console" apparaît généralement en bas de l'écran.
6. Cliquez dans cette zone de saisie pour pouvoir y écrire. Tapez EXACTEMENT la commande suivante :

   ```bash
   npm install
   ```

7. Appuyez sur la touche **`Entrée`** de votre clavier.
8. Attendez. Votre ordinateur va lire la recette (le fichier `package.json`) et télécharger tous les ingrédients nécessaires pour l'interface (React) et le serveur (Express). Cela prend généralement de 30 secondes à 3 minutes.
9. **Note sur la base de données :** Vous n'avez rien à installer pour la base de données. Elle sera automatiquement créée sous forme d'un fichier `puma_database.sqlite` lors du premier lancement.

_Félicitations, l'application est officiellement prête à être lancée._

Vous pouvez maintenant passer au fichier **`03_lancement_quotidien.md`**.
