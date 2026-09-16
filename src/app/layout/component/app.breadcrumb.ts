import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    imports: [CommonModule, RouterModule, BreadcrumbModule],
    template: `<p-breadcrumb [model]="items" [home]="home" styleClass="app-breadcrumb" />`
})
export class AppBreadcrumb {
    private router         = inject(Router);
    private activatedRoute = inject(ActivatedRoute);
    private destroyRef     = inject(DestroyRef);

    items: MenuItem[] = [];
    home: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };

    constructor() {
        this.buildBreadcrumb();
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => this.buildBreadcrumb());
    }

    private buildBreadcrumb(): void {
        const items: MenuItem[] = [];
        let route: ActivatedRoute | null = this.activatedRoute.root;
        let url = '';

        while (route) {
            if (!route.snapshot) break;

            const segments = route.snapshot.url.map(s => s.path);
            if (segments.length) url += '/' + segments.join('/');

            const breadcrumb = route.snapshot.data['breadcrumb'] as string | undefined;
            if (breadcrumb) {
                const labels = breadcrumb.split(',');
                labels.forEach((label, i) => {
                    const isLast = i === labels.length - 1;
                    items.push(isLast ? { label, routerLink: url } : { label });
                });
            }
            route = route.firstChild;
        }

        this.items = items;
    }
}
