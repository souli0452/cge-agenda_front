import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AgendaYearService {

    private readonly STORAGE_KEY = 'cge_agenda_year';
    private readonly MIN_YEAR    = 2020;

    private readonly _year = signal<number>(this.loadFromStorage());

    readonly year          = this._year.asReadonly();
    readonly isCurrentYear = computed(() => this._year() === new Date().getFullYear());

    private loadFromStorage(): number {
        const stored  = localStorage.getItem(this.STORAGE_KEY);
        const parsed  = stored ? parseInt(stored, 10) : NaN;
        const current = new Date().getFullYear();
        return (!isNaN(parsed) && parsed >= this.MIN_YEAR && parsed <= current) ? parsed : current;
    }

    setYear(year: number): void {
        const current = new Date().getFullYear();
        if (year < this.MIN_YEAR || year > current) return;
        this._year.set(year);
        localStorage.setItem(this.STORAGE_KEY, String(year));
    }

    prev(): void {
        if (this._year() > this.MIN_YEAR) this.setYear(this._year() - 1);
    }

    next(): void {
        if (!this.isCurrentYear()) this.setYear(this._year() + 1);
    }

    resetToCurrentYear(): void {
        this.setYear(new Date().getFullYear());
    }

    get availableYears(): number[] {
        const current = new Date().getFullYear();
        const years: number[] = [];
        for (let y = current; y >= this.MIN_YEAR; y--) years.push(y);
        return years;
    }
}
