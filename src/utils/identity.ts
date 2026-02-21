export interface FakeIdentity {
    name: string;
    birthday: string;
    phone: string;
    country: string;
    city: string;
    job: string;
    address: string;
}

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const jobs = ['QA Tester', 'Software Engineer', 'Data Analyst', 'Marketing Manager', 'Product Manager', 'Designer', 'Consultant', 'Teacher', 'Writer', 'Photographer', 'Auditor'];
const streets = ['Main St', 'Oak St', 'Pine St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Washington St', 'Lake St', 'Hill Rd', 'Park Ave'];

export const generateDeterministicIdentity = (email: string): FakeIdentity => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash);

    const fName = firstNames[idx % firstNames.length];
    const lName = lastNames[(idx >> 1) % lastNames.length];
    const city = cities[(idx >> 2) % cities.length];
    const job = jobs[(idx >> 3) % jobs.length];
    const street = streets[(idx >> 4) % streets.length];

    // Birthday between 18 and 60 years old
    const year = 2005 - (idx % 42);
    const month = (idx % 12) + 1;
    const day = (idx % 28) + 1;

    // Phone (US format)
    const area = (idx % 800) + 200;
    const pre = ((idx >> 1) % 800) + 200;
    const end = ((idx >> 2) % 9000) + 1000;

    const houseNo = (idx % 999) + 1;

    return {
        name: `${fName} ${lName}`,
        birthday: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        phone: `+1 (${area}) ${pre}-${end}`,
        country: 'United States',
        city,
        job,
        address: `${houseNo} ${street}, ${city}, USA`
    };
};
