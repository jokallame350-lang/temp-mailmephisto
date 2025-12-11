export interface Persona {
  fullName: string;
  address: string;
  country: string;
  password: string;
  birthDate: string;
}

const FIRST_NAMES = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const STREETS = ["Maple Ave", "Oak St", "Pine Rd", "Cedar Ln", "Main St", "Washington Blvd", "Lakeview Dr", "Park Ave", "Sunset Blvd", "Broadway"];
const CITIES = ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA"];

export const generateRandomPersona = (): Persona => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const street = Math.floor(Math.random() * 900 + 100) + " " + STREETS[Math.floor(Math.random() * STREETS.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  
  // Strong password generation
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 14; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Random Birth Date (18-60 years old)
  const age = Math.floor(Math.random() * 42) + 18;
  const year = new Date().getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const birthDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  return {
    fullName: `${firstName} ${lastName}`,
    address: `${street}, ${city}`,
    country: "United States",
    password: password,
    birthDate: birthDate
  };
};