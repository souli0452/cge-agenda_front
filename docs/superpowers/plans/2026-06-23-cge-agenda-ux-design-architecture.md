# CGE Agenda — Plan d'implémentation UX, Design & Architecture

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactorer l'application CGE Agenda pour éliminer les composants géants, centraliser le design system, corriger la configuration Keycloak, et atteindre la conformité WCAG AA.

**Architecture:** Chaque composant géant est découpé en smart component (orchestrateur) + dumb components (présentation). Les tokens de design vivent uniquement dans `styles.scss`. Les URLs d'environnement sont exclusivement dans `environments.ts`.

**Tech Stack:** Angular 20 (standalone), PrimeNG 20.4.0 (Aura), Tailwind CSS 4.1.11, Keycloak Angular 19.0.2, RxJS 7.8, TypeScript 5.8

## Global Constraints

- Tous les nouveaux composants sont `standalone: true` — pas de NgModule
- Utiliser `takeUntilDestroyed()` d'Angular 16+ pour toutes les subscriptions — pas de `Subject` destroy manuel
- Aucune couleur hexadécimale dans les `.ts` ou `.html` — uniquement dans `styles.scss` via variables CSS
- Aucune URL `localhost` dans le code source sauf dans `src/environments/environments.ts`
- Commande de vérification build : `npx ng build --configuration development` depuis la racine du projet
- Commande de vérification types : `npx tsc --noEmit`
- Sélecteur de composant : toujours `app-` + kebab-case du nom de fichier
- `ng serve` tourne sur le port 4200 (Keycloak redirect_uri configuré sur ce port)

---

## Carte des fichiers

### Fichiers modifiés
| Fichier | Changement |
|---------|-----------|
| `src/environments/environments.ts` | Ajouter `appUrl`, corriger `clientId` |
| `src/app/init/keycloak-init.factory.ts` | Lire depuis `environments`, activer SSO silencieux |
| `src/app/service/auth.service.ts` | Remplacer URL logout hardcodée |
| `src/assets/styles.scss` | Ajouter tokens typographie + espacement |
| `src/app/models/index.ts` | Exporter `ROLE_META` depuis `roles.ts` |
| `src/app/pages/cge-events/event-list.ts` | Réduire à orchestrateur < 200 lignes |
| `src/app/pages/cge-events/event-list.html` | Template allégé |
| `src/app/pages/cge-events/event-create.ts` | Migrer vers Reactive Forms |
| `src/app/pages/cge-events/event-create.html` | Lier aux FormGroup |
| `src/app/pages/cge-events/event-edit.ts` | Migrer vers Reactive Forms |
| `src/app/pages/cge-events/event-edit.html` | Lier aux FormGroup |
| `src/app/pages/admin/users/users.ts` | Réduire + pagination serveur |
| `src/app/pages/cge-participants/participant-list.ts` | Réduire |
| `src/app/pages/admin/config/org-config.ts` | Retirer iframe unsafe |
| `src/app/pages/admin/audit/audit-log.ts` | Utiliser ROLE_META centralisé |
| `src/app/pages/profile/profile.ts` | Utiliser ROLE_META centralisé |
| `src/app/guards/auth.guard.ts` | Ajouter CanDeactivate export |
| `src/app.routes.ts` | Brancher CanDeactivate sur event-create/edit, org-config |

### Fichiers créés
| Fichier | Responsabilité |
|---------|---------------|
| `src/app/models/roles.ts` | ROLE_META constant + RoleMeta interface |
| `src/app/guards/unsaved-changes.guard.ts` | CanDeactivate pour pages formulaire |
| `src/app/pages/cge-events/components/event-filters/event-filters.ts` | Barre de filtres (search, type, status, date) |
| `src/app/pages/cge-events/components/event-filters/event-filters.html` | Template filtres |
| `src/app/pages/cge-events/components/event-filters/event-filters.css` | Styles filtres |
| `src/app/pages/cge-events/components/event-row-actions/event-row-actions.ts` | Boutons d'action par ligne (eye/edit/delete) |
| `src/app/pages/cge-events/components/event-row-actions/event-row-actions.html` | Template actions |
| `src/app/pages/cge-events/components/event-cancel-dialog/event-cancel-dialog.ts` | Dialog annulation événement |
| `src/app/pages/cge-events/components/event-cancel-dialog/event-cancel-dialog.html` | Template dialog |
| `src/app/pages/cge-events/components/event-postpone-dialog/event-postpone-dialog.ts` | Dialog report événement |
| `src/app/pages/cge-events/components/event-postpone-dialog/event-postpone-dialog.html` | Template dialog |
| `src/app/pages/admin/users/components/user-table/user-table.ts` | Table users paginée |
| `src/app/pages/admin/users/components/user-table/user-table.html` | Template table |
| `src/app/pages/admin/users/components/user-form-dialog/user-form-dialog.ts` | Formulaire ReactiveForm create/edit |
| `src/app/pages/admin/users/components/user-form-dialog/user-form-dialog.html` | Template formulaire |

---

## Task 1 : Centraliser les tokens de design

**Fichiers :**
- Modifier : `src/assets/styles.scss`

**Interfaces :**
- Produit : variables CSS `--font-*`, `--space-*`, `--cge-danger`, `--cge-info`, `--cge-warning` disponibles dans toute l'app

- [ ] **Étape 1 : Ajouter les tokens typographie et espacement dans `styles.scss`**

Ouvrir `src/assets/styles.scss`. Remplacer le bloc `:root` existant (lignes 10-16) par :

```scss
:root {
    /* ---- Couleurs de marque ---- */
    --cge-vert:        #0B5C2E;
    --cge-vert-moyen:  #228B22;
    --cge-vert-clair:  #E8F4EC;
    --cge-or:          #D97706;
    --cge-or-clair:    #FEF3C7;
    --cge-danger:      #DC2626;
    --cge-info:        #3B82F6;
    --cge-warning:     #F59E0B;

    /* ---- Typographie ---- */
    --font-xs:   0.6875rem;
    --font-sm:   0.8125rem;
    --font-base: 0.9375rem;
    --font-lg:   1.0625rem;
    --font-xl:   1.25rem;
    --font-2xl:  1.5rem;
    --font-3xl:  2rem;

    /* ---- Espacements ---- */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-10: 2.5rem;
    --space-12: 3rem;
}
```

- [ ] **Étape 2 : Vérifier le build**

```
npx ng build --configuration development
```

Résultat attendu : `Build at: ... - Hash: ...` sans erreur.

- [ ] **Étape 3 : Commit**

```
git add src/assets/styles.scss
git commit -m "design: centraliser tokens typographie et espacement dans styles.scss"
```

---

## Task 2 : Centraliser ROLE_META

**Fichiers :**
- Créer : `src/app/models/roles.ts`
- Modifier : `src/app/models/index.ts`

**Interfaces :**
- Produit : `RoleMeta` interface + `ROLE_META` constant exportés depuis `src/app/models`
- Consomme : rien (pur utilitaire)

- [ ] **Étape 1 : Créer `src/app/models/roles.ts`**

```typescript
export interface RoleMeta {
    label:    string;
    color:    string;
    bgColor:  string;
    icon:     string;
}

export const ROLE_META: Record<string, RoleMeta> = {
    ADMIN: {
        label:   'Administrateur',
        color:   '#DC2626',
        bgColor: '#FEF2F2',
        icon:    'pi-shield'
    },
    CGE: {
        label:   'CGE',
        color:   '#0B5C2E',
        bgColor: '#E8F4EC',
        icon:    'pi-star'
    },
    DIRECTEUR_CABINET: {
        label:   'Directeur de Cabinet',
        color:   '#7C3AED',
        bgColor: '#F5F3FF',
        icon:    'pi-briefcase'
    },
    PROTOCOLE: {
        label:   'Protocole',
        color:   '#D97706',
        bgColor: '#FEF3C7',
        icon:    'pi-tag'
    },
    SECRETAIRE: {
        label:   'Secrétaire',
        color:   '#2563EB',
        bgColor: '#EFF6FF',
        icon:    'pi-user'
    },
    DELEGUE: {
        label:   'Délégué',
        color:   '#0891B2',
        bgColor: '#ECFEFF',
        icon:    'pi-send'
    },
    USER: {
        label:   'Utilisateur',
        color:   '#6B7280',
        bgColor: '#F9FAFB',
        icon:    'pi-user'
    }
};

/** Retourne le label lisible d'un rôle Keycloak, ou le rôle brut si inconnu. */
export function getRoleLabel(role: string): string {
    return ROLE_META[role]?.label ?? role;
}
```

- [ ] **Étape 2 : Exporter depuis `src/app/models/index.ts`**

Ajouter à la fin du fichier `src/app/models/index.ts` :

```typescript
export { RoleMeta, ROLE_META, getRoleLabel } from './roles';
```

- [ ] **Étape 3 : Remplacer ROLE_META dans `audit-log.ts`**

Dans `src/app/pages/admin/audit/audit-log.ts`, supprimer la déclaration locale `ROLE_META` et ajouter l'import :

```typescript
import { ROLE_META, getRoleLabel } from '../../../models';
```

Remplacer chaque usage de `ROLE_META[role]?.label` par `getRoleLabel(role)`.

- [ ] **Étape 4 : Remplacer ROLE_META dans `profile.ts`**

Dans `src/app/pages/profile/profile.ts`, même opération : supprimer la déclaration locale, importer depuis les models.

- [ ] **Étape 5 : Vérifier les types**

```
npx tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Étape 6 : Commit**

```
git add src/app/models/roles.ts src/app/models/index.ts src/app/pages/admin/audit/audit-log.ts src/app/pages/profile/profile.ts
git commit -m "refactor: centraliser ROLE_META dans models/roles.ts"
```

---

## Task 3 : Corriger la configuration Keycloak et les URLs d'environnement

**Fichiers :**
- Modifier : `src/environments/environments.ts`
- Modifier : `src/app/init/keycloak-init.factory.ts`
- Modifier : `src/app/service/auth.service.ts`
- Modifier : `src/assets/silent-check-sso.html` (vérifier qu'il est correct)

**Interfaces :**
- Consomme : `environments` depuis `src/environments/environments.ts`
- Produit : Keycloak lit depuis `environments.keycloak.*` ; logout utilise `environments.appUrl`

- [ ] **Étape 1 : Corriger `src/environments/environments.ts`**

Le fichier contient déjà les bonnes valeurs. Vérifier que `clientId` correspond à celui déclaré dans Keycloak. La factory utilise `'agenda-cge'` mais `environments.ts` dit `'cge-agenda-client'`. Corriger `environments.ts` pour aligner :

```typescript
export const environments = {
    production: false,
    apiUrl:  'http://localhost:8081/api/v1/cge-agenda',
    appUrl:  'http://localhost:4200',
    keycloak: {
        url:      'http://localhost:8080',
        realm:    'asce-lc-realm',
        clientId: 'agenda-cge'
    }
};
```

> **Note :** Vérifier avec le backend Keycloak lequel des deux (`'agenda-cge'` ou `'cge-agenda-client'`) est le vrai `clientId`. Utiliser celui qui fonctionne.

- [ ] **Étape 2 : Mettre à jour `keycloak-init.factory.ts` pour lire depuis `environments`**

Remplacer le contenu de `src/app/init/keycloak-init.factory.ts` par :

```typescript
import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { environments } from '../../environments/environments';

export function initializeKeycloak(keycloak: KeycloakService, http: HttpClient) {
    return () =>
        keycloak.init({
            config: {
                url:      environments.keycloak.url,
                realm:    environments.keycloak.realm,
                clientId: environments.keycloak.clientId,
            },
            initOptions: {
                onLoad:                    'login-required',
                pkceMethod:                'S256',
                checkLoginIframe:          false,
                silentCheckSsoRedirectUri: `${environments.appUrl}/assets/silent-check-sso.html`,
                adapter:                   'default'
            },
            enableBearerInterceptor: true,
            bearerPrefix:            'Bearer',
            bearerExcludedUrls: [
                '/assets',
                '/api/auth/login'
            ]
        }).then(authenticated => {
            if (authenticated) {
                http.post(`${environments.apiUrl}/auth/track-login`, null)
                    .subscribe({ error: () => {} });
            }
        });
}
```

- [ ] **Étape 3 : Corriger `auth.service.ts` — remplacer le logout hardcodé**

Dans `src/app/service/auth.service.ts`, ajouter l'import :

```typescript
import { environments } from '../../environments/environments';
```

Remplacer la méthode `logout()` :

```typescript
logout(): void {
    this.keycloak.logout(environments.appUrl);
}
```

- [ ] **Étape 4 : Vérifier `silent-check-sso.html`**

Lire `src/assets/silent-check-sso.html`. Son contenu doit être :

```html
<html>
<body>
    <script>
        parent.postMessage(location.href, location.origin);
    </script>
</body>
</html>
```

Si le fichier est différent, le corriger avec ce contenu exact.

- [ ] **Étape 5 : Build de vérification**

```
npx ng build --configuration development
```

Résultat attendu : build réussi sans erreur.

- [ ] **Étape 6 : Commit**

```
git add src/environments/environments.ts src/app/init/keycloak-init.factory.ts src/app/service/auth.service.ts src/assets/silent-check-sso.html
git commit -m "fix: lire config Keycloak depuis environments.ts, activer SSO silencieux"
```

---

## Task 4 : Refactoring event-list — extraction des sous-composants

**Fichiers :**
- Modifier : `src/app/pages/cge-events/event-list.ts` (réduire à < 200 lignes)
- Modifier : `src/app/pages/cge-events/event-list.html`
- Créer : `src/app/pages/cge-events/components/event-filters/event-filters.ts`
- Créer : `src/app/pages/cge-events/components/event-filters/event-filters.html`
- Créer : `src/app/pages/cge-events/components/event-filters/event-filters.css`
- Créer : `src/app/pages/cge-events/components/event-row-actions/event-row-actions.ts`
- Créer : `src/app/pages/cge-events/components/event-row-actions/event-row-actions.html`
- Créer : `src/app/pages/cge-events/components/event-cancel-dialog/event-cancel-dialog.ts`
- Créer : `src/app/pages/cge-events/components/event-cancel-dialog/event-cancel-dialog.html`
- Créer : `src/app/pages/cge-events/components/event-postpone-dialog/event-postpone-dialog.ts`
- Créer : `src/app/pages/cge-events/components/event-postpone-dialog/event-postpone-dialog.html`

**Interfaces :**
- `EventFiltersComponent` produit : `EventFilters` interface via `(filtersChange)` output
- `EventRowActionsComponent` consomme : `event: Event`, `canEdit: boolean`, `canDelete: boolean` ; produit : `(view)`, `(edit)`, `(cancel)`, `(postpone)` outputs
- `EventCancelDialogComponent` consomme : `event: Event | null`, `visible: boolean` ; produit : `(confirmed)` avec motif string, `(cancel)` sans données
- `EventPostponeDialogComponent` consomme : `event: Event | null`, `visible: boolean` ; produit : `(confirmed)` avec nouvelle date, `(cancel)` sans données

- [ ] **Étape 1 : Créer l'interface des filtres dans `event-filters.ts`**

Créer `src/app/pages/cge-events/components/event-filters/event-filters.ts` :

```typescript
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import {
    EVENT_TYPE_OPTIONS,
    EVENT_STATUS_OPTIONS,
    EventType,
    EventStatus
} from '../../../../models';

export interface EventFilters {
    search:     string;
    type:       EventType  | null;
    status:     EventStatus | null;
    dateFrom:   Date | null;
    dateTo:     Date | null;
}

@Component({
    selector: 'app-event-filters',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        IconFieldModule, InputIconModule, InputTextModule,
        Select, ButtonModule
    ],
    templateUrl: './event-filters.html',
    styleUrls:   ['./event-filters.css']
})
export class EventFiltersComponent {
    @Output() filtersChange = new EventEmitter<EventFilters>();

    typeOptions   = EVENT_TYPE_OPTIONS;
    statusOptions = EVENT_STATUS_OPTIONS;

    filters: EventFilters = {
        search:   '',
        type:     null,
        status:   null,
        dateFrom: null,
        dateTo:   null
    };

    emit(): void {
        this.filtersChange.emit({ ...this.filters });
    }

    reset(): void {
        this.filters = { search: '', type: null, status: null, dateFrom: null, dateTo: null };
        this.emit();
    }
}
```

- [ ] **Étape 2 : Créer le template `event-filters.html`**

Créer `src/app/pages/cge-events/components/event-filters/event-filters.html` :

```html
<div class="ef-bar" role="search">
    <label for="ef-search" class="sr-only">Rechercher un événement</label>
    <p-iconfield iconPosition="left" class="ef-search">
        <p-inputicon><i class="pi pi-search" aria-hidden="true"></i></p-inputicon>
        <input pInputText id="ef-search" type="text"
               [(ngModel)]="filters.search"
               (input)="emit()"
               placeholder="Rechercher…"
               autocomplete="off" />
    </p-iconfield>

    <p-select [options]="typeOptions"
              [(ngModel)]="filters.type"
              (onChange)="emit()"
              placeholder="Tous les types"
              ariaLabel="Filtrer par type"
              [showClear]="true"
              styleClass="ef-select">
    </p-select>

    <p-select [options]="statusOptions"
              [(ngModel)]="filters.status"
              (onChange)="emit()"
              placeholder="Tous les statuts"
              ariaLabel="Filtrer par statut"
              [showClear]="true"
              styleClass="ef-select">
    </p-select>

    <p-button icon="pi pi-filter-slash"
              ariaLabel="Réinitialiser les filtres"
              [rounded]="true" [outlined]="true"
              severity="secondary"
              pTooltip="Réinitialiser"
              (onClick)="reset()">
    </p-button>
</div>
```

- [ ] **Étape 3 : Créer `event-filters.css`**

Créer `src/app/pages/cge-events/components/event-filters/event-filters.css` :

```css
.ef-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--surface-card);
    border-radius: var(--border-radius);
    border: 1px solid var(--surface-border);
    margin-bottom: var(--space-4);
}

.ef-search {
    flex: 1;
    min-width: 200px;
}

.ef-select {
    min-width: 180px;
}
```

- [ ] **Étape 4 : Créer `event-row-actions.ts`**

Créer `src/app/pages/cge-events/components/event-row-actions/event-row-actions.ts` :

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Event } from '../../../../models';

@Component({
    selector: 'app-event-row-actions',
    standalone: true,
    imports: [CommonModule, ButtonModule, TooltipModule],
    templateUrl: './event-row-actions.html'
})
export class EventRowActionsComponent {
    @Input({ required: true }) event!: Event;
    @Input() canEdit    = false;
    @Input() canDelete  = false;
    @Input() canCancel  = false;
    @Input() canPostpone = false;

    @Output() view     = new EventEmitter<Event>();
    @Output() edit     = new EventEmitter<Event>();
    @Output() cancel   = new EventEmitter<Event>();
    @Output() postpone = new EventEmitter<Event>();
    @Output() delete   = new EventEmitter<Event>();
}
```

- [ ] **Étape 5 : Créer `event-row-actions.html`**

Créer `src/app/pages/cge-events/components/event-row-actions/event-row-actions.html` :

```html
<div class="flex gap-1" role="group" [attr.aria-label]="'Actions pour ' + event.title">
    <p-button icon="pi pi-eye"
              ariaLabel="Voir les détails"
              [rounded]="true" [text]="true"
              severity="info"
              pTooltip="Voir" tooltipPosition="top"
              (onClick)="view.emit(event); $event.stopPropagation()">
    </p-button>

    <p-button *ngIf="canEdit"
              icon="pi pi-pencil"
              ariaLabel="Modifier l'événement"
              [rounded]="true" [text]="true"
              severity="secondary"
              pTooltip="Modifier" tooltipPosition="top"
              (onClick)="edit.emit(event); $event.stopPropagation()">
    </p-button>

    <p-button *ngIf="canCancel"
              icon="pi pi-ban"
              ariaLabel="Annuler l'événement"
              [rounded]="true" [text]="true"
              severity="warn"
              pTooltip="Annuler" tooltipPosition="top"
              (onClick)="cancel.emit(event); $event.stopPropagation()">
    </p-button>

    <p-button *ngIf="canPostpone"
              icon="pi pi-calendar-times"
              ariaLabel="Reporter l'événement"
              [rounded]="true" [text]="true"
              severity="warn"
              pTooltip="Reporter" tooltipPosition="top"
              (onClick)="postpone.emit(event); $event.stopPropagation()">
    </p-button>

    <p-button *ngIf="canDelete"
              icon="pi pi-trash"
              ariaLabel="Supprimer l'événement"
              [rounded]="true" [text]="true"
              severity="danger"
              pTooltip="Supprimer" tooltipPosition="top"
              (onClick)="delete.emit(event); $event.stopPropagation()">
    </p-button>
</div>
```

- [ ] **Étape 6 : Créer `event-cancel-dialog.ts`**

Créer `src/app/pages/cge-events/components/event-cancel-dialog/event-cancel-dialog.ts` :

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { Event } from '../../../../models';

@Component({
    selector: 'app-event-cancel-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, Dialog, ButtonModule, TextareaModule],
    templateUrl: './event-cancel-dialog.html'
})
export class EventCancelDialogComponent {
    @Input() event:   Event | null = null;
    @Input() visible = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() confirmed     = new EventEmitter<string>();
    @Output() cancelled     = new EventEmitter<void>();

    motif = '';

    confirm(): void {
        if (!this.motif.trim()) return;
        this.confirmed.emit(this.motif.trim());
        this.close();
    }

    close(): void {
        this.motif = '';
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancelled.emit();
    }
}
```

- [ ] **Étape 7 : Créer `event-cancel-dialog.html`**

Créer `src/app/pages/cge-events/components/event-cancel-dialog/event-cancel-dialog.html` :

```html
<p-dialog [(visible)]="visible"
          [modal]="true"
          header="Annuler l'événement"
          [style]="{ width: '480px' }"
          [draggable]="false"
          (onHide)="close()">

    <p *ngIf="event">
        Confirmer l'annulation de <strong>{{ event.title }}</strong> ?
    </p>

    <label for="cancel-motif">Motif d'annulation <span aria-hidden="true">*</span></label>
    <textarea pTextarea id="cancel-motif"
              [(ngModel)]="motif"
              rows="3"
              placeholder="Indiquer le motif…"
              [required]="true"
              style="width:100%; margin-top: var(--space-2)">
    </textarea>

    <ng-template pTemplate="footer">
        <p-button label="Annuler"
                  [text]="true"
                  severity="secondary"
                  (onClick)="close()">
        </p-button>
        <p-button label="Confirmer l'annulation"
                  severity="danger"
                  [disabled]="!motif.trim()"
                  (onClick)="confirm()">
        </p-button>
    </ng-template>
</p-dialog>
```

- [ ] **Étape 8 : Créer `event-postpone-dialog.ts`**

Créer `src/app/pages/cge-events/components/event-postpone-dialog/event-postpone-dialog.ts` :

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { Event } from '../../../../models';

@Component({
    selector: 'app-event-postpone-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, Dialog, ButtonModule, DatePickerModule],
    templateUrl: './event-postpone-dialog.html'
})
export class EventPostponeDialogComponent {
    @Input() event:   Event | null = null;
    @Input() visible = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() confirmed     = new EventEmitter<Date>();
    @Output() cancelled     = new EventEmitter<void>();

    newDate: Date | null = null;
    minDate = new Date();

    confirm(): void {
        if (!this.newDate) return;
        this.confirmed.emit(this.newDate);
        this.close();
    }

    close(): void {
        this.newDate = null;
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancelled.emit();
    }
}
```

- [ ] **Étape 9 : Créer `event-postpone-dialog.html`**

Créer `src/app/pages/cge-events/components/event-postpone-dialog/event-postpone-dialog.html` :

```html
<p-dialog [(visible)]="visible"
          [modal]="true"
          header="Reporter l'événement"
          [style]="{ width: '420px' }"
          [draggable]="false"
          (onHide)="close()">

    <p *ngIf="event">
        Reporter <strong>{{ event.title }}</strong> à quelle date ?
    </p>

    <label for="postpone-date">Nouvelle date <span aria-hidden="true">*</span></label>
    <p-datepicker id="postpone-date"
                  [(ngModel)]="newDate"
                  [minDate]="minDate"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  appendTo="body"
                  style="width:100%; margin-top: var(--space-2)">
    </p-datepicker>

    <ng-template pTemplate="footer">
        <p-button label="Annuler"
                  [text]="true"
                  severity="secondary"
                  (onClick)="close()">
        </p-button>
        <p-button label="Confirmer le report"
                  severity="warn"
                  [disabled]="!newDate"
                  (onClick)="confirm()">
        </p-button>
    </ng-template>
</p-dialog>
```

- [ ] **Étape 10 : Refactorer `event-list.ts` pour utiliser les sous-composants**

Remplacer le début du fichier `src/app/pages/cge-events/event-list.ts` (la section `imports` du `@Component`) pour inclure les nouveaux composants :

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventFiltersComponent, EventFilters } from './components/event-filters/event-filters';
import { EventRowActionsComponent } from './components/event-row-actions/event-row-actions';
import { EventCancelDialogComponent } from './components/event-cancel-dialog/event-cancel-dialog';
import { EventPostponeDialogComponent } from './components/event-postpone-dialog/event-postpone-dialog';
```

Dans le décorateur `@Component`, ajouter ces composants à `imports` et retirer les dialogs inline correspondants.

Dans le template, remplacer les sections filtres/actions/dialogs par :

```html
<!-- Filtres -->
<app-event-filters (filtersChange)="onFiltersChange($event)"></app-event-filters>

<!-- Dans chaque ligne de table, remplacer les boutons inline par : -->
<app-event-row-actions
    [event]="event"
    [canEdit]="authService.canEditEvent"
    [canDelete]="authService.canDeleteEvent"
    [canCancel]="authService.canCancelOrPostpone"
    [canPostpone]="authService.canCancelOrPostpone"
    (view)="viewEvent($event)"
    (edit)="editEvent($event)"
    (cancel)="openCancelDialog($event)"
    (postpone)="openPostponeDialog($event)"
    (delete)="deleteEvent($event)">
</app-event-row-actions>

<!-- Dialogs -->
<app-event-cancel-dialog
    [(visible)]="cancelDialogVisible"
    [event]="selectedEvent"
    (confirmed)="confirmCancel($event)">
</app-event-cancel-dialog>

<app-event-postpone-dialog
    [(visible)]="postponeDialogVisible"
    [event]="selectedEvent"
    (confirmed)="confirmPostpone($event)">
</app-event-postpone-dialog>
```

Ajouter dans la classe les méthodes correspondantes :

```typescript
onFiltersChange(filters: EventFilters): void {
    this.searchKeyword  = filters.search;
    this.selectedType   = filters.type;
    this.selectedStatus = filters.status;
    this.applyFilters();
}

openCancelDialog(event: Event): void {
    this.selectedEvent      = event;
    this.cancelDialogVisible = true;
}

openPostponeDialog(event: Event): void {
    this.selectedEvent        = event;
    this.postponeDialogVisible = true;
}

confirmCancel(motif: string): void {
    if (!this.selectedEvent) return;
    this.eventService.cancelEvent(this.selectedEvent.id!, motif)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Événement annulé' });
                this.loadEvents();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erreur lors de l\'annulation' })
        });
}

confirmPostpone(newDate: Date): void {
    if (!this.selectedEvent) return;
    this.eventService.postponeEvent(this.selectedEvent.id!, newDate.toISOString())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Événement reporté' });
                this.loadEvents();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erreur lors du report' })
        });
}
```

Remplacer `OnDestroy` + `ngOnDestroy` par `DestroyRef` :

```typescript
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Dans le constructeur
private destroyRef = inject(DestroyRef);

// Toutes les subscriptions utilisent :
.pipe(takeUntilDestroyed(this.destroyRef))
```

- [ ] **Étape 11 : Build de vérification**

```
npx ng build --configuration development
```

Résultat attendu : build réussi. Si des erreurs `Cannot find module`, vérifier les chemins d'import.

- [ ] **Étape 12 : Commit**

```
git add src/app/pages/cge-events/
git commit -m "refactor: découper event-list en sous-composants (filtres, actions, dialogs)"
```

---

## Task 5 : Refactoring users — pagination serveur

**Fichiers :**
- Modifier : `src/app/pages/admin/users/users.ts`
- Créer : `src/app/pages/admin/users/components/user-table/user-table.ts`
- Créer : `src/app/pages/admin/users/components/user-table/user-table.html`
- Créer : `src/app/pages/admin/users/components/user-form-dialog/user-form-dialog.ts`
- Créer : `src/app/pages/admin/users/components/user-form-dialog/user-form-dialog.html`

**Interfaces :**
- `UserTableComponent` consomme : `users: UserAccount[]`, `loading: boolean`, `totalRecords: number`, `rows: number` ; produit : `(pageChange)` avec `{ page, size, search }`, `(edit)`, `(delete)`, `(roleEdit)`
- `UserFormDialogComponent` consomme : `user: UserAccount | null`, `visible: boolean`, `roles: string[]` ; produit : `(save)` avec `UserAccount`, `(cancel)`

- [ ] **Étape 1 : Définir l'interface `UserAccount` dans `src/app/models/user.model.ts`**

```typescript
export interface UserAccount {
    id?:       string;
    username:  string;
    email:     string;
    firstName: string;
    lastName:  string;
    roles:     string[];
    enabled:   boolean;
    createdAt?: string;
    lastLogin?: string;
}

export interface UserPageRequest {
    page:    number;
    size:    number;
    search?: string;
    role?:   string;
}

export interface UserPage {
    content:       UserAccount[];
    totalElements: number;
    totalPages:    number;
    size:          number;
    number:        number;
}
```

Exporter depuis `src/app/models/index.ts` :
```typescript
export { UserAccount, UserPageRequest, UserPage } from './user.model';
```

- [ ] **Étape 2 : Créer `user-table.ts`**

Créer `src/app/pages/admin/users/components/user-table/user-table.ts` :

```typescript
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { UserAccount } from '../../../../../models';
import { ROLE_META, getRoleLabel } from '../../../../../models';

export interface UserPageEvent {
    page:   number;
    size:   number;
    search: string;
}

@Component({
    selector: 'app-user-table',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, TagModule, ButtonModule,
        IconFieldModule, InputIconModule, InputTextModule
    ],
    templateUrl: './user-table.html'
})
export class UserTableComponent {
    @Input() users:        UserAccount[] = [];
    @Input() loading  = false;
    @Input() totalRecords = 0;
    @Input() rows     = 20;

    @Output() pageChange = new EventEmitter<UserPageEvent>();
    @Output() edit       = new EventEmitter<UserAccount>();
    @Output() delete     = new EventEmitter<UserAccount>();
    @Output() roleEdit   = new EventEmitter<UserAccount>();

    search = '';

    getRoleLabel = getRoleLabel;
    ROLE_META    = ROLE_META;

    onLazyLoad(event: TableLazyLoadEvent): void {
        const page = Math.floor((event.first ?? 0) / (event.rows ?? this.rows));
        this.pageChange.emit({ page, size: event.rows ?? this.rows, search: this.search });
    }

    onSearch(): void {
        this.pageChange.emit({ page: 0, size: this.rows, search: this.search });
    }
}
```

- [ ] **Étape 3 : Créer `user-table.html`**

Créer `src/app/pages/admin/users/components/user-table/user-table.html` :

```html
<div class="ut-toolbar">
    <label for="ut-search" class="sr-only">Rechercher un utilisateur</label>
    <p-iconfield iconPosition="left">
        <p-inputicon><i class="pi pi-search" aria-hidden="true"></i></p-inputicon>
        <input pInputText id="ut-search" type="text"
               [(ngModel)]="search"
               (input)="onSearch()"
               placeholder="Rechercher par nom, email…"
               autocomplete="off" />
    </p-iconfield>
</div>

<p-table [value]="users"
         [lazy]="true"
         [loading]="loading"
         [totalRecords]="totalRecords"
         [rows]="rows"
         [paginator]="true"
         [rowsPerPageOptions]="[10, 20, 50]"
         (onLazyLoad)="onLazyLoad($event)"
         [tableStyle]="{'min-width': '60rem'}"
         styleClass="p-datatable-sm">

    <ng-template pTemplate="header">
        <tr>
            <th scope="col">Nom</th>
            <th scope="col">Email</th>
            <th scope="col">Rôles</th>
            <th scope="col">Statut</th>
            <th scope="col" style="width:140px">Actions</th>
        </tr>
    </ng-template>

    <ng-template pTemplate="body" let-user>
        <tr>
            <td>{{ user.lastName }} {{ user.firstName }}</td>
            <td>{{ user.email }}</td>
            <td>
                <div class="flex flex-wrap gap-1">
                    <p-tag *ngFor="let role of user.roles"
                           [value]="getRoleLabel(role)"
                           severity="secondary">
                    </p-tag>
                </div>
            </td>
            <td>
                <p-tag [value]="user.enabled ? 'Actif' : 'Inactif'"
                       [severity]="user.enabled ? 'success' : 'danger'">
                </p-tag>
            </td>
            <td>
                <div class="flex gap-1" [attr.aria-label]="'Actions pour ' + user.lastName">
                    <p-button icon="pi pi-pencil"
                              ariaLabel="Modifier l'utilisateur"
                              [rounded]="true" [text]="true"
                              severity="secondary"
                              (onClick)="edit.emit(user)">
                    </p-button>
                    <p-button icon="pi pi-key"
                              ariaLabel="Gérer les rôles"
                              [rounded]="true" [text]="true"
                              severity="info"
                              (onClick)="roleEdit.emit(user)">
                    </p-button>
                    <p-button icon="pi pi-trash"
                              ariaLabel="Supprimer l'utilisateur"
                              [rounded]="true" [text]="true"
                              severity="danger"
                              (onClick)="delete.emit(user)">
                    </p-button>
                </div>
            </td>
        </tr>
    </ng-template>

    <ng-template pTemplate="emptymessage">
        <tr>
            <td colspan="5" style="text-align:center; padding: var(--space-8)">
                Aucun utilisateur trouvé
            </td>
        </tr>
    </ng-template>
</p-table>
```

- [ ] **Étape 4 : Créer `user-form-dialog.ts`**

Créer `src/app/pages/admin/users/components/user-form-dialog/user-form-dialog.ts` :

```typescript
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { UserAccount } from '../../../../../models';

const ALL_ROLES = [
    { label: 'Administrateur',      value: 'ADMIN' },
    { label: 'CGE',                 value: 'CGE' },
    { label: 'Directeur Cabinet',   value: 'DIRECTEUR_CABINET' },
    { label: 'Protocole',           value: 'PROTOCOLE' },
    { label: 'Secrétaire',          value: 'SECRETAIRE' },
    { label: 'Délégué',             value: 'DELEGUE' },
    { label: 'Utilisateur',         value: 'USER' }
];

@Component({
    selector: 'app-user-form-dialog',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        Dialog, ButtonModule, InputTextModule, MultiSelect, ToggleButtonModule
    ],
    templateUrl: './user-form-dialog.html'
})
export class UserFormDialogComponent implements OnChanges {
    @Input() user:    UserAccount | null = null;
    @Input() visible = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save          = new EventEmitter<Partial<UserAccount>>();
    @Output() cancelled     = new EventEmitter<void>();

    form!: FormGroup;
    allRoles = ALL_ROLES;
    isEdit   = false;

    constructor(private fb: FormBuilder) {
        this.buildForm(null);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['user'] || changes['visible']) {
            this.isEdit = !!this.user;
            this.buildForm(this.user);
        }
    }

    private buildForm(user: UserAccount | null): void {
        this.form = this.fb.group({
            username:  [user?.username  ?? '', [Validators.required, Validators.minLength(3)]],
            email:     [user?.email     ?? '', [Validators.required, Validators.email]],
            firstName: [user?.firstName ?? '', Validators.required],
            lastName:  [user?.lastName  ?? '', Validators.required],
            roles:     [user?.roles     ?? [], Validators.required],
            enabled:   [user?.enabled   ?? true]
        });
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.save.emit({ ...this.user, ...this.form.value });
        this.close();
    }

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancelled.emit();
    }
}
```

- [ ] **Étape 5 : Créer `user-form-dialog.html`**

Créer `src/app/pages/admin/users/components/user-form-dialog/user-form-dialog.html` :

```html
<p-dialog [(visible)]="visible"
          [modal]="true"
          [header]="isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'"
          [style]="{ width: '520px' }"
          [draggable]="false"
          (onHide)="close()">

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>

        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="flex flex-col gap-1">
                <label for="uf-lastname">Nom <span aria-hidden="true">*</span></label>
                <input pInputText id="uf-lastname" formControlName="lastName"
                       [class.ng-invalid]="form.get('lastName')?.invalid && form.get('lastName')?.touched" />
                <small class="text-red-500"
                       *ngIf="form.get('lastName')?.invalid && form.get('lastName')?.touched">
                    Nom requis
                </small>
            </div>
            <div class="flex flex-col gap-1">
                <label for="uf-firstname">Prénom <span aria-hidden="true">*</span></label>
                <input pInputText id="uf-firstname" formControlName="firstName"
                       [class.ng-invalid]="form.get('firstName')?.invalid && form.get('firstName')?.touched" />
            </div>
        </div>

        <div class="flex flex-col gap-1 mb-4">
            <label for="uf-email">Email <span aria-hidden="true">*</span></label>
            <input pInputText id="uf-email" type="email" formControlName="email"
                   [class.ng-invalid]="form.get('email')?.invalid && form.get('email')?.touched" />
            <small class="text-red-500"
                   *ngIf="form.get('email')?.errors?.['email'] && form.get('email')?.touched">
                Format email invalide
            </small>
        </div>

        <div class="flex flex-col gap-1 mb-4" *ngIf="!isEdit">
            <label for="uf-username">Nom d'utilisateur <span aria-hidden="true">*</span></label>
            <input pInputText id="uf-username" formControlName="username" />
        </div>

        <div class="flex flex-col gap-1 mb-4">
            <label for="uf-roles">Rôles <span aria-hidden="true">*</span></label>
            <p-multiselect id="uf-roles"
                           [options]="allRoles"
                           formControlName="roles"
                           placeholder="Sélectionner des rôles"
                           display="chip"
                           appendTo="body">
            </p-multiselect>
        </div>

        <div class="flex align-items-center gap-3">
            <label for="uf-enabled">Compte actif</label>
            <p-togglebutton id="uf-enabled"
                            formControlName="enabled"
                            onLabel="Actif"
                            offLabel="Inactif">
            </p-togglebutton>
        </div>
    </form>

    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="close()"></p-button>
        <p-button [label]="isEdit ? 'Enregistrer' : 'Créer'"
                  severity="success"
                  [disabled]="form.invalid"
                  (onClick)="submit()">
        </p-button>
    </ng-template>
</p-dialog>
```

- [ ] **Étape 6 : Mettre à jour `users.ts` pour utiliser la pagination lazy**

Dans `src/app/pages/admin/users/users.ts`, remplacer le chargement de tous les utilisateurs par :

```typescript
import { UserTableComponent, UserPageEvent } from './components/user-table/user-table';
import { UserFormDialogComponent } from './components/user-form-dialog/user-form-dialog';
import { UserAccount, UserPage } from '../../../models';
import { takeUntilDestroyed, DestroyRef, inject } from '@angular/core/rxjs-interop';

// Propriétés
users:        UserAccount[] = [];
totalRecords  = 0;
rows          = 20;
loading       = false;
dialogVisible = false;
selectedUser: UserAccount | null = null;

private destroyRef = inject(DestroyRef);

loadUsers(event: UserPageEvent): void {
    this.loading = true;
    this.userService.getUsers(event.page, event.size, event.search)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
            next: (page: UserPage) => {
                this.users        = page.content;
                this.totalRecords = page.totalElements;
                this.loading      = false;
            },
            error: () => this.loading = false
        });
}
```

> **Note :** Si `userService.getUsers()` n'existe pas encore côté backend, créer un stub temporaire qui retourne des données mockées.

- [ ] **Étape 7 : Build de vérification**

```
npx ng build --configuration development
```

- [ ] **Étape 8 : Commit**

```
git add src/app/pages/admin/users/ src/app/models/user.model.ts src/app/models/index.ts
git commit -m "refactor: découper users en sous-composants avec pagination serveur"
```

---

## Task 6 : Migration Reactive Forms — event-create et event-edit

**Fichiers :**
- Modifier : `src/app/pages/cge-events/event-create.ts`
- Modifier : `src/app/pages/cge-events/event-create.html`
- Modifier : `src/app/pages/cge-events/event-edit.ts`
- Modifier : `src/app/pages/cge-events/event-edit.html`

**Interfaces :**
- Produit : FormGroup `eventForm` avec validators ; validateur cross-field `endDateAfterStart`

- [ ] **Étape 1 : Ajouter le validateur cross-field dans `src/app/models/validators.ts`**

Créer `src/app/models/validators.ts` :

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valide que endDate >= startDate dans un FormGroup. */
export const endDateAfterStart: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('startDate')?.value;
    const end   = group.get('endDate')?.value;
    if (!start || !end) return null;
    return new Date(end) >= new Date(start) ? null : { endBeforeStart: true };
};
```

Exporter depuis `src/app/models/index.ts` :
```typescript
export { endDateAfterStart } from './validators';
```

- [ ] **Étape 2 : Refactorer `event-create.ts` — construire le FormGroup**

Dans `src/app/pages/cge-events/event-create.ts`, remplacer les propriétés two-way binding par un FormGroup :

```typescript
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { endDateAfterStart } from '../../models';

// Remplacer le constructeur existant
constructor(
    private fb:           FormBuilder,
    private eventService: EventService,
    private router:       Router,
    private messageService: MessageService
) {}

ngOnInit(): void {
    this.buildForm();
}

buildForm(): void {
    this.eventForm = this.fb.group({
        title:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
        description: [''],
        type:        [null, Validators.required],
        startDate:   [null, Validators.required],
        endDate:     [null, Validators.required],
        lieuType:    ['SALLE', Validators.required],
        pays:        [''],
        ville:       [''],
        salle:       [''],
        nomLieu:     [''],
        meetingLink: ['']
    }, { validators: endDateAfterStart });
}

get f() { return this.eventForm.controls; }

submit(): void {
    if (this.eventForm.invalid) {
        this.eventForm.markAllAsTouched();
        return;
    }
    const payload = { ...this.eventForm.value };
    this.eventService.createEvent(payload).subscribe({
        next: () => this.router.navigate(['/events']),
        error: () => this.messageService.add({ severity: 'error', summary: 'Erreur de création' })
    });
}
```

- [ ] **Étape 3 : Mettre à jour `event-create.html` pour utiliser le FormGroup**

Remplacer les `[(ngModel)]` par `formControlName` dans le template. Exemple pour le champ titre :

```html
<!-- AVANT -->
<input pInputText [(ngModel)]="title" id="event-title" />

<!-- APRÈS -->
<form [formGroup]="eventForm" (ngSubmit)="submit()" novalidate>
    <input pInputText formControlName="title" id="event-title"
           [class.ng-invalid]="f['title'].invalid && f['title'].touched" />
    <small class="text-red-500" *ngIf="f['title'].errors?.['required'] && f['title'].touched">
        Le titre est requis
    </small>
    <small class="text-red-500" *ngIf="f['title'].errors?.['minlength'] && f['title'].touched">
        3 caractères minimum
    </small>
```

Ajouter l'erreur cross-field après les champs de date :
```html
<small class="text-red-500"
       *ngIf="eventForm.errors?.['endBeforeStart'] && f['endDate'].touched">
    La date de fin doit être après la date de début
</small>
```

- [ ] **Étape 4 : Appliquer le même pattern à `event-edit.ts/html`**

Dans `event-edit.ts`, construire le FormGroup avec `patchValue()` une fois l'événement chargé :

```typescript
loadEvent(id: number): void {
    this.eventService.getEvent(id).subscribe(event => {
        this.event = event;
        this.eventForm.patchValue({
            title:       event.title,
            description: event.description,
            type:        event.type,
            startDate:   event.startDate ? new Date(event.startDate) : null,
            endDate:     event.endDate   ? new Date(event.endDate)   : null,
            lieuType:    event.lieuType  ?? 'SALLE',
            pays:        event.pays      ?? '',
            ville:       event.ville     ?? '',
            meetingLink: event.meetingLink ?? ''
        });
    });
}
```

- [ ] **Étape 5 : Build de vérification**

```
npx ng build --configuration development
```

- [ ] **Étape 6 : Commit**

```
git add src/app/pages/cge-events/event-create.ts src/app/pages/cge-events/event-create.html src/app/pages/cge-events/event-edit.ts src/app/pages/cge-events/event-edit.html src/app/models/validators.ts src/app/models/index.ts
git commit -m "refactor: migrer event-create et event-edit vers Reactive Forms"
```

---

## Task 7 : Accessibilité WCAG AA — audit et corrections

**Fichiers :**
- Modifier : tous les composants pages (fixes ciblés par fichier)

**Interfaces :**
- Pas d'interfaces nouvelles — corrections d'attributs HTML

- [ ] **Étape 1 : Audit et fix des boutons sans ariaLabel**

Chercher tous les `p-button` sans `ariaLabel` ni `label` avec cette commande :

```
npx ng lint 2>&1 | head -50
```

Puis grep manuel :
```
grep -rn 'icon="pi' src/app/pages/ | grep -v ariaLabel | grep -v label=
```

Pour chaque résultat : ajouter `ariaLabel="Description de l'action"`.

- [ ] **Étape 2 : Ajouter navigation clavier sur les lignes de table cliquables**

Dans tout composant avec `(click)` sur `<tr>` sans `tabindex`, ajouter :

```html
<tr (click)="onRowClick(item)"
    (keydown.enter)="onRowClick(item)"
    (keydown.space)="onRowClick(item)"
    tabindex="0"
    role="button"
    [attr.aria-label]="'Voir les détails de ' + item.title">
```

- [ ] **Étape 3 : Icônes décoratives — `aria-hidden="true"` systématique**

Dans tous les composants, chaque `<i class="pi pi-*">` qui ne porte pas d'information seul doit avoir `aria-hidden="true"` :

```html
<!-- AVANT -->
<i class="pi pi-calendar"></i>

<!-- APRÈS -->
<i class="pi pi-calendar" aria-hidden="true"></i>
```

- [ ] **Étape 4 : Labels formulaires — association `for`/`id`**

Vérifier que chaque `<label>` dans les formulaires a un attribut `for` correspondant à l'`id` de l'input :

```html
<label for="event-title">Titre</label>
<input pInputText id="event-title" formControlName="title" />
```

- [ ] **Étape 5 : Ajouter `prefers-reduced-motion` dans `styles.scss`**

Ajouter à la fin de `src/assets/styles.scss` :

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration:   0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration:  0.01ms !important;
        scroll-behavior:      auto !important;
    }
}
```

- [ ] **Étape 6 : Corriger les contrastes — remplacer les gris hardcodés**

Rechercher et remplacer dans les fichiers CSS :

| Remplacer | Par |
|-----------|-----|
| `color: #bbb` | `color: var(--text-color-secondary)` |
| `color: #999` | `color: var(--text-color-secondary)` |
| `color: #666` | `color: var(--text-color-secondary)` |
| `color: #333` | `color: var(--text-color)` |

- [ ] **Étape 7 : Build de vérification**

```
npx ng build --configuration development
```

- [ ] **Étape 8 : Commit**

```
git add src/app/pages/ src/assets/styles.scss
git commit -m "a11y: WCAG AA — ariaLabel, navigation clavier, contrastes, prefers-reduced-motion"
```

---

## Task 8 : Extraction des styles inline vers fichiers CSS dédiés

**Fichiers :**
- Modifier : `src/app/pages/cge-events/event-list.ts`
- Modifier : `src/app/pages/cge-events/event-detail.ts`
- Modifier : `src/app/pages/cge-dashboard/dashboard.ts`
- Modifier : `src/app/pages/cge-participants/participant-list.ts`
- Créer : fichiers `.css` correspondants

**Interfaces :**
- Pas d'interfaces nouvelles

- [ ] **Étape 1 : Pattern de migration pour chaque composant**

Pour chaque composant avec `styles: [...]` :

1. Créer le fichier CSS (ex: `event-list.css`) avec le contenu du tableau `styles`
2. Dans le `@Component`, remplacer :
```typescript
// AVANT
styles: [`
  .el-page { ... }
  /* 500 lignes */
`]

// APRÈS
styleUrls: ['./event-list.css']
```
3. Vérifier le build après chaque extraction

- [ ] **Étape 2 : Extraire les styles de `event-list.ts`**

Copier le contenu du tableau `styles` dans `src/app/pages/cge-events/event-list.css`. Remplacer `styles: [...]` par `styleUrls: ['./event-list.css']`.

- [ ] **Étape 3 : Extraire les styles de `event-detail.ts`**

Même opération → `src/app/pages/cge-events/event-detail.css`.

- [ ] **Étape 4 : Extraire les styles de `dashboard.ts`**

Même opération → `src/app/pages/cge-dashboard/dashboard.css`.

- [ ] **Étape 5 : Extraire les styles de `participant-list.ts`**

Même opération → `src/app/pages/cge-participants/participant-list.css`.

- [ ] **Étape 6 : Build de vérification globale**

```
npx ng build --configuration development
```

Résultat attendu : build réussi. Les composants conservent leur apparence exacte.

- [ ] **Étape 7 : Commit**

```
git add src/app/pages/
git commit -m "style: extraire les styles inline vers fichiers .css dédiés"
```

---

## Task 9 : CanDeactivate guard — prévenir la perte de données

**Fichiers :**
- Créer : `src/app/guards/unsaved-changes.guard.ts`
- Modifier : `src/app.routes.ts`

**Interfaces :**
- Produit : `UnsavedChangesGuard` + interface `HasUnsavedChanges { hasUnsavedChanges(): boolean }`
- Consomme : composants implémentant `HasUnsavedChanges` (event-create, event-edit, org-config)

- [ ] **Étape 1 : Créer `src/app/guards/unsaved-changes.guard.ts`**

```typescript
import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Observable, of } from 'rxjs';

export interface HasUnsavedChanges {
    hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> =
    (component): Observable<boolean> => {
        if (!component.hasUnsavedChanges()) {
            return of(true);
        }
        return new Observable(observer => {
            if (confirm('Des modifications non sauvegardées seront perdues. Quitter quand même ?')) {
                observer.next(true);
            } else {
                observer.next(false);
            }
            observer.complete();
        });
    };
```

- [ ] **Étape 2 : Implémenter `HasUnsavedChanges` dans `event-create.ts`**

```typescript
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

export class EventCreateComponent implements OnInit, HasUnsavedChanges {
    private submitted = false;

    hasUnsavedChanges(): boolean {
        return this.eventForm.dirty && !this.submitted;
    }

    submit(): void {
        this.submitted = true;
        // ... reste de la logique
    }
}
```

Même pattern dans `event-edit.ts` et `org-config.ts`.

- [ ] **Étape 3 : Brancher le guard dans `src/app.routes.ts`**

Dans le fichier de routes events, ajouter `canDeactivate` :

```typescript
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

// Route event-create
{
    path: 'create',
    loadComponent: () => import('./pages/cge-events/event-create').then(m => m.EventCreateComponent),
    canDeactivate: [unsavedChangesGuard]
},
// Route event-edit
{
    path: ':id/edit',
    loadComponent: () => import('./pages/cge-events/event-edit').then(m => m.EventEditComponent),
    canDeactivate: [unsavedChangesGuard]
},
// Route org-config
{
    path: 'config',
    loadComponent: () => import('./pages/admin/config/org-config').then(m => m.OrgConfigComponent),
    canDeactivate: [unsavedChangesGuard]
}
```

- [ ] **Étape 4 : Build de vérification**

```
npx ng build --configuration development
```

- [ ] **Étape 5 : Commit**

```
git add src/app/guards/unsaved-changes.guard.ts src/app.routes.ts src/app/pages/cge-events/event-create.ts src/app/pages/cge-events/event-edit.ts src/app/pages/admin/config/org-config.ts
git commit -m "feat: CanDeactivate guard — prévenir la perte de modifications non sauvegardées"
```

---

## Récapitulatif des tâches

| # | Tâche | Effort | Livrable testable |
|---|-------|--------|-------------------|
| 1 | Tokens design centralisés | 30 min | `ng build` ✓ |
| 2 | ROLE_META centralisé | 45 min | `tsc --noEmit` ✓ |
| 3 | Config Keycloak + SSO silencieux | 1h | `ng build` + login manuel ✓ |
| 4 | Refactoring event-list | 4–5h | Page events fonctionnelle ✓ |
| 5 | Refactoring users + pagination | 5–6h | Table paginée ✓ |
| 6 | Reactive Forms event-create/edit | 3–4h | Formulaire avec validation ✓ |
| 7 | Accessibilité WCAG AA | 2–3h | `ng build` + test lecteur d'écran ✓ |
| 8 | Extraction styles inline | 2h | `ng build` + rendu identique ✓ |
| 9 | CanDeactivate guard | 1h | Navigation bloquée avec données dirty ✓ |

**Total estimé : ~20–23h** (tâches prioritaires)
