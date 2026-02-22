import { COUNTRIES } from "@/constants/countries";

export default function findCountry(countryCode: string) {
  return COUNTRIES.find((country: any) => country.code === countryCode);
}
