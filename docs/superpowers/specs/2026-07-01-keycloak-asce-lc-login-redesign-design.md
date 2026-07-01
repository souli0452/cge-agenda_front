# Refonte du thème de connexion Keycloak ASCE-LC

## Contexte

Le thème de connexion Keycloak `asce-lc` (`themes/asce-lc/login/` dans la distribution Keycloak 26.4.7) est actuellement personnalisé uniquement via CSS (`resources/css/login.css`), sans surcharge de template FreeMarker. Cette approche simule un panneau de marque à gauche via des astuces de positionnement fixe (`body::before`/`body::after`) et injecte du texte via des pseudo-éléments `::before`/`::after` sur des éléments de formulaire non liés (ex. `#kc-form-buttons`).

Cette approche s'est révélée fragile en usage réel :
- Le contenu de marque (accroche, liste de fonctionnalités) disparaît selon l'état du DOM du formulaire (l'élément hôte du pseudo-contenu n'est pas toujours présent).
- Les champs de saisie affichent une "boîte dans la boîte" avec double contour au focus, car le CSS cible l'`<input>` brut alors que PatternFly (le framework du thème de base `keycloak.v2`) l'enveloppe dans un `<span class="pf-v5-c-form-control">` qui garde son style par défaut.
- Le rendu visuel est jugé générique/plat et n'exploite pas l'identité visuelle du logo ASCE-LC (loupe noire, rouge/vert, étoile dorée).

## Objectif

Redessiner la page de connexion pour qu'elle exploite l'identité visuelle ASCE-LC (silhouette de loupe en filigrane, étoile dorée en accent), avec une mise en page en carte encadrée (panneau de marque + formulaire dans un même conteneur, à la manière d'une référence ONEA fournie par l'utilisateur), et en remplaçant les hacks CSS fragiles par une vraie surcharge de template pour la structure.

## Architecture des fichiers

| Fichier | Changement |
|---|---|
| `themes/asce-lc/login/template.ftl` | **Nouveau.** Copie du `template.ftl` du thème de base `keycloak.v2` (macro `registrationLayout`), avec ajout d'un `<aside>` HTML réel pour le panneau de marque (contenu statique : logo, accroche, liste de fonctionnalités, copyright), inséré avant `<main>` dans `.pf-v5-c-login__container`. |
| `themes/asce-lc/login/login.ftl` | **Nouveau.** Copie du `login.ftl` de base, avec `required=true` ajouté aux appels `@field.input`/`@field.password` (active l'astérisque rouge natif de `field.ftl`) et un attribut `placeholder` sur les champs identifiant/mot de passe. |
| `themes/asce-lc/login/resources/css/login.css` | **Réécrit.** Nouvelle mise en page carte/panneau (flexbox réel, plus de `position: fixed` simulant une colonne), motifs du panneau de marque, correction du ciblage des champs (`.pf-v5-c-form-control` au lieu de l'`<input>` seul). |
| `themes/asce-lc/login/resources/img/` | Inchangé (logo existant réutilisé). Le motif de loupe en filigrane est produit en CSS (SVG inline en `background-image` ou `mask`), pas besoin de nouvel asset image. |
| `theme.properties` | Inchangé. |

Les autres pages du realm (mot de passe oublié, OTP, etc.) héritent automatiquement du nouveau panneau de marque via `template.ftl`, sans modification de leur propre contenu de formulaire.

## Structure de page

Une seule carte blanche arrondie (rayon ~24px, ombre portée douce), centrée verticalement et horizontalement sur un fond neutre clair (`#eef0f4`), contenant deux zones côte à côte à l'intérieur du même conteneur :

- **Panneau de marque** (gauche, ~42% de la largeur de la carte) : dégradé vert (`#0f3d12` → `#0a2810` → `#061a07`), coins arrondis à l'intérieur de la carte (haut-gauche et bas-gauche uniquement).
- **Formulaire** (droite, ~58%) : fond blanc, padding généreux (40px).

Sur mobile (< 800px) : le panneau passe en bandeau au-dessus du formulaire (largeur pleine, hauteur réduite, coins arrondis en haut uniquement), le formulaire suit en dessous. Le filigrane de loupe est conservé mais réduit en échelle.

## Panneau de marque

Contenu réel (DOM), plus de pseudo-contenu :
- Logo ASCE-LC en haut à gauche du panneau (format réduit, ~140px de large).
- Grande silhouette de loupe (noire/blanche translucide, opacité ~8-12%), positionnée en diagonale, à grande échelle, débordant légèrement des bords du panneau pour un effet de filigrane dynamique. Réalisée en CSS via un SVG inline en `background-image` (pas de dépendance à un fichier image séparé).
- Une étoile dorée (`#f2c14e` ou proche de l'étoile du logo) en accent ponctuel, petite échelle, positionnée près de l'accroche.
- Accroche : « Gérez votre agenda institutionnel depuis un seul endroit. » (blanc, gras, ~28px).
- Liste de fonctionnalités : « Événements · Participants · Documents · Statistiques » (blanc à faible opacité, ~12px).
- Copyright en bas : « © 2026 ASCE-LC — CGE Agenda » (blanc à très faible opacité).

## Formulaire

- Titre « Connexion » + sous-titre « Bienvenue, accédez à votre espace » directement sous le titre (contenu réel dans `login.ftl`/`template.ftl`, plus de pseudo-contenu positionné par erreur en pied de page).
- Champs avec label au-dessus, astérisque rouge si requis (`required=true`), placeholder discret.
- Icône positionnée **à droite** à l'intérieur du champ : icône personne pour l'identifiant, icône œil déjà native (bouton de bascule de visibilité) pour le mot de passe — restylée pour s'intégrer visuellement.
- Le CSS cible le wrapper réel `.pf-v5-c-form-control` (span autour de l'`<input>`) pour éliminer le bug de double boîte/double contour au focus. Un seul état de focus visuel (bordure verte + ombre portée verte douce), `outline` navigateur neutralisé proprement.
- Ligne « Se souvenir de moi » (case à cocher) + « Mot de passe oublié ? » (lien) alignés sur la même ligne.
- Bouton pleine largeur, vert, avec icône flèche + texte « Se connecter ».
- Lien d'inscription sous la carte, uniquement si activé sur le realm (`realm.registrationAllowed`).

## Hors périmètre

- Pas de changement de contenu/logique sur les autres écrans du realm (reset password, OTP, WebAuthn, etc.) — ils héritent du nouveau panneau de marque via `template.ftl` mais leur formulaire propre n'est pas retouché dans cette itération.
- Pas de nouvel asset image ajouté ; le motif de loupe est produit en CSS/SVG inline.
- Pas de changement du sélecteur de langue ou du header Keycloak natif (restent masqués comme dans la v6).
