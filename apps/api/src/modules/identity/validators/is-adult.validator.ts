import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isAdult } from '../utils/age.util';

/**
 * Validação de maioridade no DTO. É uma primeira barreira; a checagem
 * autoritativa também ocorre no service (defesa em profundidade, §1.2).
 */
@ValidatorConstraint({ name: 'isAdult', async: false })
export class IsAdultConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' && !(value instanceof Date)) return false;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return isAdult(date);
  }

  defaultMessage(): string {
    return 'É necessário ter 18 anos ou mais';
  }
}

export function IsAdult(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAdultConstraint,
    });
  };
}
