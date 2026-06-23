# CGE Agenda — Plan d'amélioration UX, Design & Architecture
**Date :** 2026-06-23
**Projet :** cge-agenda_front (Angular 20 + PrimeNG 20 + Tailwind 4)
**Périmètre :** Refactoring complet des composants, système de design, accessibilité, sécurité de la config

---

## 1. Contexte & Diagnostic

### 1.1 Stack technique
- Angular 20 (standalone components, lazy routing)
- PrimeNG 20.4.0 (Aura preset, dark mode via `.app-dark`)
- Tailwind CSS 4.1.11 (PostCSS, CSS-first, pas de config file)
- Keycloak Angular 19.0.2 + keycloak-js 25.0.6
- FullCalendar 6.1.20, Chart.js 4.4.2, jsPDF 4, xlsx 0.18.5

### 1.2 Problèmes identifiés par catégorie

#### Architecture — Sévérité CRITIQUE
| Problème | Fichier(s) | Impact |
|----------|-----------|--------|
| Composants géants (800–1800 lignes) | event-list.ts (1383), event-detail.ts (1395), users.ts (1796), participant-list.ts (870) | Maintenabilité zéro, tests impossibles, bundle size élevé |
| Styles inline dans chaque composant | Tous les composants pages | 300–600 lignes CSS dupliquées par fichier |
| Formulaires template-driven sans validation | org-config.ts, event-create.ts, users.ts | Données corrompues possibles, UX incohérente |
| Subscriptions non nettoyées | event-list.ts (statusTimer) | Fuites mémoire potentielles en navigation |
| Pas de pagination serveur | users.ts | Tous les utilisateurs chargés en mémoire |
| ROLE_META dupliqué | audit-log.ts, profile.ts | Désynchronisation garantie à terme |

#### Configuration & Sécurité — Sévérité HAUTE
| Problème | Fichier | Impact |
|----------|---------|--------|
| URLs Keycloak hardcodées (`localhost:8080`) | keycloak-init.factory.ts | Impossible de déployer sans modifier le code |
| Logout URL hardcodée (`localhost:4200`) | auth.service.ts | Environnements dev/staging/prod non supportés |
| `checkLoginIframe: false` | keycloak-init.factory.ts | Sessions longues expireront sans refresh silencieux |
| Rendu HTML non sécurisé | org-config.ts (iframe email preview) | XSS possible si contenu non contrôlé côté serveur |

#### UX & Design — Sévérité HAUTE
| Problème | Détail |
|----------|--------|
| Absence de design system | Couleurs codées en dur : `#228B22`, `#1565c0`, `#f44336`, etc. partout |
| Pas d'échelle de typographie | Font-sizes : 11px, 12px, 13px, 14px sans système cohérent |
| Pas d'échelle d'espacement | Valeurs arbitraires : `gap: 12px`, `padding: 14px 16px` |
| Affordance row/button | Row `(click)` + boutons avec `stopPropagation()` = confusion utilisateur |
| Pas d'autosave | org-config.ts : modifications perdues sans avertissement à la navigation |
| Polling inefficace | event-list.ts : rafraîchissement global toutes les 5 minutes |

#### Accessibilité — Sévérité HAUTE
| Problème | Fichier(s) |
|----------|-----------|
| Boutons icône sans `ariaLabel` | event-list.ts, corbeille.ts, profile.ts |
| Navigation clavier tables | Lignes cliquables sans `tabindex`/`keydown` |
| Pas de gestion du focus dans les dialogs | Tous les dialogs PrimeNG |
| Pas de `role="alert"` sur les toasts | Tous les composants |
| Contrastes non validés WCAG AA | Gris clair `#bbb`, `#999` sur fond blanc |

---

## 2. Objectifs du plan

1. **Réduire la taille des composants** : aucun composant > 400 lignes de template + logique
2. **Centraliser le design system** : tous les tokens dans `styles.scss`, aucune couleur hardcodée dans les composants
3. **Externaliser les styles** : chaque composant utilise son fichier `.css`/`.scss` dédié, plus de `styles: [...]` inline
4. **Rendre la config environment-aware** : URLs Keycloak et API dans `environments.ts` uniquement
5. **Accessibilité WCAG AA** : 100% des boutons labelisés, navigation clavier fonctionnelle
6. **Pagination serveur** : tous les tableaux admin utilisent une pagination backend

---

## 3. Approche retenue : Refactoring par feature, design system d'abord

Le design system est extrait en premier car il débloque toutes les autres features. Ensuite, chaque feature est refactorée dans un ordre de valeur décroissante (les pages les plus utilisées d'abord).

---

## 4. Plan d'implémentation par phases

### Phase 1 — Design System & Config (Fondation)
**Objectif :** Stabiliser la base avant tout refactoring de composants.

#### 1.1 Centraliser les tokens de design dans `styles.scss`
```scss
/* Couleurs */
--cge-vert:        #0B5C2E;
--cge-vert-moyen:  #228B22;
--cge-vert-clair:  #E8F4EC;
--cge-or:          #D97706;
--cge-or-clair:    #FEF3C7;
--cge-danger:      #DC2626;
--cge-info:        #3B82F6;
--cge-warning:     #F59E0B;

/* Typographie */
--font-xs:   0.6875rem;  /* 11px */
--font-sm:   0.8125rem;  /* 13px */
--font-base: 0.9375rem;  /* 15px */
--font-lg:   1.0625rem;  /* 17px */
--font-xl:   1.25rem;    /* 20px */
--font-2xl:  1.5rem;     /* 24px */
--font-3xl:  2rem;       /* 32px */

/* Espacements */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
```

#### 1.2 Créer un fichier `src/app/models/roles.ts` centralisé
Extraire `ROLE_META` de `audit-log.ts` et `profile.ts` vers un fichier partagé. Toute logique de label/couleur de rôle passe par ce fichier unique.

#### 1.3 Déplacer les URLs hardcodées vers `environments.ts`
```typescript
// environments.ts
export const environment = {
  apiUrl: 'http://localhost:8081/api',
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'asce-lc-realm',
    clientId: 'agenda-cge'
  },
  appUrl: 'http://localhost:4200'
};
```
`keycloak-init.factory.ts` et `auth.service.ts` lisent exclusivement depuis `environment`.

#### 1.4 Activer le silent token refresh
Remplacer `checkLoginIframe: false` par `silentCheckSsoRedirectUri` avec le fichier `assets/silent-check-sso.html` déjà présent dans le projet.

---

### Phase 2 — Refactoring des composants géants

#### 2.1 event-list.ts (1383 lignes → cible < 300 lignes)

**Découpage proposé :**
```
cge-events/
├── event-list.ts                   [Orchestrateur : charge les données, gère le routing]
├── event-list.html                 [Template principal : table + filtres]
├── event-list.css                  [Styles extraits]
├── components/
│   ├── event-filters/              [Barre de filtres : search, type, status, date]
│   ├── event-table/                [Table PrimeNG avec row expand]
│   ├── event-row-actions/          [Boutons d'action par ligne]
│   ├── event-cancel-dialog/        [Dialog annulation]
│   ├── event-postpone-dialog/      [Dialog report]
│   └── event-participant-dialog/   [Dialog gestion participants]
```

**Pattern de communication :**
- `EventListComponent` (smart) → Input/Output vers composants enfants (dumb)
- Dialog state géré dans chaque dialog component, pas dans le parent
- Service `EventListFacadeService` pour les appels API (abstraction de `EventService`)

#### 2.2 event-detail.ts (1395 lignes → cible < 350 lignes)

**Découpage proposé :**
```
components/
├── event-info-card/           [Informations générales de l'événement]
├── event-schedule-list/       [Liste des créneaux (Schedule[])]
├── event-participants-tab/    [Onglet participants avec table]
├── event-files-tab/           [Onglet documents avec upload]
├── event-workflow-panel/      [Panel validation : boutons + commentaires]
└── event-history-timeline/    [Historique des actions (audit trail)]
```

#### 2.3 users.ts (1796 lignes → cible < 400 lignes)

**Découpage proposé :**
```
admin/users/
├── users.ts                   [Smart component : pagination, filtres]
├── users.html
├── users.css
├── components/
│   ├── user-table/            [Table paginée avec filtres côté serveur]
│   ├── user-form-dialog/      [Formulaire create/edit (Reactive Forms)]
│   ├── user-role-editor/      [Editeur de rôles pour un utilisateur]
│   └── user-bulk-actions/     [Actions en masse : désactiver, exporter]
```

**Migration vers pagination serveur :**
```typescript
// Paramètres attendus par le backend
interface UserPageRequest {
  page: number;
  size: number;
  search?: string;
  role?: string;
  sort?: string;
}
```

#### 2.4 participant-list.ts (870 lignes → cible < 300 lignes)

**Découpage proposé :**
```
cge-participants/
├── participant-list.ts
├── components/
│   ├── participant-table/
│   ├── participant-form-dialog/
│   └── participant-import-dialog/
```

---

### Phase 3 — Migration vers Reactive Forms

Les pages concernées : `event-create`, `event-edit`, `org-config`, `users` (formulaire user), `participant` (formulaire participant).

**Pattern standard adopté :**
```typescript
// Exemple pour event-create
this.form = this.fb.group({
  title:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
  description: [''],
  type:        [null, Validators.required],
  startDate:   [null, Validators.required],
  endDate:     [null, Validators.required],
  lieuType:    ['SALLE', Validators.required],
});
```

Règles de validation cross-field (ex: `endDate >= startDate`) via custom validators Angular.

---

### Phase 4 — Accessibilité WCAG AA

**Checklist par composant :**

1. **Tous les boutons icône** → `ariaLabel` obligatoire
2. **Toutes les lignes de table cliquables** → `tabindex="0"`, `(keydown.enter)`, `(keydown.space)`
3. **Dialogs** → `[attr.aria-modal]="true"`, focus piégé dans le dialog, retour du focus à l'élément déclencheur à la fermeture
4. **Toasts** → `<p-toast>` avec `[breakpoints]` + `role="status"` sur le container
5. **Formulaires** → Labels associés via `for`/`id`, erreurs de validation avec `aria-describedby`
6. **Icônes décoratives** → `aria-hidden="true"` systématique
7. **Tables** → `caption` ou `aria-label`, `scope` sur les headers
8. **Animations** → `@media (prefers-reduced-motion: reduce)` sur toutes les transitions

**Contraste WCAG AA minimum :**
- Texte normal : ratio 4.5:1
- Grand texte / icônes UI : ratio 3:1
- Remplacer `#bbb`/`#999` par `var(--text-color-secondary)` partout

---

### Phase 5 — Nettoyage des styles inline

**Règle :** Chaque composant Angular a son fichier `.css` ou `.scss` dédié déclaré dans `styleUrls`. Zéro `styles: [...]` dans le décorateur.

**Migration :**
```typescript
// AVANT (à supprimer)
@Component({
  styles: [`
    .my-class { color: red; ... 600 lignes ... }
  `]
})

// APRÈS
@Component({
  styleUrls: ['./mon-composant.css']
})
```

---

### Phase 6 — Corrections sécurité & config

1. **org-config.ts** : Remplacer le rendu iframe non sécurisé par un rendu Angular template côté client avec DOMPurify ou en passant par le pipe `bypassSecurityTrustHtml` uniquement pour des templates validés côté serveur
2. **Autosave ou guard de navigation** : Ajouter `CanDeactivate` guard sur les pages formulaire (`org-config`, `event-create`, `event-edit`) pour avertir l'utilisateur avant de quitter sans sauvegarder
3. **Keycloak session** : Activer `silentCheckSsoRedirectUri` + `silent-check-sso.html` déjà présent dans `/assets`

---

## 5. Ordre de livraison recommandé

| Priorité | Phase | Tâches | Effort estimé |
|----------|-------|--------|---------------|
| 1 | Phase 1 | Design tokens, ROLE_META centralisé, URLs environments | ~3h |
| 2 | Phase 1 | Silent SSO refresh | ~1h |
| 3 | Phase 2 | Refactoring event-list | ~6h |
| 4 | Phase 2 | Refactoring event-detail | ~6h |
| 5 | Phase 2 | Refactoring users + pagination serveur | ~8h |
| 6 | Phase 2 | Refactoring participant-list | ~4h |
| 7 | Phase 3 | Reactive Forms sur event-create/edit | ~4h |
| 8 | Phase 3 | Reactive Forms sur users/participants | ~3h |
| 9 | Phase 4 | Audit accessibilité + fixes ARIA | ~4h |
| 10 | Phase 5 | Extraction styles inline → fichiers CSS | ~3h |
| 11 | Phase 6 | CanDeactivate guards, sécurité iframe | ~2h |

**Total estimé : ~44h de développement**

---

## 6. Critères de succès

- [ ] Aucun composant dépasse 400 lignes (template + logique)
- [ ] Aucune couleur hexadécimale dans les fichiers `.ts` ou `.html` (uniquement dans `styles.scss` / design tokens)
- [ ] Aucune URL `localhost` dans le code source (sauf `environments.ts`)
- [ ] `ng build --configuration production` passe sans erreur ni warning
- [ ] Tous les boutons icône ont un `ariaLabel`
- [ ] Tous les formulaires utilisent Reactive Forms
- [ ] Pagination serveur sur users, participants, audit-log
- [ ] Pas de fichier `.ts` avec `styles: [...]` contenant plus de 10 lignes

---

## 7. Fichiers à ne pas toucher

- `src/app/init/keycloak-init.factory.ts` — hormis la migration vers `environment`
- `src/assets/layout/_menu.scss` — design sidebar déjà validé (session précédente)
- `src/assets/layout/_topbar.scss` — design topbar déjà validé
- `src/app/pages/cge-calendar/` — page calendrier déjà refactorée

---

## 8. Notes techniques

- **Angular 20 + standalone** : tous les nouveaux composants sont `standalone: true`, pas de NgModule
- **Destruction pattern** : utiliser `takeUntilDestroyed()` (Angular 16+) partout — plus de `Subject` de destroy manuelle
- **Signal-based inputs** : envisager la migration vers `input()` / `output()` pour les nouveaux composants enfants
- **@defer** : utiliser la syntaxe `@defer` d'Angular pour les parties lourdes des templates (tables, charts)
