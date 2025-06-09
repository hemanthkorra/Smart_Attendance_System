// src/app/validators/custom-validators.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const dateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startDateString = control.get('startDate')?.value;
  const endDateString = control.get('endDate')?.value;

  if (!startDateString || !endDateString) {
    return null; // Don't validate if dates are not entered yet. Required validator handles this.
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  // Basic check for invalid date strings (e.g., "abc")
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { 'invalidDateFormat': true };
  }

  if (startDate > endDate) {
    return { 'startDateAfterEndDate': true };
  }

  return null; // No validation errors
};