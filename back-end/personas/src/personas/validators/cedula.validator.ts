import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';

@ValidatorConstraint({ name: 'esCedulaValida', async: false })
export class EsCedulaValidaConstraint implements ValidatorConstraintInterface {
  validate(cedula: string, _args: ValidationArguments): boolean {
    if (!cedula || !/^\d{10}$/.test(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    const tercerDigito = parseInt(cedula[2], 10);
    if (tercerDigito >= 6) return false;

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula[i], 10) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    return digitoVerificador === parseInt(cedula[9], 10);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'El número de cédula ecuatoriana no es válido';
  }
}

export function EsCedulaValida(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: EsCedulaValidaConstraint,
    });
  };
}
