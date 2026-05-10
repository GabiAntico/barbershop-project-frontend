import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-settings-view',
  imports: [
    ReactiveFormsModule,
    InputText
  ],
  templateUrl: './settings-view.component.html',
  styleUrl: './settings-view.component.css',
  standalone: true
})
export class SettingsViewComponent implements OnInit {

  form!: FormGroup;
  savedDefaultEstimatedAmount: number | null = null;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      defaultEstimatedAmount: [0, [Validators.min(0)]]
    });

    this.settingsService.getSettings().subscribe({
      next: settings => {
        this.savedDefaultEstimatedAmount = settings.defaultEstimatedAmount ?? 0;
        this.form.patchValue({
          defaultEstimatedAmount: this.savedDefaultEstimatedAmount
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la configuracion'
        });
      }
    });
  }

  saveSettings(form: FormGroup) {
    if (form.invalid) {
      form.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Formulario invalido'
      });
      return;
    }

    const amount = form.get('defaultEstimatedAmount')!.value;

    this.settingsService.putSettings({
      defaultEstimatedAmount: amount === null || amount === '' ? 0 : Number(amount)
    }).subscribe({
      next: settings => {
        this.savedDefaultEstimatedAmount = settings.defaultEstimatedAmount ?? 0;
        this.form.patchValue({
          defaultEstimatedAmount: this.savedDefaultEstimatedAmount
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Configuracion guardada correctamente'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la configuracion'
        });
      }
    });
  }

  hasSettingsChanges(): boolean {
    return this.normalizeAmount(this.form.get('defaultEstimatedAmount')?.value) !== this.normalizeAmount(this.savedDefaultEstimatedAmount);
  }

  private normalizeAmount(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;

    return Number(value);
  }
}
