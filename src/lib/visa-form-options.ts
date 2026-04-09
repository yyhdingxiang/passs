import { countryCityMap, scenicMap } from "@/data/schengen-data";

export type CascaderOption = {
  value: string;
  label: string;
  textLabel?: string;
  disabled?: boolean;
  children?: CascaderOption[];
};

export type FormOption = {
  value: string;
  label: string;
};

export type CountryCityScenicSelection = {
  country: string;
  city: string;
  scenic: string;
};

export function buildCountryCityScenicOptions(): CascaderOption[] {
  return Object.keys(countryCityMap).map((country) => ({
    value: country,
    label: country,
    textLabel: country,
    children: (countryCityMap[country] || []).map((city) => ({
      value: city,
      label: city,
      textLabel: city,
      children: (scenicMap[city] || []).map(([scenicName]) => ({
        value: scenicName,
        label: scenicName,
        textLabel: scenicName
      }))
    }))
  }));
}

export function buildProvinceOptions(provinces: string[]): FormOption[] {
  return provinces.map((province) => ({
    value: province,
    label: province
  }));
}

export function buildCityOptions(cities: string[]): FormOption[] {
  return cities.map((city) => ({
    value: city,
    label: city
  }));
}

export function parseCascaderSelection(path: string[]): CountryCityScenicSelection {
  const [country, city, scenic] = path;
  return {
    country: country || "",
    city: city || "",
    scenic: scenic || ""
  };
}
