// src/services/cardService.ts

export interface CardData {
  number: string;
  expiry: string;
  cvv: string;
  scheme: 'Visa' | 'MasterCard';
}

// Luhn Algoritması (Geçerli kart numarası için)
const calculateLuhnCheckDigit = (numberPartial: string): number => {
  const digits = numberPartial.split('').map(Number);
  let sum = 0;
  let isSecond = true;

  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (isSecond) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isSecond = !isSecond;
  }
  
  return (10 - (sum % 10)) % 10;
};

export const generateCard = (scheme: 'Visa' | 'MasterCard' = 'Visa'): CardData => {
  let prefix = '4'; // Visa varsayılan
  let length = 16;

  if (scheme === 'MasterCard') {
    prefix = '5' + (Math.floor(Math.random() * 5) + 1).toString();
  }

  let number = prefix;
  while (number.length < length - 1) {
    number += Math.floor(Math.random() * 10).toString();
  }

  const checkDigit = calculateLuhnCheckDigit(number);
  number += checkDigit;

  const currentYear = new Date().getFullYear();
  const expMonth = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
  const expYear = (currentYear + Math.floor(Math.random() * 5) + 1).toString().slice(-2);
  const cvv = Math.floor(Math.random() * 900) + 100;

  return {
    number: number.match(/.{1,4}/g)?.join(' ') || number,
    expiry: `${expMonth}/${expYear}`,
    cvv: cvv.toString(),
    scheme
  };
};
