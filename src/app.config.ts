import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient,
         withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, LOCALE_ID,
         provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

// Traduction française globale des composants PrimeNG (calendrier, table, filtres,
// confirmations, upload, mot de passe...) — sans ça, PrimeNG affiche ses libellés
// par défaut en anglais quel que soit LOCALE_ID (qui ne couvre que le pipe date d'Angular).
const primeNgFrTranslation = {
    startsWith: 'Commence par',
    contains: 'Contient',
    notContains: 'Ne contient pas',
    endsWith: 'Se termine par',
    equals: 'Égal à',
    notEquals: 'Différent de',
    noFilter: 'Aucun filtre',
    lt: 'Inférieur à',
    lte: 'Inférieur ou égal à',
    gt: 'Supérieur à',
    gte: 'Supérieur ou égal à',
    is: 'Est',
    isNot: 'N\'est pas',
    before: 'Avant',
    after: 'Après',
    dateIs: 'La date est',
    dateIsNot: 'La date n\'est pas',
    dateBefore: 'La date est avant',
    dateAfter: 'La date est après',
    clear: 'Effacer',
    apply: 'Appliquer',
    matchAll: 'Tout correspondre',
    matchAny: 'Au moins un critère',
    addRule: 'Ajouter une règle',
    removeRule: 'Retirer la règle',
    accept: 'Oui',
    reject: 'Non',
    choose: 'Choisir',
    upload: 'Envoyer',
    cancel: 'Annuler',
    completed: 'Terminé',
    pending: 'En attente',
    fileSizeTypes: ['o', 'Ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'],
    dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    dayNamesShort: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
    dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
    monthNames: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    monthNamesShort: ['jan', 'fév', 'mar', 'avr', 'mai', 'jui', 'jui', 'aoû', 'sep', 'oct', 'nov', 'déc'],
    chooseYear: 'Choisir l\'année',
    chooseMonth: 'Choisir le mois',
    chooseDate: 'Choisir la date',
    prevDecade: 'Décennie précédente',
    nextDecade: 'Décennie suivante',
    prevYear: 'Année précédente',
    nextYear: 'Année suivante',
    prevMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    prevHour: 'Heure précédente',
    nextHour: 'Heure suivante',
    prevMinute: 'Minute précédente',
    nextMinute: 'Minute suivante',
    prevSecond: 'Seconde précédente',
    nextSecond: 'Seconde suivante',
    am: 'am',
    pm: 'pm',
    today: 'Aujourd\'hui',
    weekHeader: 'Sem.',
    firstDayOfWeek: 1,
    dateFormat: 'dd/mm/yy',
    weak: 'Faible',
    medium: 'Moyen',
    strong: 'Fort',
    passwordPrompt: 'Saisissez un mot de passe',
    emptyMessage: 'Aucun résultat trouvé',
    emptyFilterMessage: 'Aucun résultat trouvé',
    emptySearchMessage: 'Aucun résultat trouvé',
    emptySelectionMessage: 'Aucun élément sélectionné',
    selectionMessage: '{0} élément(s) sélectionné(s)',
    searchMessage: '{0} résultat(s) disponible(s)',
    fileChosenMessage: '{0} fichier(s)',
    noFileChosenMessage: 'Aucun fichier sélectionné',
    aria: {
        trueLabel: 'Vrai',
        falseLabel: 'Faux',
        nullLabel: 'Non sélectionné',
        star: '1 étoile',
        stars: '{star} étoiles',
        selectAll: 'Tous les éléments sélectionnés',
        unselectAll: 'Tous les éléments désélectionnés',
        close: 'Fermer',
        previous: 'Précédent',
        next: 'Suivant',
        navigation: 'Navigation',
        scrollTop: 'Retour en haut',
        moveTop: 'Déplacer en premier',
        moveUp: 'Déplacer vers le haut',
        moveDown: 'Déplacer vers le bas',
        moveBottom: 'Déplacer en dernier',
        moveToTarget: 'Déplacer vers la cible',
        moveToSource: 'Déplacer vers la source',
        moveAllToTarget: 'Tout déplacer vers la cible',
        moveAllToSource: 'Tout déplacer vers la source',
        pageLabel: 'Page {page}',
        firstPageLabel: 'Première page',
        lastPageLabel: 'Dernière page',
        nextPageLabel: 'Page suivante',
        prevPageLabel: 'Page précédente',
        rowsPerPageLabel: 'Lignes par page',
        jumpToPageDropdownLabel: 'Aller à la page',
        jumpToPageInputLabel: 'Aller à la page',
        selectRow: 'Ligne sélectionnée',
        unselectRow: 'Ligne désélectionnée',
        expandRow: 'Ligne développée',
        collapseRow: 'Ligne réduite',
        showFilterMenu: 'Afficher le menu de filtre',
        hideFilterMenu: 'Masquer le menu de filtre',
        filterOperator: 'Opérateur de filtre',
        filterConstraint: 'Contrainte de filtre',
        editRow: 'Modifier la ligne',
        saveEdit: 'Enregistrer la modification',
        cancelEdit: 'Annuler la modification',
        listView: 'Vue liste',
        gridView: 'Vue grille',
        slide: 'Diapositive',
        slideNumber: '{slideNumber}',
        zoomImage: 'Zoomer l\'image',
        zoomIn: 'Zoomer',
        zoomOut: 'Dézoomer',
        rotateRight: 'Pivoter à droite',
        rotateLeft: 'Pivoter à gauche',
        listLabel: 'Liste des options'
    }
};

const ascelcGreenScale = {
    50:  '#e5f4ec',
    100: '#bce4cd',
    200: '#90d1ac',
    300: '#5fbd87',
    400: '#2da861',
    500: '#009640',
    600: '#008539',
    700: '#006e2f',
    800: '#005122',
    900: '#003416',
    950: '#001d0c'
};

const AscelcTheme = definePreset(Aura, {
    primitive: {
        // Aligne la palette "green" interne de PrimeNG (utilisée par severity="success"
        // sur p-tag/p-button/p-message) sur le vert de marque ASCE-LC, au lieu du vert
        // Tailwind par défaut (#22c55e) qui produisait un vert différent du reste de l'app.
        green: ascelcGreenScale
    },
    semantic: {
        primary: ascelcGreenScale
    }
});
import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';
import { appRoutes } from './app.routes';
import { initializeKeycloak } from '@/init/keycloak-init.factory';
import { errorInterceptor } from '@/interceptors/error.interceptor';
import { PermissionService } from '@/service/permission.service';
import { EspaceContextService } from '@/service/espace-context.service';

registerLocaleData(localeFr);

class AppErrorHandler implements ErrorHandler {
    handleError(error: any): void {
        if (error?.code === 5104 || error?.message?.includes('NG05104') || error?.message?.includes('app-root')) return;
        console.error(error);
    }
}

export const appConfig: ApplicationConfig = {
    providers: [
        { provide: LOCALE_ID, useValue: 'fr-FR' },
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            appRoutes,
            withInMemoryScrolling({
                anchorScrolling: 'enabled',
                scrollPositionRestoration: 'enabled'
            })
        ),
        provideHttpClient(withFetch(), withInterceptors([errorInterceptor]), withInterceptorsFromDi()),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: AscelcTheme,
                options: { darkModeSelector: '.app-dark' }
            },
            translation: primeNgFrTranslation
        }),
        { provide: ErrorHandler, useClass: AppErrorHandler },
        ConfirmationService,
        KeycloakService,
        {
            provide: APP_INITIALIZER,
            useFactory: initializeKeycloak,
            multi: true,
            deps: [KeycloakService, HttpClient, PermissionService, EspaceContextService]
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: KeycloakBearerInterceptor,
            multi: true
        }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
    ]
};