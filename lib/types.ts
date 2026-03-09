export interface Person {
  id: string
  name: string
  relationship: string
  email: string | null
  phone: string | null
  birthday: string | null
  bio: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  avatar_url: string | null
  parent1_id: string | null
  parent2_id: string | null
  nickname: string | null
  instagram: string | null
  occupation: string | null
  employer: string | null
  hometown: string | null
  education: string | null
  religion: string | null
  political_affiliation: string | null
  languages: string | null
  created_at: string
}

export interface Photo {
  id: string
  url: string
  caption: string | null
  person_id: string | null
  created_at: string
}
