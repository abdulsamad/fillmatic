const namesByRegion = {
  // English Names
  english: {
    firstNames: ['John', 'Jane', 'Michael', 'Emily', 'Robert', 'Linda', 'Michael'],
    lastNames: ['Doe', 'Smith', 'Brown', 'Johnson', 'Taylor', 'Anderson', 'Jackson'],
  },
  // Spanish Names
  spanish: {
    firstNames: ['Miguel', 'María', 'José', 'Carmen', 'Carlos', 'Isabella'],
    lastNames: ['Hernández', 'García', 'Martínez', 'Rodríguez', 'González', 'López'],
  },
  // French Names
  french: {
    firstNames: ['Étienne', 'Chloé', 'Jean', 'Sophie', 'Louis', 'Amélie'],
    lastNames: ['Dupont', 'Lefèvre', 'Durand', 'Moreau', 'Laurent', 'Roux'],
  },
  // Chinese Names
  chinese: {
    firstNames: ['Wei', 'Li', 'Jing', 'Mei', 'Chen', 'Xiao'],
    lastNames: ['Wang', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang'],
  },
  // Japanese Names
  japanese: {
    firstNames: ['Haruto', 'Yui', 'Yuki', 'Sakura', 'Takumi', 'Aoi'],
    lastNames: ['Tanaka', 'Sato', 'Yamamoto', 'Kobayashi', 'Nakamura', 'Kato'],
  },
  // Indian Names
  indian: {
    firstNames: ['Rahul', 'Priya', 'Arjun', 'Lakshmi', 'Vikram', 'Asha', 'Shahrukh'],
    lastNames: ['Sharma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Desai', 'Khan'],
  },
  // Russian Names
  russian: {
    firstNames: ['Alexei', 'Svetlana', 'Dmitry', 'Anastasia', 'Ivan', 'Olga'],
    lastNames: ['Ivanov', 'Petrova', 'Sidorov', 'Smirnov', 'Volkov', 'Kuznetsov'],
  },
  // Arabic Names
  arabic: {
    firstNames: ['Ahmed', 'Fatima', 'Mohammed', 'Aisha', 'Ali', 'Zainab'],
    lastNames: ['Hassan', 'Ali', 'Mohamed', 'Saleh', 'Khan', 'Ahmad'],
  },
  // German Names
  german: {
    firstNames: ['Hans', 'Greta', 'Lukas', 'Anna', 'Markus', 'Lena'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Becker'],
  },
  // Korean Names
  korean: {
    firstNames: ['Ji-ho', 'Soo-jin', 'Min-woo', 'Ha-na', 'Dong-hyun', 'Eun-jung'],
    lastNames: ['Kim', 'Park', 'Lee', 'Choi', 'Jung', 'Kang'],
  },
  // Brazilian Names
  brazilian: {
    firstNames: ['João', 'Ana', 'Pedro', 'Fernanda', 'Lucas', 'Mariana'],
    lastNames: ['Silva', 'Pereira', 'Santos', 'Costa', 'Oliveira', 'Sousa'],
  },
  // Italian Names
  italian: {
    firstNames: ['Luca', 'Francesca', 'Marco', 'Giulia', 'Antonio', 'Alessandra'],
    lastNames: ['Rossi', 'Bianchi', 'Esposito', 'Romano', 'Ricci', 'Marino'],
  },
  // Nigerian Names
  nigerian: {
    firstNames: ['Chinedu', 'Amina', 'Olusegun', 'Ngozi', 'Ifeanyi', 'Adanna'],
    lastNames: ['Okeke', 'Bello', 'Adams', 'Abimbola', 'Oluwaseun', 'Ibrahim'],
  },
  // Greek Names
  greek: {
    firstNames: ['Nikos', 'Elena', 'Giorgos', 'Maria', 'Dimitrios', 'Katerina'],
    lastNames: ['Papadopoulos', 'Karatza', 'Nikolaou', 'Georgiou', 'Constantinou', 'Dimitriou'],
  },
  // Turkish Names
  turkish: {
    firstNames: ['Mehmet', 'Aylin', 'Ahmet', 'Leyla', 'Emre', 'Seda'],
    lastNames: ['Yildiz', 'Demir', 'Kaya', 'Şahin', 'Akar', 'Öztürk'],
  },
  // Scandinavian Names
  scandinavian: {
    firstNames: ['Erik', 'Astrid', 'Björn', 'Ingrid', 'Lars', 'Sigrid'],
    lastNames: ['Lindberg', 'Nielsen', 'Bjork', 'Svensson', 'Hansen', 'Olsen'],
  },
  // Thai Names
  thai: {
    firstNames: ['Somsak', 'Pimchanok', 'Anurak', 'Duangkamol', 'Somchai', 'Kanya'],
    lastNames: ['Kiatbanjerd', 'Wattanachai', 'Srisai', 'Thongchai', 'Suwan', 'Chaiyaporn'],
  },
  // Vietnamese Names
  vietnamese: {
    firstNames: ['Nguyen', 'Tran', 'Phuong', 'Duy', 'Huong', 'Anh'],
    lastNames: ['Thi', 'Le', 'Nguyen', 'Pham', 'Bui', 'Hoang'],
  },
  // Indigenous Names
  indigenous: {
    firstNames: ['Tayen', 'Kiona', 'Aponi', 'Nashoba', 'Kele', 'Tala'],
    lastNames: ['Keeyama', 'Makah', 'Chilcoat', 'Mato', 'Seki', 'Zuni'],
  },
  // Polish Names
  polish: {
    firstNames: ['Łukasz', 'Michał', 'Agnieszka', 'Zofia', 'Krzysztof', 'Magdalena'],
    lastNames: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kamiński', 'Lewandowski'],
  },
  // Icelandic Names
  icelandic: {
    firstNames: ['Þór', 'Björn', 'Guðrún', 'Sigríður', 'Ólafur', 'Edda'],
    lastNames: ['Jónsson', 'Guðmundsdóttir', 'Einarsson', 'Ólafsdóttir', 'Þórðarson', 'Sigurðardóttir'],
  },
  // Hungarian Names
  hungarian: {
    firstNames: ['István', 'László', 'Éva', 'Katalin', 'Zoltán', 'Ildikó'],
    lastNames: ['Nagy', 'Kovács', 'Szabó', 'Tóth', 'Varga', 'Molnár'],
  },
  // Portuguese Names
  portuguese: {
    firstNames: ['João', 'Luís', 'Ana', 'Inês', 'Manuel', 'Beatriz'],
    lastNames: ['Silva', 'Santos', 'Pereira', 'Oliveira', 'Sousa', 'Fernandes'],
  },
  // Dutch Names
  dutch: {
    firstNames: ['Jan', 'Sanne', 'Pieter', 'Emma', 'Jeroen', 'Lisa'],
    lastNames: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'Bakker', 'Visser'],
  },
}

type RegionTypes = keyof typeof namesByRegion

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export interface Name {
  firstName: string
  lastName: string
}

export function generateNames(count: number = 1, region?: RegionTypes): Name[] {
  const names: Name[] = []
  const regions = region ? [region] : (Object.keys(namesByRegion) as RegionTypes[])

  for (let i = 0; i < count; i++) {
    const selectedRegion = getRandomElement(regions)
    const { firstNames, lastNames } = namesByRegion[selectedRegion]

    const maxNamesPerRegion = Math.min(firstNames.length, lastNames.length)
    if (names.length >= maxNamesPerRegion && region) {
      console.warn(`Maximum number of unique names (${maxNamesPerRegion}) for the specified region has been reached.`)
      break
    }

    const firstName = getRandomElement(firstNames)
    const lastName = getRandomElement(lastNames)

    names.push({
      firstName,
      lastName,
    })
  }

  return names
}
