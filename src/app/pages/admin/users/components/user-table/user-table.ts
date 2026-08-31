import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { ROLE_META, getRoleLabel } from '../../../../../models';

@Component({
    selector: 'app-user-table',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, TagModule, ButtonModule, TooltipModule,
        IconFieldModule, InputIconModule, InputTextModule, SkeletonModule
    ],
    templateUrl: './user-table.html'
})
export class UserTableComponent {
    @Input() users:        any[] = [];
    @Input() loading       = false;
    @Input() totalRecords  = 0;
    @Input() rows          = 20;
    @Input() viewMode: 'list' | 'card' = 'list';

    @Output() edit       = new EventEmitter<any>();
    @Output() delete     = new EventEmitter<any>();
    @Output() roleEdit   = new EventEmitter<any>();
    @Output() resetPwd   = new EventEmitter<any>();

    search = '';
    mobileUserPage = 0;
    readonly Math = Math;

    getRoleLabel = getRoleLabel;

    get filteredUsers(): any[] {
        if (!this.search.trim()) return this.users;
        const q = this.search.toLowerCase();
        return this.users.filter(u =>
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q)
        );
    }

    getRoleColor(role: string): string {
        return ROLE_META[role]?.color || '#607d8b';
    }

    getRoleBg(role: string): string {
        return ROLE_META[role]?.bgColor || '#F9FAFB';
    }

    getInitials(user: any): string {
        const f = (user.firstName || '').charAt(0);
        const l = (user.lastName  || '').charAt(0);
        return (f + l).toUpperCase() || user.username.charAt(0).toUpperCase();
    }
}
