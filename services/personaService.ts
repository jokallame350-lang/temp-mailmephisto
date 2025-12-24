// src/services/personaService.ts

export interface Persona {
  fullName: string;
  username: string; // <-- EKSİK OLAN BU SATIRDI
  address: string;
  job: string;
}

const FIRST_NAMES = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"];
const STREETS = ["Maple", "Oak", "Cedar", "Pine", "Washington", "Lake", "Hill", "Sunset", "Highland", "Main"];
const CITIES = ["Springfield", "Rivertown", "Lakeside", "Centerville", "Mapleton", "Oakwood", "Franklin", "Clinton"];
const JOBS = ["Software Engineer", "Data Analyst", "Product Manager", "Graphic Designer", "Marketing Specialist", "Consultant", "Teacher", "Nurse", "Sales Representative", "Accountant"];

export const generateRandomPersona = (): Persona => {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const street = STREETS[Math.floor(Math.random() * STREETS.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const number = Math.floor(Math.random() * 9000) + 100;
  
  // Username oluşturma mantığı
  const username = `${first.toLowerCase()}${last.toLowerCase()}${Math.floor(Math.random()*99)}`;

  return {
    fullName: `${first} ${last}`,
    username: username,
    address: `${number} ${street} Ave, ${city}`,
    job: JOBS[Math.floor(Math.random() * JOBS.length)]
  };
};
